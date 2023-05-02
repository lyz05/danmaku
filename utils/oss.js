const OSS = require("ali-oss");
const path = require("path");
const normalendpoint = "oss-cn-hongkong.aliyuncs.com";
const fastendpoint = "oss-accelerate.aliyuncs.com";

// 引入环境变量
require("dotenv")
	.config({ path: "../.env" });

let client = new OSS({
	region: process.env.ALI_OSS_REGION,
	accessKeyId: process.env.ALI_ACCESS_KEY,
	accessKeySecret: process.env.ALI_ACCESS_KEY_SECRET,
	bucket: process.env.OSS_BUCKET,
});

async function get(objname) {
	try {
		const result = await client.get(objname);
		return result.content.toString();
	} catch (e) {
		console.log(e);
	}
}

async function putfile(objname, localfilename, headers) {
	try {
		const res = await client.put(objname,path.normalize(localfilename),{headers});
		return res;
	} catch(e) {
		console.log(e);
	}
}

async function put(objname, content, headers) {
	try {
		const result = await client.put(objname, new Buffer.from(content), { headers });
		return result;
	} catch (e) {
		console.log(e);
	}
}

async function head(objname) {
	try {
		const result = await client.head(objname);
		return result.res.headers;
	} catch (e) {
		console.log(e);
	}
}

async function signurl(objname, isFast) {
	try {
		let result = await client.signatureUrl(objname);
		if (isFast) {
			result = result.replace("http://", "//")
				.replace(normalendpoint, fastendpoint);
		}
		return result;
	} catch (e) {
		console.log(e);
	}
}

async function list(prefix) {
	const result = await client.list({
		prefix,
	});
	return result;
}

async function putACL(key,acl = "public-read"){
	client.putACL(key,acl);
}

module.exports = {
	get,
	put,
	putfile,
	head,
	list,
	signurl,
	putACL
};

if (!module.parent) {
	get("SUB/database.yaml");
	put("SUB/test.txt", "中文");
	head("SUB/database.yaml");
	signurl("SUB/database.yaml", true);
}
