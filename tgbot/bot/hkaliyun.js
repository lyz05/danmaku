const TelegramBot = require("node-telegram-bot-api");

module.exports = (TOKEN) => {
	const bot = new TelegramBot(TOKEN, {polling: true});

	// Just to ping!
	bot.on("message", msg => {
		if (msg.text) {
			bot.sendMessage(msg.chat.id, msg.text);
		} else {
			bot.sendMessage(msg.chat.id, "I can only understand text messages!");
		}
	});
	bot.on("video", msg => {
		bot.sendMessage(msg.chat.id, "I reveive video message!");
		bot.sendMessage(msg.chat.id, JSON.stringify(msg.video));
	});
	bot.on("photo", msg => {
		bot.sendMessage(msg.chat.id, "I reveive photo message!");
		bot.sendMessage(msg.chat.id, JSON.stringify(msg.photo));
	});
	bot.on("audio", msg => {
		bot.sendMessage(msg.chat.id, "I reveive audio message!");
		bot.sendMessage(msg.chat.id, JSON.stringify(msg.audio));
	});
	bot.on("document", msg => {
		bot.sendMessage(msg.chat.id, "I reveive document message!");
		bot.sendMessage(msg.chat.id, JSON.stringify(msg.document));
	});
	bot.on("sticker", msg => {
		bot.sendMessage(msg.chat.id, "I reveive sticker message!");
		bot.sendMessage(msg.chat.id, JSON.stringify(msg.sticker));
	});
	bot.on("location", msg => {
		bot.sendMessage(msg.chat.id, "I reveive location message!");
		bot.sendMessage(msg.chat.id, JSON.stringify(msg.location));
	});
	bot.on("contact", msg => {
		bot.sendMessage(msg.chat.id, "I reveive contact message!");
		bot.sendMessage(msg.chat.id, JSON.stringify(msg.contact));
	});
	bot.on("polling_error", (error) => {
		console.log(error.code);  // => 'EFATAL'
	});
	return bot;
};
