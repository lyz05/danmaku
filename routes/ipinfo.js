var express = require('express');
var router = express.Router();
var libqqwry = require('lib-qqwry');
var dns = require('dns');
var qqwry = libqqwry() //初始化IP库解析器

function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
}

/* GET home page. */
router.get('/', function (req, res, next) {
    var ip = req.query.name || getClientIp(req);
    dns.lookup(ip, (err, address, family) => {
        if (err) {
            ipL = { 'ip': ip, 'msg': '域名解析IP失败' };
        } else {
            ip = address
            try {
                var ipL = qqwry.searchIP(ip); //查询IP信息
            } catch (e) {
                ipL = { 'ip': ip, 'msg': e };
            }
        }
        res.json(ipL);
    });
});

module.exports = router;
