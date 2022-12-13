const axios = require('axios');
const tgbot = require("../tgbot/tgbot.js");

const rootPath = 'https://eservice.ssm.gov.mo/covidvacbook/'
const url = rootPath + 'Booking/GetLocationQuotaList';

if (!module.parent) {
    // 引入环境变量
    require("dotenv").config('../.env');
}
console.log('covidbook.js loaded')
function main() {
    axios.post(url).then((res) => {
        const data = res.data;
        const mrnalocationquotalist = data.filter(locationquota => (locationquota.rspsrv === 'HC6' || locationquota.rspsrv === 'HC8' || locationquota.rspsrv === 'CHCSJ(MRNA)' || locationquota.rspsrv === 'CHCSJ2(MRNA)' || locationquota.rspsrv === 'SSM1(MRNA)'));
        const ret = mrnalocationquotalist.filter(x => x.sum != '0')
        if (ret.length != 0) {
            console.log('有余量');
            const bot = tgbot.hkaliyun;
            bot.sendMessage(619935997, "有余量!");
            bot.sendMessage(619935997, JSON.stringify(ret));
        } else console.log('无余量');
    })    
}

module.exports = main;

