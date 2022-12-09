const axios = require("axios");
const token = process.env.DNSPOD_TOKEN;
const querystring = require("querystring");
// 创建实例时配置默认值
const instance = axios.create({
	baseURL: "https://dnsapi.cn"
});

async function get_record(domain, subdomain, recordtype) {
	const api = "/Record.List";
	const data = querystring.stringify({
		"domain": domain,
		"sub_domain": subdomain,
		"login_token": token,
		"record_type": recordtype,
		"format": "json"
	});
	const res = await instance.post(api, data);
	return res.data.records;
}

async function update_record(domain, record) {
	const {id, line, type, name, value} = record;
	const api = "/Record.Modify";
	const data = querystring.stringify({
		domain,
		record_id: id,
		value,
		record_line: line,
		record_type: type,
		sub_domain: name,
		"login_token": token,
		"format": "json",
	});
	const res = await instance.post(api, data);
	return res.data.status;
}

async function add_record(domain, record) {
	const {line, type, name, value} = record;
	const api = "/Record.Create";
	const data = querystring.stringify({
		domain,
		value,
		record_line: line,
		record_type: type,
		sub_domain: name,
		"login_token": token,
		"format": "json",
	});
	const res = await instance.post(api, data);
	return res.data;
}

async function del_record(domain, record) {
	const {id} = record;
	const api = "/Record.Remove";
	const data = querystring.stringify({
		domain,
		record_id: id,
		"login_token": token,
		"format": "json",
	});
	const res = await instance.post(api, data);
	return res.data;
}

module.exports = {get_record, update_record, add_record, del_record};

if (!module.parent) {
	get_record("home999.cc", "n1","AAAA").then(res => {
		console.log(res);
	});
}

