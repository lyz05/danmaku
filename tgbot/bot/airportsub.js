// Import modules
const whacko = require("whacko");
const yaml = require("js-yaml");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const oss = require("../../utils/oss");
const goindex = require("../api/goindex");
const openai = require("../api/openai");
const https = require('https');

async function finduserbychatid(chatid) {
	const database = await oss.get("SUB/database.yaml");
	const data = yaml.load(database);
	const users = data.user;
	// eslint-disable-next-line no-restricted-syntax
	for (const user in users) {
		if (users[user].chatID == chatid) {
			return user;
		}
	}
	return null;
}

async function setchatidbyuser(user, chatid) {
	const database = await oss.get("SUB/database.yaml");
	const data = yaml.load(database);
	data.user[user].chatID = chatid;
	oss.put("SUB/database.yaml", yaml.dump(data));
}

// function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

module.exports = (TOKEN) => {
	const game = {};
	let openai_messages = {};
	let setu = {};
	const bot = new TelegramBot(TOKEN, { polling: true });

	function sendSetu(chatId, i) {
		const href = setu[i];
		const prev = {
			text: "上一张",
			callback_data: i - 1
		};
		const next = {
			text: "下一张",
			callback_data: i + 1
		};
		let replyMarkup = { inline_keyboard: [[prev, next]] };
		if (i === 0) {
			replyMarkup = { inline_keyboard: [[next]] };
		} else if (i + 1 === setu.length) {
			replyMarkup = { inline_keyboard: [[prev]] };
		}
		bot.sendMessage(chatId, href, { reply_markup: replyMarkup });
	}

	// Just to ping!
	bot.on("message", (msg) => {
		if (!msg.text) {
			bot.sendMessage(msg.chat.id, "I can only understand text messages!");
		}
	});

	// 智能聊天机器人
	bot.on("text",async (msg) => {
		if (msg.text.indexOf("/") === -1) {
			bot.sendMessage(msg.chat.id, `you said: ${msg.text}`);
			const agent = new https.Agent({
				rejectUnauthorized: false
			});
			const res = await axios.get(`https://api.qingyunke.com/api.php?key=free&appid=0&msg=${encodeURI(msg.text)}`, { httpsAgent: agent })
			console.log(res.data);
			bot.sendMessage(msg.chat.id, res.data.content);
		}
	});

	// ChatGPT版智能聊天机器人
	// bot.on("text", async (msg) => {
	// 	if (msg.text.indexOf("/") === -1) {
	// 		bot.sendMessage(msg.chat.id, `you said: ${msg.text}`);
	// 		let messages = openai_messages[msg.chat.id] || [], res;
	// 		[res, messages] = await openai.chat(msg.text, messages);
	// 		const length = (messages.length - 1) / 2;
	// 		bot.sendMessage(msg.chat.id, `${res}\n\nPowered by OpenAI 连续对话了${length}次`);
	// 		openai_messages[msg.chat.id] = messages;
	// 	}
	// });

	bot.onText(/\/clear/, (msg) => {
		openai_messages[msg.chat.id] = [];
		bot.sendMessage(msg.chat.id, "已清空对话记录");
	});

	bot.onText(/\/prompt/, async (msg) => {
		const prompt = msg.text.replace("/prompt ", "").replace("/prompt", "");
		openai_messages[msg.chat.id] = [];
		const res = await openai.setprompt(prompt);
		bot.sendMessage(msg.chat.id, `已设置对话提示为:${res}`);
	});

	// 欢迎页面
	bot.onText(/\/start/, (msg) => {
		let name = [msg.from.first_name];
		if (msg.from.last_name) {
			name.push(msg.from.last_name);
		}
		name = name.join(" ");
		bot.sendMessage(msg.chat.id, `Welcome, ${name}!`);
		bot.sendMessage(msg.chat.id, "你可以给我发送消息，我会回复你.");
		bot.sendMessage(msg.chat.id, "你可以发送类似这样的指令 /start, /help.");
	});

	// 发送用户头像
	bot.onText(/\/sendpic/, (msg) => {
		bot.getUserProfilePhotos(msg.chat.id)
			.then((photos) => {
				const photo = photos.photos[0][0];
				bot.sendPhoto(msg.chat.id, photo.file_id, {
					caption: "This is a picture of You!",
				});
			});
		// bot.sendPhoto(msg.chat.id, "https://blog.home999.cc/images/avatar.jpg");
	});

	bot.onText(/\/register/, async (msg) => {
		const user = await finduserbychatid(msg.chat.id);
		if (user == null) {
			const user = msg.text.replace("/register ", "");
			if (msg.text === "/register") {
				bot.sendMessage(msg.chat.id, `您的ChatId为: ${msg.chat.id}\n若要进行注册请跟上您的user信息，如： /register example`);
			} else {
				setchatidbyuser(user, msg.chat.id);
				bot.sendMessage(msg.chat.id, "注册完成！");
			}
		} else {
			bot.sendMessage(msg.chat.id, "您已经注册过了，请勿重复注册。");
		}
	});

	bot.onText(/\/sub/, async (msg) => {
		const user = await finduserbychatid(msg.chat.id);
		const url = `https://fc.home999.cc/sub?user=${user}`;

		if (user == null) {
			bot.sendMessage(msg.chat.id, "您未注册！请输入 /register 进行注册");
		} else {
			bot.sendMessage(msg.chat.id, `你好，${user}。`);
			bot.sendMessage(msg.chat.id, `您的订阅链接为：${url}`);
		}
	});

	// 猜数游戏
	bot.onText(/\/game/, async (msg) => {
		const chatID = msg.chat.id;
		const guess = parseInt(msg.text.replace("/game", ""), 10);
		if (game[chatID] === undefined) {
			game[chatID] = {
				num: Math.floor(Math.random() * 100),
				limit: 10,
			};
			await bot.sendMessage(chatID, "我们来玩猜数游戏吧！");
			await bot.sendMessage(chatID, "猜一个数字，你有10次机会。范围:[0, 100)");
			await bot.sendMessage(chatID, "请输入你的猜测：(例：/game 50)");
			return;
		}
		const {
			num,
			limit
		} = game[chatID];
		if (limit <= 0) {
			bot.sendMessage(chatID, `游戏结束！未猜出正确答案，正确答案为：${num}`);
			game[chatID] = undefined;
			return;
		}
		game[chatID].limit -= 1;
		if (guess === num) {
			bot.sendMessage(chatID, "恭喜你猜对了！");
			game[chatID] = undefined;
		} else if (guess > num) {
			bot.sendMessage(chatID, "你猜的数字太大了！");
		} else {
			bot.sendMessage(chatID, "你猜的数字太小了！");
		}
	});

	bot.onText(/\/help/, (msg) => {
		const helpMsg = [
			{
				command: "start",
				description: "欢迎界面"
			},
			{
				command: "game",
				description: "猜数游戏"
			},
			{
				command: "sub",
				description: "订阅链接"
			},
			{
				command: "register",
				description: "注册"
			},
			{
				command: "sendpic",
				description: "发送你的头像"
			},
			{
				command: "setu",
				description: "随机色图，可加编号"
			},
			{
				command: "goindex",
				description: "查询GoIndex上的文件"
			},
			{
				command: "help",
				description: "帮助"
			},
			{
				command: "clear",
				description: "清空OpenAI聊天记录"
			},
			{
				command: "prompt",
				description: "设置OpenAI聊天提示句"
			}
		];
		const helpMsgText = helpMsg.map((item) => `/${item.command} - ${item.description}`)
			.join("\n");
		bot.sendMessage(msg.chat.id, helpMsgText, { parse_mode: "HTML" });
		bot.setMyCommands(helpMsg);
	});

	bot.onText(/\/setu/, async (msg) => {
		const index = parseInt(msg.text.replace("/setu", ""), 10);
		bot.sendMessage(msg.chat.id, "色图模式");
		const res = await axios.get("https://asiantolick.com/ajax/buscar_posts.php", { params: { index } });
		const $ = whacko.load(res.data);
		setu = Object.values($(".miniatura"))
			.map((item) => $(item)
				.attr("href"));
		sendSetu(msg.chat.id, 0);
	});

	bot.on("callback_query", async (query) => {
		const i = parseInt(query.data, 10);
		const queryId = query.id;
		sendSetu(query.message.chat.id, i);
		bot.answerCallbackQuery(queryId);
	});

	bot.onText(/\/goindex/, (msg) => {
		const q = msg.text.replace("/goindex ", "");
		bot.sendMessage(msg.chat.id, `正在搜寻“${q}”...`);
		goindex.query(q)
			.then((res) => {
				// 筛选符合条件的文件
				const videos = res.filter((e) => e.mimeType === "video/mp4")
					.filter((e) => e.size < 50 * 1024 * 1024);
				let images = res.filter((e) => e.mimeType === "image/jpeg");
				const audios = res.filter((e) => e.mimeType === "audio/mp3")
					.filter((e) => e.size < 50 * 1024 * 1024);
				const folders = res.filter((e) => e.mimeType === "application/vnd.google-apps.folder");

				bot.sendMessage(msg.chat.id, `共有${images.length}个图片结果，${videos.length}个视频，${audios.length}个音乐，${folders.length}个目录，搜索结果：`);
				bot.sendChatAction(msg.chat.id, "upload_photo");
				images = goindex.group(images, 10);
				images.forEach((e, i) => {
					setTimeout(() => {
						bot.sendMediaGroup(msg.chat.id, e.map((el) => ({
							type: "photo",
							media: el.thumbnailLink.replace("=s220", "=s0"),
							caption: el.name,
						})));
					}, i * 2000);
				});
				bot.sendChatAction(msg.chat.id, "upload_video");
				videos.forEach((e, i) => {
					setTimeout(() => {
						goindex.id2path(e.id)
							.then((path) => {
								console.log(path);
								bot.sendVideo(msg.chat.id, encodeURI(path), {
									caption: `${e.name}`,
									reply_markup: {
										inline_keyboard: [
											[{
												text: "带我去看片",
												url: encodeURI(path)
											}],
										],
									},
								});
							});
					}, i * 2000);
				});
				bot.sendChatAction(msg.chat.id, "upload_voice");
				audios.forEach((e, i) => {
					setTimeout(() => {
						goindex.id2path(e.id)
							.then((path) => {
								console.log(path);
								bot.sendAudio(msg.chat.id, path, { caption: `${e.name}` });
							});
					}, i * 2000);
				});
			});
	});

	bot.onText(/\/senddice/, (msg) => {
		bot.sendDice(msg.chat.id, { emoji: "🎲" });
	});

	bot.on("polling_error", (error) => {
		console.log(error.message); // => 'EFATAL'
	});
	return bot;
};
