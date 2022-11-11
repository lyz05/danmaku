// Import modules
const whacko = require('whacko');
const yaml = require('js-yaml');
const TelegramBot = require('node-telegram-bot-api');
const goindex = require('./goindex');
const axios = require('axios');
const OSS = require('ali-oss');

// Environment variables
const OSS_OPTIONS = {
    region: 'oss-cn-hongkong',
    accessKeyId: process.env.OSS_ACCESS_KEY,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: 'hkosslog'
};


module.exports = (TOKEN) => {
    let game = {};
    const bot = new TelegramBot(TOKEN, {polling: true});
    const client = new OSS(OSS_OPTIONS);


    // Just to ping!
    bot.on('message', msg => {
        if (!msg.text) {
            bot.sendMessage(msg.chat.id, 'I can only understand text messages!');
        }
    });

    // 智能聊天机器人
    bot.on('text', msg => {
        if (msg.text.indexOf('/') === -1) {
            bot.sendMessage(msg.chat.id, 'you said: ' + msg.text);
            axios.get('https://api.qingyunke.com/api.php?key=free&appid=0&msg=' + encodeURI(msg.text)).then(res => {
                console.log(res.data);
                bot.sendMessage(msg.chat.id, res.data.content);
            });
        }
    });

    // 欢迎页面
    bot.onText(/\/start/, (msg) => {
        let name = [msg.from.first_name];
        if (msg.from.last_name) {
            name.push(msg.from.last_name);
        }
        name = name.join(" ");
        bot.sendMessage(msg.chat.id, `Welcome, ${name}!`);
        bot.sendMessage(msg.chat.id, `You can send me any message and I will repeat it back to you.`);
        bot.sendMessage(msg.chat.id, `You can also send me commands like /start, /help.`);
    });

    // 发送用户头像
    bot.onText(/\/sendpic/, (msg) => {
        bot.getUserProfilePhotos(msg.chat.id).then(photos => {
            const photo = photos.photos[0][0];
            bot.sendPhoto(msg.chat.id, photo.file_id, {
                caption: "This is a picture of You!"
            });
        });
        // bot.sendPhoto(msg.chat.id, "https://blog.home999.cc/images/avatar.jpg");
    });

    bot.onText(/\/register/, (msg) => {
        bot.sendMessage(msg.chat.id, `Chat id: ${msg.chat.id}\n请把该id告诉管理员用于注册。`);
    });

    bot.onText(/\/sub/, async (msg) => {
        const database = await (await client.get("SUB/database.yaml")).content.toString();
        const data = yaml.load(database);
        const users = data.user;
        for (let user in users) {
            if (users[user].chatID == msg.chat.id) {
                bot.sendMessage(msg.chat.id, `您已经注册过了，请勿重复注册。`);
                bot.sendMessage(msg.chat.id, `你好，${user}。`);
                const url = `https://fc.home999.cc/sub?user=${user}`;
                bot.sendMessage(msg.chat.id, `您的订阅链接为：${url}`);
                return;
            }
        }
        bot.sendMessage(msg.chat.id, `您已经成功注册，请等待管理员审核`);
    });

    //猜数游戏
    bot.onText(/\/game/, (msg) => {
        const chatID = msg.chat.id;
        const guess = parseInt(msg.text.replace("/game", ""));
        if (game[chatID] == undefined) {
            game[chatID] = {
                num: Math.floor(Math.random() * 100),
                limit: 10,
            }
            bot.sendMessage(chatID, `我们来玩猜数游戏吧！`);
            bot.sendMessage(chatID, `猜一个数字，你有10次机会。范围:[0, 100)`);
            bot.sendMessage(chatID, `请输入你的猜测：(例：/game 50)`);
            return;
        }
        let {num, limit} = game[chatID];
        if (limit <= 0) {
            bot.sendMessage(chatID, `游戏结束！未猜出正确答案，正确答案为：${num}`);
            game[chatID] = undefined;
            return;
        }
        game[chatID].limit--;
        if (guess == num) {
            bot.sendMessage(chatID, `恭喜你猜对了！`);
            game[chatID] = undefined;
        } else if (guess > num) {
            bot.sendMessage(chatID, `你猜的数字太大了！`);
        } else {
            bot.sendMessage(chatID, `你猜的数字太小了！`);
        }
    });

    bot.onText(/\/help/, (msg) => {
        const helpMsg = [
            {command: 'start', description: '欢迎界面'},
            {command: 'game', description: '猜数游戏'},
            {command: 'sub', description: '订阅链接'},
            {command: 'register', description: '注册'},
            {command: 'sendpic', description: '发送你的头像'},
            {command: 'setu', description: '随机色图，可加编号'},
            {command: 'goindex', description: '查询GoIndex上的文件'},
            {command: 'help', description: '帮助'},
        ];
        const helpMsgText = helpMsg.map(item => {
            return `/${item.command} - ${item.description}`;
        }).join("\n");
        bot.sendMessage(msg.chat.id, helpMsgText, {parse_mode: "HTML"});
        bot.setMyCommands(helpMsg);
    });

    bot.onText(/\/setu/, (msg) => {
        const index = parseInt(msg.text.replace("/setu", ""));
        bot.sendMessage(msg.chat.id, `色图模式`);
        axios.get('https://asiantolick.com/ajax/buscar_posts.php', {params: {index}})
            .then(res => {
                const $ = whacko.load(res.data);
                $('.miniatura').each((i, e) => {
                    const href = $(e).attr('href');
                    setTimeout(() => {
                        bot.sendMessage(msg.chat.id, href, {
                            reply_markup: {
                                inline_keyboard: [
                                    [{text: '带我去看图', url: href}],
                                ]
                            }
                        });
                    }, i * 250);
                });
            });
    });

    bot.onText(/\/goindex/, (msg) => {
        const q = msg.text.replace("/goindex ", "")
        bot.sendMessage(msg.chat.id, `正在搜寻“${q}”...`);
        goindex.query(q).then(res => {
            //筛选符合条件的文件
            videos = res.filter(e => e.mimeType === "video/mp4").filter(e => e.size < 50 * 1024 * 1024);
            images = res.filter(e => e.mimeType === "image/jpeg");
            audios = res.filter(e => e.mimeType === "audio/mp3").filter(e => e.size < 50 * 1024 * 1024);
            folders = res.filter(e => e.mimeType === "application/vnd.google-apps.folder");

            bot.sendMessage(msg.chat.id, `共有${images.length}个图片结果，${videos.length}个视频，${audios.length}个音乐，${folders.length}个目录，搜索结果：`);
            bot.sendChatAction(msg.chat.id, "upload_photo");
            images = goindex.group(images, 10);
            images.forEach((e, i) => {
                setTimeout(() => {
                    bot.sendMediaGroup(msg.chat.id, e.map(e => {
                        return {
                            type: "photo",
                            media: e.thumbnailLink.replace('=s220', '=s0'),
                            caption: e.name,
                        }
                    }));
                }, i * 2000);
            });
            bot.sendChatAction(msg.chat.id, 'upload_video');
            videos.forEach((e, i) => {
                setTimeout(() => {
                    goindex.id2path(e.id).then(path => {
                        console.log(path);
                        bot.sendVideo(msg.chat.id, encodeURI(path), {
                            caption: `${e.name}`,
                            reply_markup: {
                                inline_keyboard: [
                                    [{text: '带我去看片', url: encodeURI(path)}],
                                ]
                            }
                        });
                    });
                }, i * 2000);
            });
            bot.sendChatAction(msg.chat.id, 'upload_voice');
            audios.forEach((e, i) => {
                setTimeout(() => {
                    goindex.id2path(e.id).then(path => {
                        console.log(path);
                        bot.sendAudio(msg.chat.id, path, {caption: `${e.name}`});
                    });
                }, i * 2000);
            });
        })
    });

    bot.onText(/\/senddice/, (msg) => {
        bot.sendDice(msg.chat.id, {emoji: "🎲"});
    });

    bot.on('polling_error', (error) => {
        console.log(error.code);  // => 'EFATAL'
    })
    return bot;
}