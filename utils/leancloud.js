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

function lastDay() {
	const currentday = currentDay();
	currentday[0].setDate(currentday[0].getDate() - 1);
	currentday[1].setDate(currentday[1].getDate() - 1);
	return currentday;
}

function currentMonth() {
	const date = new Date(), y = date.getFullYear(), m = date.getMonth();
	const firstDay = new Date(y, m, 1);
	const lastDay = new Date(y, m + 1, 0);
	return [firstDay, lastDay];
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

module.exports = { danmakuQuery, currentDay, currentMonth, lastDay, add };

if (!module.parent) {
}
