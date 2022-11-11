const axios = require("axios");
const dnspod = require("./dnspod");

const KEY = "o1zrmHAF";
const DOMAINS = {
	"home999.cc": {
		"gd": {
			"移动": "CM",
			"联通": "CU",
			"电信": "CT",
			"境内": "CT",
		},
	}
};

async function get_optimization_ip() {
	const res = await axios.post("https://api.hostmonit.com/get_optimization_ip", { "key": KEY , "type": "v4" });
	return res.data;
}

async function main() {
	const cfips = await get_optimization_ip();
	if (cfips.code !== 200) {
		console.log("GET CLOUDFLARE IP ERROR: ----Time: " + new Date().toLocaleString());
		return;
	}
	for (const domain in DOMAINS) {
		const sub_domains = DOMAINS[domain];
		for (const sub_domain in sub_domains) {
			console.log(sub_domain,domain, "删除非默认线路的记录");
			const records = await dnspod.get_record(domain, sub_domain);
			for (const record of records) {
				if (record.line !== "默认") {
					const res = await dnspod.del_record(domain, record);
					if (res.status.code!=="1")
						return "fail!"+res.status.message;
					// console.log(record);
				}
			}
			console.log(sub_domain,domain, "添加非默认线路的记录");
			const record = JSON.parse(JSON.stringify(records[0]));
			for (const line in sub_domains[sub_domain]) {
				for (let i=0;i<2;i++) {
					const ISP = sub_domains[sub_domain][line];
					record.line = line;
					record.type = "A";
					record.value = cfips["info"][ISP][i].ip;
					const res = await dnspod.add_record(domain, record);
					if (res.status.code!=="1")
						return "fail!"+res.status.message;
					console.log(cfips["info"][ISP][i]);
				}
			}
		}
	}
	return "success!";
}

module.exports = main;
