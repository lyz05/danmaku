const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config({ path: "../.env" });

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
let prompt = { "role": "system", "content": "You are a helpful assistant." }
async function setprompt(content) {
    prompt = { "role": "system", "content": content || "You are a helpful assistant." }
    return prompt.content
}

async function completions(prompt) {
    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
    });
    console.log(completion.data.choices[0].text);
}

async function chat(content, messages) {
    if (!messages || messages.length == 0) {
        messages = [prompt]
    }
    messages.push({ "role": "user", "content": content });
    const completion = await openai.createChatCompletion({
        "model": "gpt-3.5-turbo",
        "messages": messages,
    });
    messages.push(completion.data.choices[0].message);
    console.log(messages)
    return [completion.data.choices[0].message.content, messages];
}

async function main() {
    const messages = [];
    // completions("护眼")
    await chat("我们来玩个猜数游戏", messages);
    await chat("规则是你心中默想一个数，然后我猜你想的数，数的范围是一到一百", messages);
    await chat("我猜50", messages);
    console.log(messages)
}

module.exports = {
    completions,
    chat,
    setprompt,
}