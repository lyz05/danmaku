const OSS = require('ali-oss');
const normalendpoint = 'oss-cn-hongkong.aliyuncs.com';
const fastendpoint = 'oss-accelerate.aliyuncs.com';

// 引入环境变量
require('dotenv').config({path: '../.env'});

let client = new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET,
});

async function get(objname) {
    try {
        const result = await client.get(objname);
        return result.content.toString()
    } catch (e) {
        console.log(e);
    }
}

async function put(objname, content, headers) {
    try {
        const result = await client.put(objname, new Buffer.from(content), {headers});
        return result
    } catch (e) {
        console.log(e);
    }
}

async function head(objname) {
    try {
        const result = await client.head(objname);
        return result.res.headers
    } catch (e) {
        console.log(e);
    }
}

async function signurl(objname) {
    try {
        const result = await client.signatureUrl(objname);
        return result
    } catch (e) {
        console.log(e);
    }
}

module.exports = {get, put, head, signurl};

if (!module.parent) {
    get('SUB/database.yaml');
    put('SUB/test.txt', '中文');
    head('SUB/database.yaml');
    signurl('SUB/database.yaml');
}