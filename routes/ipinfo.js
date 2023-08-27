const express = require("express");
const router = express.Router();
const libqqwry = require("lib-qqwry");
const dns = require("dns");
const qqwry = libqqwry(); //初始化IP库解析器
const dnspod = require("../utils/dnspod");

/* GET home page. */
router.get("/", function (req, res) {
	let ip = req.query.name || req.ip;
	dns.lookup(ip, (err, address) => {
		let ipL;
		if (err) {
			ipL = {
				"ip": ip,
				"msg": "域名解析IP失败"
			};
		} else {
			ip = address;
			try {
				ipL = qqwry.searchIP(ip); //查询IP信息
			} catch (e) {
				ipL = {
					"ip": ip,
					"msg": e
				};
			}
		}
		res.json(ipL);
	});
});

router.get("/ddns", async function (req, res) {
  let ip = req.query.ip ? req.query.ip : req.ip,
		subdomain = req.query.subdomain;
	if (ip.substr(0, 7) === "::ffff:") {
		ip = ip.substr(7);
	}
	if (!subdomain || subdomain === "") {
		res.json({ msg: "请提供subdomain参数" });
		return;
	}
	const record_type = (ip.indexOf(":") !== -1)? "AAAA": "A";

	const records = await dnspod.get_record("home999.cc", subdomain, record_type);
	if (!records || records.length !== 1) {
		res.json({ msg: "获取不到相关记录，或者记录条数不是1。" });
		return;
	}
	const record = records[0];
	if (record.value === ip) {
		res.json({ msg: "不需要更新IP" });
	} else {
		record.value = ip;
		const status = await dnspod.update_record("home999.cc",record);
		if (status.code==="1") {
			res.json({msg: "更新成功" ,ip});
		} else {
			res.json({
				msg: "更新失败",
				status
			});
		}
	}
});

module.exports = router;
