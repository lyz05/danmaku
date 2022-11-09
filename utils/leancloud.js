const AV = require('leancloud-storage');
const {Query, User} = AV;
// 引入环境变量
require('dotenv').config({path: '../.env'});

AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
    serverURL: "https://dbvunek8.lc-cn-e1-shared.com"
});

function test() {
    const TestObject = AV.Object.extend('TestObject');
    const testObject = new TestObject();
    testObject.set('words', 'Hello world!');
    testObject.set('number', 123);
    testObject.save().then((testObject) => {
        console.log('保存成功。')
    })
}

function danmakuAccessAdd(obj) {
    const {ip, url, ua} = obj;
    const DanmakuAccessObject = AV.Object.extend('DanmakuAccess');
    const record = new DanmakuAccessObject();
    record.set('remoteIP', ip);
    record.set('url', url);
    record.set('UA', ua);
    record.save().then()
}

function currentDay() {
    const date = new Date();
    const start = new Date(date.setHours(0, 0, 0, 0))
    const end = new Date(date.setHours(23, 59, 59, 999))
    return [start, end]
}

function lastDay() {
    const currentday = currentDay();
    currentday[0].setDate(currentday[0].getDate() - 1);
    currentday[1].setDate(currentday[1].getDate() - 1);
    return currentday
}

function currentMonth() {
    var date = new Date(), y = date.getFullYear(), m = date.getMonth();
    var firstDay = new Date(y, m, 1);
    var lastDay = new Date(y, m + 1, 0);
    return [firstDay, lastDay]
}

async function danmakuQuery(date) {
    const query = new AV.Query('DanmakuAccess');
    query.greaterThanOrEqualTo('createdAt', date[0]);
    query.lessThan('createdAt', date[1]);

    query.exists('url');
    return await query.count()
}

function danmakuErrorAdd(obj) {
    const {ip, url, error} = obj;
    const DanmakuErrorObject = AV.Object.extend('DanmakuError');
    const record = new DanmakuErrorObject();
    record.set('remoteIP', ip);
    record.set('url', url);
    record.set('error', JSON.stringify(error));
    record.save().then()
}

module.exports = {danmakuAccessAdd, danmakuQuery, currentDay, currentMonth, lastDay, danmakuErrorAdd};

if (!module.parent) {
}
