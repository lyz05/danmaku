const express = require("express");
const router = express.Router();
const yaml = require("js-yaml");
const axios = require("axios");
const leancloud = require("../utils/leancloud");
const libqqwry = require("lib-qqwry");
const dns = require("dns");
const qqwry = libqqwry(); //初始化IP库解析器

/* GET users listing. */
router.get("/", async function (req, res) {
	leancloud.add("SubAccess", {
		ip: req.ip,
		ua: req.headers["user-agent"],
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

// 域名解析函数
function resolveDomain(domain) {
  return new Promise((resolve, reject) => {
    dns.lookup(domain, (error, address) => {
      if (error) {
        reject(error);
      } else {
        resolve(address);
      }
    });
  });
}

async function proc(url) {
  try {
    const response = await axios.get(url);
    const info = yaml.load(response.data, { schema: yaml.FullSchema });

    for (const line of info.proxies) {
      // 过滤解析结果相同的 IP
      try {
        const ipaddr = await resolveDomain(line.server);
        const ipLoc = qqwry.searchIP(ipaddr); //查询IP信息
        line.server = ipaddr;
        console.log(line.name, line.server, ipLoc.Country, ipLoc.Area);
      } catch {
        console.log(line.name, line.server);
        continue;
      }
    }

    const updatedInfo = yaml.dump(info, { skipInvalid: true });
    return updatedInfo;
  } catch (error) {
    console.error(error);
    return yamldata;
  }
}

module.exports = router;

if (!module.parent) {
	updateDatabase();
}
