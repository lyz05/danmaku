require('dotenv').config({path: '../.env'});
const memory = require('../utils/memory');
const hkaliyun = require('./bot/hkaliyun.js');
const airportsub = require('./bot/airportsub.js');

bots = [
    hkaliyun(process.env.TELEGRAM_TOKEN_HKALIYUN),
    airportsub(process.env.TELEGRAM_TOKEN_AIRPORTSUB),
];
console.log('bot.js loaded');
memory()
for (const bot of bots) {
    bot.getMe().then((botInfo) => {
        console.log('Bot info:', botInfo);
    });
    // bot.getWebHookInfo().then((webhookInfo) => {
    //     console.log('Webhook info:', webhookInfo);
    // });
}