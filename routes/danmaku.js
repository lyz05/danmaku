const express = require('express');
const axios = require('axios');
const router = express.Router();
const {bilibili, mgtv, tencentvideo, youku, iqiyi} = require('./api/base');
const list = [bilibili, mgtv, tencentvideo, youku, iqiyi];
const memory = require('../utils/memory')
const leancloud = require('../utils/leancloud')

function getscheme(req) {
    return req.headers['x-forwarded-proto'] || req.protocol;
}

function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
}

async function build_response(url) {
    try {
        await axios.get(url)
    } catch (e) {
        console.log(e)
        return {msg: '传入的链接非法！请检查链接是否能在浏览器正常打开'}
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
    let ret;
    try {
        ret = await fc.work(url)
    } catch (e) {
        console.log(e)
        return {msg: '弹幕解析过程中程序报错退出，请等待管理员修复！或者换条链接试试！'}
    }
    return ret
}

/* GET home page. */
router.get('/', async function (req, res, next) {
    leancloud.danmakuAccessAdd({ip: getClientIp(req), url: req.query.url, ua: req.headers['user-agent']})
    //检查是否包含URL参数
    if (!req.query.url) {
        var urls = [mgtv.example_urls[0], bilibili.example_urls[0], tencentvideo.example_urls[0], youku.example_urls[0], iqiyi.example_urls[0]];
        const path = getscheme(req) + '://' + req.headers.host + req.originalUrl;
        res.render('danmaku', {path, urls});
    } else {
        url = req.query.url;
        download = (req.query.download === 'on');
        ret = await build_response(url)
        memory() //显示内存使用量
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

router.get('/pageinfo', async function (req, res, next) {
    const today_visited = await leancloud.danmakuQuery(leancloud.currentDay());
    const lastday_visited = await leancloud.danmakuQuery(leancloud.lastDay());
    const month_visited = await leancloud.danmakuQuery(leancloud.currentMonth());
    res.json({today_visited, lastday_visited, month_visited})
});

module.exports = router;
