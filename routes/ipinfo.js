const express = require("express");
const router = express.Router();
const libqqwry = require("lib-qqwry");
const dns = require("dns");
const qqwry = libqqwry(); //初始化IP库解析器

/* GET home page. */
router.get("/", function (req, res) {
	let ip = req.query.name || req.ip;
	dns.lookup(ip, (err, address) => {
		let ipL;
		if (err) {
			ipL = { "ip": ip, "msg": "域名解析IP失败" };
		} else {
			ip = address;
			try {
				ipL = qqwry.searchIP(ip); //查询IP信息
			} catch (e) {
				ipL = { "ip": ip, "msg": e };
			}
		}
		res.json(ipL);
	});
});

module.exports = router;
