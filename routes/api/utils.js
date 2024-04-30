const axios = require("axios");
const content_template = {
	timepoint: 0,	// 弹幕发送时间（秒）
	ct: 1,	// 弹幕类型，1-3 为滚动弹幕、4 为底部、5 为顶端、6 为逆向、7 为精确、8 为高级
	size: 25,	//字体大小，25 为中，18 为小
	color: 16777215,	//弹幕颜色，RGB 颜色转为十进制后的值，16777215 为白色
	unixtime: Math.floor(Date.now() / 1000),	//Unix 时间戳格式
	uid: 0,		//发送人的 id
	content: "",
};

function time_to_second(time) {
	const t = time.split(":");
	let s = 0;
	let m = 1;
	while (t.length > 0) {
		s += m * parseInt(t.pop(), 10);
		m *= 60;
	}
	return s;
}

async function fetchInBatches(urls, batchSize = 32) {
	let results = [],promises=[];
	console.log("=== Batch Process Start ===");
	for (let i = 0; i < urls.length; i += batchSize) {
		// console.log(`Processing batch starting from index ${i}`);
		const batchurls = urls.slice(i, i + batchSize);
		promises.push(axios.post("https://url-combine.lyz05.workers.dev/", batchurls))
		// console.log(`Batch ending at index ${i + batchSize - 1} processed`);
	}
	// Promise.allSettled不会抛出错误，所以不需要try/catch
	let batchResults = await Promise.allSettled(promises);

	// 处理每个承诺的结果
	batchResults.forEach(result => {
		if (result.status === 'fulfilled') {
			// console.log('Result:', result.value.data);
			results.push(result.value.data);  // 假设每个成功的承诺都有一个data属性
		} else {
			console.error('Failed:', result.reason.message);  // 显示失败的原因
		}
	});
	console.log("=== Batch Process End ===");
	results = results.flat()
	return results;
}

module.exports = {time_to_second, content_template, fetchInBatches};
