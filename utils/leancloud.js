const { query } = require("express");
const libqqwry = require("lib-qqwry");
const qqwry = libqqwry();
let AV;
// 引入环境变量
require("dotenv").config({ path: "../.env" });
const DEBUG = !(process.env.DEBUG === "false");

if (!DEBUG) {
	AV = require("leancloud-storage");
	AV.init({
		appId: process.env.LEANCLOUD_DANMAKU_APP_ID,
		appKey: process.env.LEANCLOUD_DANMAKU_APP_KEY,
		serverURL: "https://dbvunek8.lc-cn-n1-shared.com"
	});
};

function currentDay() {
	const date = new Date(), y = date.getFullYear(), m = date.getMonth();
	const start = new Date(date.setHours(0, 0, 0, 0));
	const end = new Date(date.setHours(23, 59, 59, 999));
	return [start, end, y, m+1];
}

async function danmakuQuery(date, ip) {
	if (!AV) return 0;
	const className = `DanmakuAccess_${currentDay()[2]}_${currentDay()[3]}`;
	const query = new AV.Query(className);
	query.greaterThanOrEqualTo("createdAt", date[0]);
	query.lessThan("createdAt", date[1]);
	if (ip) query.equalTo("remoteIP", ip);

	query.exists("url");
	return await query.count();
}

async function add(className, obj) {
	className = `${className}_${currentDay()[2]}_${currentDay()[3]}`;
	console.log(className)
	if (!AV) return;
	if (obj.remoteIP)
		obj.ipCountry = getipCountry(obj.remoteIP);
	const classInstance = AV.Object.extend(className);
	const record = new classInstance();
	for (const key of Object.keys(obj)) {
		record.set(key, obj[key]);
	}
	console.log(record.attributes);
	const o = await record.save()
	// 成功保存之后，执行其他逻辑
	console.log(`${className}添加一条记录。objectId：${o.id}`);
}

function getipCountry(ip) {
	try {
		const info = qqwry.searchIP(ip);
		return info.Country + " " + info.Area;
	} catch (e) {
		return "";
	}
}

module.exports = { danmakuQuery, currentDay, add };

if (!module.parent) {
}
// curl -X POST \
//   -H "X-LC-Id: {{appid}}" \
//   -H "X-LC-Key: {{appkey}}" \
//   -H "Content-Type: application/json" \
//   -d '{"content": "每个 Java 程序员必备的 8 个开发工具","pubUser": "官方客服","pubTimestamp": 1435541999}' \
//   https://{{host}}/1.1/classes/Post