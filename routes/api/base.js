//引入API组件
const Bilibili = require("./bilibili");
const Mgtv = require("./mgtv");
const Tencentvideo = require("./tencentvideo");
const Youku = require("./youku");
const Iqiyi = require("./iqiyi");
const Gamer = require("./gamer");
// 实例化API组件
const bilibili = new Bilibili();
const mgtv = new Mgtv();
const tencentvideo = new Tencentvideo();
const youku = new Youku();
const iqiyi = new Iqiyi();
const gamer = new Gamer();
//TODO 优化代码
module.exports = { bilibili, mgtv, tencentvideo, youku, iqiyi, gamer };
