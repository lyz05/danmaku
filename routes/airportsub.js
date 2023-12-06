const express = require("express");
const router = express.Router();
const oss = require("../utils/oss");
const yaml = require("js-yaml");
const cookie = require("cookie");
const {filesize} = require("filesize");
const moment = require("moment");
const axios = require("axios");
const leancloud = require("../utils/leancloud");


// TODO 迁移到leancloud
function getuserinfo(headers) {
	if (!headers)
		return undefined;
	const str = headers["subscription-userinfo"];
	if (str === undefined) {
		return undefined;
	}
	const dic = cookie.parse(str);
	dic["total_use"] = 1 * dic.upload + 1 * dic.download;
	dic["use_percent"] = (100.0 * dic.total_use / dic.total).toFixed(2);
	const now_time = Math.floor(Date.now() / 1000);
	const end_time = dic.expire;
	dic["date_percent"] = (100.0 * (1-(end_time - now_time) / (3600 * 24 * 30.0))).toFixed(2);

	dic["total_use"] = filesize(dic["total_use"], {base: 2, standard: "jedec"});
	dic.total = filesize(dic.total, {base: 2, standard: "jedec"});
	dic.expire = moment(dic.expire * 1000).format("YYYY-MM-DD");
	return dic;
}

async function updateDatabase() {
	const database = await oss.get("SUB/database.yaml",true);
	try {
		return yaml.load(database);
	} catch (e) {
		console.log(e);
	}
}

// 缓存数据库
let database;
updateDatabase().then(ret => database = ret);

/* GET users listing. */
router.get("/", async function (req, res) {
	leancloud.add("SubAccess", {
		ip: req.ip,
		ua: req.headers["user-agent"],
		user: req.query.user,
		ctype: req.query.ctype
	});
	if (req.query.user) {
		const userinfo = database.user[req.query.user];
		if (userinfo) {
			const expireDate = new Date(userinfo.expire);
			const now = new Date();
			if (now < expireDate) {
				if (req.query.ctype) {
					const subinfo = database.suburl[req.query.ctype];
					//返回指定订阅信息
					if (subinfo) {
						// 判断是否要生成加速链接，是否为订阅转换
						if (!req.headers['subconverter-request']) {
							const url = await oss.signurl("SUB/" + req.query.ctype, true);
							res.redirect(url);
						} else {
							const ret = await oss.get("SUB/" + req.query.ctype);
							res.type("text/plain").end(ret);
						}
					} else {
						res.status(404).send("Not Found 找不到这种订阅类型");
					}
				} else {
					// 更新数据库
					database = await updateDatabase();
					// 缓存所有的协程
					let promises = [];
					const path = req.protocol + "://" + req.headers.host + req.originalUrl;
					const tgproxys = database.telegram;
					const ctypes = Object.keys(database.suburl);
					let ret = {};
					for (const key of ctypes)
						promises.push(oss.head("SUB/" + key,true));
					const headers = await Promise.all(promises)
					for (const i in ctypes) {
						ret[ctypes[i]] = getuserinfo(headers[i]);
					}
					res.render("airportsub", {ret, path, tgproxys, expire: userinfo.expire});
				}
			} else {
				res.send("您的订阅已过期，请联系管理员");
			}
		} else {
			res.status(404).send("Not Found 找不到这个用户");
		}
	} else {
		res.status(400).send("Bad Request 缺少参数");
	}
});

router.get("/cache", async function (req, res) {
	database = await updateDatabase();
	let messages = [];
	// 缓存所有的协程
	let promises = [];
	for (let key in database.suburl) {
		const url = database.suburl[key].url;
		const params = database.suburl[key].params;
		let headers = database.suburl[key].headers;	
		if (params && params.url) {
			params.url = [params.url].flat().join("|");
		}
		if (!url) continue;
		// 修复 Z_BUF_ERROR 的错误
		if (headers)
			headers["Accept-Encoding"] = "gzip,deflate,compress";
		promises.push(axios.get(url, {params,headers}));
	}
	Promise.all(promises).then(values => {
		promises = [];
		for (let i = 0; i < values.length; i++) {
			const res = values[i];
			const key = Object.keys(database.suburl)[i];
			messages.push({title: "Download", key, status: res.status});
			const userinfo = res.headers["subscription-userinfo"];
			console.log(userinfo)
			// 设置强制下载并设置文件名
			const headers = {
				"Content-type": "text/plain; charset=utf-8",
				"content-disposition": `attachment; filename=${key}`,
			};
			if (userinfo) {
				const base64userinfo = Buffer.from(userinfo).toString("base64");
				headers["x-oss-persistent-headers"] = "Subscription-Userinfo:" + base64userinfo;
			}
			promises.push(oss.put("SUB/" + key, res.data, headers));
		}
		Promise.all(promises).then(values => {
			for (let i = 0; i < values.length; i++) {
				const res = values[i];
				const key = Object.keys(database.suburl)[i];
				messages.push({title: "Upload", key, status: res.res.status});
			}
			res.json(messages);
		});
	});
});

router.get("/download", async function (req, res) {
	const repos = [
		"shadowsocks/shadowsocks-android", "XTLS/Xray-core", "2dust/v2rayN", "NetchX/Netch", "2dust/v2rayNG",
		"shadowsocks/shadowsocks-windows", "shadowsocksrr/shadowsocksr-csharp", "FelisCatus/SwitchyOmega"];
	const auth = {
		"username": process.env.GITHUB_USERNAME,
		"password": process.env.GITHUB_TOKEN
	};
	const api = "https://api.github.com/repos/{}/releases/latest";
	const promises = repos.map(repo => axios.get(api.replace("{}", repo), {auth}));
	Promise.all(promises).then(values => {
		let datas = values.map(value => value.data);
		for (let i = 0; i < datas.length; i++) {
			datas[i].repo = repos[i];
			for (const asset of datas[i].assets) {
				asset.size = filesize(asset.size, {base: 2, standard: "jedec"});
				asset["fastgit_url"] = asset["browser_download_url"].replace("github.com", "download.fastgit.org");
				asset["ghproxy_url"] = "https://ghproxy.com/" + asset["browser_download_url"];
			}
		}
		res.render("airportdownload", {datas});
	});

});

module.exports = router;

if (!module.parent) {
	updateDatabase();
}
