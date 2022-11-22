const AV = require("leancloud-storage");
// 引入环境变量
require("dotenv").config({path: "../.env"});

AV.init({
	appId: process.env.LEANCLOUD_APP_ID,
	appKey: process.env.LEANCLOUD_APP_KEY,
	serverURL: "https://dbvunek8.lc-cn-e1-shared.com"
});

function currentDay() {
	const date = new Date();
	const start = new Date(date.setHours(0, 0, 0, 0));
	const end = new Date(date.setHours(23, 59, 59, 999));
	return [start, end];
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

async function danmakuQuery(date) {
	const query = new AV.Query("DanmakuAccess");
	query.greaterThanOrEqualTo("createdAt", date[0]);
	query.lessThan("createdAt", date[1]);

	query.exists("url");
	return await query.count();
}

function add(className,obj) {
	const classInstance = AV.Object.extend(className);
	const record = new classInstance();
	for (const key of Object.keys(obj)){
		record.set(key, obj[key]);
	}
	record.save().then((obj) => {
		// 成功保存之后，执行其他逻辑
		console.log(`${className}添加一条记录。objectId：${obj.id}`);
	});
}

module.exports = {danmakuQuery, currentDay, currentMonth, lastDay, add};

//TODO IP地理信息查询并记录到日志中
if (!module.parent) {

}