import { filesize } from "filesize";
import pLimit from 'p-limit';

export default class BaseSource {
    // 构造函数，初始化通用配置
    constructor() {
        this.name = "";
        this.domain = "";
        this.example_urls = [];
    }

    content_template = {
        timepoint: 0,	// 弹幕发送时间（秒）
        ct: 1,	// 弹幕类型，1-3 为滚动弹幕、4 为底部、5 为顶端、6 为逆向、7 为精确、8 为高级
        size: 25,	//字体大小，25 为中，18 为小
        color: 16777215,	//弹幕颜色，RGB 颜色转为十进制后的值，16777215 为白色
        unixtime: Math.floor(Date.now() / 1000),	//Unix 时间戳格式
        uid: 0,		//发送人的 id
        content: "",
    }

    time_to_second(time) {
        const t = time.split(":");
        let s = 0;
        let m = 1;
        while (t.length > 0) {
            s += m * parseInt(t.pop(), 10);
            m *= 60;
        }
        return s;
    }

    memory() {
        const memoryUsage = process.memoryUsage();
        console.log("memory", JSON.stringify({
            rss: filesize(memoryUsage.rss),//RAM 中保存的进程占用的内存部分，包括代码本身、栈、堆。
            heapTotal: filesize(memoryUsage.heapTotal),//堆中总共申请到的内存量。
            heapUsed: filesize(memoryUsage.heapUsed),//堆中目前用到的内存量，判断内存泄漏我们主要以这个字段为准。
            external: filesize(memoryUsage.external),// V8 引擎内部的 C++ 对象占用的内存。
        }));
    }
    
    // 解析传入的视频网址，获取弹幕请求地址（Promise数组）
    async resolve(url) {
        throw new Error("Method 'resolve()' must be implemented.");
    }

    // 请求弹幕资源，返回标准化弹幕内容
    async parse(datas) {
        throw new Error("Method 'parse()' must be implemented.");
    }

    // 综合处理入口，返回最终弹幕内容
    async work(url) {
        const promises = await this.resolve(url);
        if (!this.error_msg) {
            this.memory(); //显示内存使用量
            // 并发请求弹幕数据，等待所有请求完成。
            let datas = (await Promise.allSettled(promises))
                .filter(x => x.status === "fulfilled")
                .map(x => x.value.data || x.value.body); //同时兼容 axios 和 got 的返回值结构
            this.memory(); //显示内存使用量
            console.log(this.name, "API lens:", promises.length,"API fulfilled:", datas.length, "比例:", ((datas.length / promises.length) * 100).toFixed(2) + "%");
            this.content = await this.parse(datas);
        }
		return {
			title: this.title,
			content: this.content,
			msg: this.error_msg? this.error_msg: "ok"
		};
	}
    
}