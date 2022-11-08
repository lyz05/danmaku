const express = require('express');
const axios = require('axios');
const router = express.Router();
const { bilibili, mgtv, tencentvideo, youku, iqiyi } = require('../routes/api/base');
const list = [bilibili, mgtv, tencentvideo, youku, iqiyi];

function getscheme(req) {
    return req.headers['x-forwarded-proto'] || req.protocol;
}

async function build_response(url, download) {
    try {
        const res = await axios.get(url)
    } catch (error) {
        console.log(error)
        return {'msg': '传入的链接非法！请检查链接是否能在浏览器正常打开'}
    }
    var fc = undefined
    for (var item of list) {
        if (url.indexOf(item.domain) !== -1) {
            fc = item
        }
    }
    if (fc === undefined) {
        return {'msg': '不支持的视频网址'}
    }
    return await fc.work(url)
}

/* GET home page. */
router.get('/', async function (req, res, next) {
    //检查是否包含URL参数
    if (!req.query.url) {
        var urls = [mgtv.example_urls[0], bilibili.example_urls[0], tencentvideo.example_urls[0], youku.example_urls[0], iqiyi.example_urls[0]];
        const path = getscheme(req) + '://' + req.headers.host + req.originalUrl;
        res.render('danmaku', {path, urls});
    } else {
        url = req.query.url;
        download = (req.query.download === 'on');
        ret = await build_response(url, download)
        if (ret.msg !== 'ok') {
            res.status(403).send(ret.msg)
        } else if (download) {
            res.attachment(ret.title + '.xml');
            res.end(ret.content);
        } else {
            res.type('application/xml');
            res.end(ret.content);
        }
    }
});

module.exports = router;
