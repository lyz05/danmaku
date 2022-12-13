require("dotenv").config({path: "../.env"});

const hkaliyun = require("./bot/hkaliyun.js");
const airportsub = require("./bot/airportsub.js");

const bots = {
	hkaliyun: hkaliyun(process.env.TELEGRAM_TOKEN_HKALIYUN),
	airportsub: airportsub(process.env.TELEGRAM_TOKEN_AIRPORTSUB),
};

console.log("bot.js loaded");

for (const bot in bots) {
	bots[bot].getMe().then((botInfo) => {
		console.log("Bot info:", botInfo);
	});
	bots[bot].deleteWebHook();
	// bot.getWebHookInfo().then((webhookInfo) => {
	//     console.log('Webhook info:', webhookInfo);
	// });
}

module.exports = bots;