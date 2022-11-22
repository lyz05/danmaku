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

async function build_response(url, req) {
	for (let q = new URLSearchParams(URL.parse(url).query);q.has("url");) {
		console.log("Redirecting to", url);
		url = q.get("url");
		q = new URLSearchParams(URL.parse(url).query);
	}
	console.log("Real url:", url);
	try {
		await axios.get(url);
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

/* GET home page. */
router.get("/", async function (req, res) {
	leancloud.add("DanmakuAccess", {
		remoteIP: req.ip,
		url: req.query.url,
		UA: req.headers["user-agent"]
	});
	//检查是否包含URL参数
	if (!req.query.url) {
		const urls = [mgtv.example_urls[0], bilibili.example_urls[0], tencentvideo.example_urls[0], youku.example_urls[0], iqiyi.example_urls[0]];
		const path = req.protocol + "://" + req.headers.host + req.originalUrl;
		res.render("danmaku", {
			path,
			urls
		});
	} else {
		const url = req.query.url;
		const download = (req.query.download === "on");
		const ret = await build_response(url, req);
		memory(); //显示内存使用量
		if (ret.msg !== "ok") {
			res.status(403)
				.send(ret.msg);
		} else if (download) {
			res.attachment(ret.title + ".xml");
			res.end(ret.content);
		} else {
			res.type("application/xml");
			res.end(ret.content);
		}
	}
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
