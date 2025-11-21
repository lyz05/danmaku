import express from "express";
import axios from "axios";
import { createSourceList } from "./sources.mjs";
import db from "../utils/db.js";

const router = express.Router();
const list = createSourceList();
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// 返回对象{msg: "ok", title: "标题", content: []}
async function build_response(url, req) {
	// 测试url是否能下载
	try {
		const response = await axios.get(url, {
			headers: { 
				"Accept-Encoding": "gzip,deflate,compress",
				"User-Agent": UA
			},
			maxRedirects: 10
		});
		url = response.request.res.responseUrl || url;
        console.log("重定向后最终URL:", url);
	} catch (e) {
		console.log("尝试打开传入页面失败" + e.message);
		// 如果是 403 错误，不报错，继续执行
		if (e.response && e.response.status === 403) {
			console.log("访问视频页面 403 错误，有可能被防火墙拦了");
		} else {
			return { msg: "传入的链接非法！请检查链接能否能在浏览器正常打开" };
		}
	}
	// 循环找到对应的解析器
	let fc = undefined;
	for (let item of list) {
		if (url.indexOf(item.domain) !== -1) {
			fc = item;
		}
	}
	// 找不到对应的解析器
	if (fc === undefined) {
		return { "msg": "不支持的视频网址" };
	}
	// 捕获所有错误并添加日志
	let ret;
	try {
		ret = await fc.work(url);
	} catch (e) {
		console.log("全局错误捕获，详情查阅数据库", e);
		let err = JSON.stringify(e, Object.getOwnPropertyNames(e));
		db.errorInsert({
			ip: req.ip,
			url,
			err
		});
		return { msg: "弹幕解析过程中程序报错退出，请等待管理员修复！或者换条链接试试！" };
	}
	return ret;
}

async function resolve(req, res) {
	const url = req.query.url;
	const download = (req.query.download === "on");
	const ret = await build_response(url, req);
	if (ret.msg !== "ok") {
		res.status(403).send(ret.msg);
		return;
	} else if (download) {
		res.attachment(ret.title + ".xml");
	} else {
		res.type("application/xml");
	}
	// 记录视频信息
	db.videoInfoInsert({url,title:ret.title})
	//B站视频，直接重定向
	if (ret.url) {
		res.redirect(ret.url);
	} else {
		console.log("标题：", ret.title, "弹幕数量:", ret.content.length);
		res.set('Cache-Control', 'public, max-age=86400'); // 缓存一天
		res.render("danmaku-xml", { contents: ret.content });
	}
}

async function index(req, res) {
	const urls = list.map(item => item.example_urls[0]);
	const names = list.map(item => item.name);
	const domains = list.map(item => item.domain);
	const path = req.protocol + "://" + req.headers.host + req.originalUrl;
	res.render("danmaku", {
		path,
		urls,
		names,
		domains,
	});
}

router.get("/api/home-data", async (req, res) => {
    try {
        const [resolve_info, hotlist] = await Promise.all([
            db.accessCountQuery(),
            db.hotlistQuery()
        ]);
        res.json({ resolve_info, hotlist });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "查询失败" });
    }
});

/* GET home page. */
router.get("/", async function (req, res) {
	db.accessInsert({
		ip: req.ip,
		url: req.query.url,
		UA: req.headers["user-agent"]
	});
	//检查是否包含URL参数
	if (!req.query.url) index(req, res); else resolve(req, res);
});

router.get("/delete", async function (req, res) {
	const rows = db.deleteAccess();
	res.send(`成功请求删除三个月以前的记录，删除情况请查看日志`);
});

// module.exports = router;
export default router;