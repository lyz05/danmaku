const express = require("express");
const router = express.Router();
const leancloud = require("../utils/leancloud");

/* GET users listing. */
router.get("/", async function (req, res) {
	leancloud.add("SubAccess", {
		remoteIP: req.ip,
		UA: req.headers["user-agent"],
		user: req.query.user,
		ctype: req.query.ctype
	});
	if (req.query.user) {
			if (req.query.ctype) {
				res.redirect("https://sub.home999.cc/sub/"+req.query.user+"/"+req.query.ctype);
			} else {
				res.redirect("https://sub.home999.cc/sub/"+req.query.user);
			}
	} else {
		res.status(400).send("Bad Request 缺少参数");
	}
});

module.exports = router;