const express = require("express");
const axios = require("axios");
const router = express.Router();
const URL = require("url");
const {
	bilibili,
	mgtv,
	tencentvideo,
	youku,
	iqiyi
} = require("./api/base");
const list = [bilibili, mgtv, tencentvideo, youku, iqiyi];
const memory = require("../utils/memory");
const leancloud = require("../utils/leancloud");
const rateLimit = require('express-rate-limit');

// 访问频率限制
const MAX_count_today = 2000;
const allowlist = ['::1', '::ffff:127.0.0.1'];
const apiLimiter = rateLimit({
	windowMs: 2 * 60 * 1000, // 2 minutes
	max: 8, // limit each IP to 8 requests per windowMs
	message: 'Too many requests from this IP, please try again later',
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	skipFailedRequests: true, // Don't count failed requests (status >= 400)
	skip: (request, response) => allowlist.includes(request.ip),
});

async function build_response(url, req) {
	for (let q = new URLSearchParams(URL.parse(url).query); q.has("url");) {
		console.log("Redirecting to", url);
		url = q.get("url");
		q = new URLSearchParams(URL.parse(url).query);
	}
	console.log("Real url:", url);
	try {
		await axios.get(url, {
			headers: { "Accept-Encoding": "gzip,deflate,compress" }
		});
	} catch (e) {
		console.log(e);
		return { msg: "传入的链接非法！请检查链接是否能在浏览器正常打开" };
	}
	let fc = undefined;
	for (let item of list) {
		if (url.indexOf(item.domain) !== -1) {
			fc = item;
		}
	}
	if (fc === undefined) {
		return { "msg": "不支持的视频网址" };
	}
	let ret;
	try {
		ret = await fc.work(url);
	} catch (e) {
		console.log(e);
		let err = JSON.stringify(e, Object.getOwnPropertyNames(e));
		err = JSON.parse(err);
		leancloud.add("DanmakuError", {
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
	memory(); //显示内存使用量
	try {
		if (ret.msg !== "ok") {
			res.status(403).send(ret.msg);
			return;
		} else if (download) {
			res.attachment(ret.title + ".xml");
		} else {
			res.type("application/xml");
		}
		//B站视频，直接重定向
		if (ret.url)
			res.redirect(ret.url);
		else
			res.render("danmaku-xml", { contents: ret.content });
	} catch (e) {
		console.log("返回响应出错，可能ip被封禁");
	}
}

async function index(req, res) {
	const urls = [mgtv.example_urls[0], bilibili.example_urls[0], tencentvideo.example_urls[0], youku.example_urls[0], iqiyi.example_urls[0]];
	const path = req.protocol + "://" + req.headers.host + req.originalUrl;
	res.render("danmaku", {
		path,
		urls
	});
}

/* GET home page. */
router.get("/", apiLimiter, async function (req, res) {
	leancloud.add("DanmakuAccess", {
		remoteIP: req.ip,
		url: req.query.url,
		UA: req.headers["user-agent"]
	});
	// 查询该IP今日访问次数
	leancloud.danmakuQuery(leancloud.currentDay(), req.ip).then((count) => {
		console.log("访问次数：", req.ip, count);
		if (count > MAX_count_today) {
			res.status(403).send("今日访问次数过多，请明日再试！");
			return;
		}
	});
	//检查是否包含URL参数
	if (!req.query.url) index(req, res); else resolve(req, res);
});

router.get("/pageinfo", async function (req, res) {
	const promises = [
		leancloud.danmakuQuery(leancloud.currentDay()),
		leancloud.danmakuQuery(leancloud.lastDay()),
		leancloud.danmakuQuery(leancloud.currentMonth())
	];
	const [today_visited, lastday_visited, month_visited] = await Promise.all(promises);
	res.json({
		today_visited,
		lastday_visited,
		month_visited
	});
});

module.exports = router;
