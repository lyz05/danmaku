const {filesize} = require("filesize");

const print = function () {
	const memoryUsage = process.memoryUsage();

	console.log(JSON.stringify({
		rss: filesize(memoryUsage.rss),//RAM 中保存的进程占用的内存部分，包括代码本身、栈、堆。
		heapTotal: filesize(memoryUsage.heapTotal),//堆中总共申请到的内存量。
		heapUsed: filesize(memoryUsage.heapUsed),//堆中目前用到的内存量，判断内存泄漏我们主要以这个字段为准。
		external: filesize(memoryUsage.external),// V8 引擎内部的 C++ 对象占用的内存。
	}));
};

module.exports = print;
