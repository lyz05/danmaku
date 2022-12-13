const cron = require("node-cron");
const leancloud = require("../utils/leancloud");
const chai = require("chai");
const chaiHttp = require("chai-http");
const cf2dns = require("./cf2dns");
const covidbook = require("./covidbook");

function subcache(app) {
	console.log("Running Cron Job：subcache");
	chai.use(chaiHttp);
	chai.request(app)
		.get("/sub/cache")
		.end((err, res) => {
			leancloud.add("Schedule", {
				name: "subcache",
				result: res.text
			});
			console.log(res.text);
		});
}

module.exports = (app) => {
	//TODO 添加自动删除一个月前的日志
	console.log("schedule.js loaded");
	cron.schedule("0 */8 * * *", () => {
		subcache(app);
	});
	cron.schedule("*/15 * * * *", () => {
		cf2dns().then((result)=>{
			leancloud.add("Schedule", {
				name: "cf2dns",
				result
			});
		});
		covidbook();
	});
};

if (!module.parent) {
	covidbook();
}
