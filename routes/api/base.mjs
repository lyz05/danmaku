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
    
    // 解析传入的视频网址，获取弹幕请求地址（Promise数组）
    async resolve(url) {
        throw new Error("Method 'resolve()' must be implemented.");
    }

    // 请求弹幕资源，返回标准化弹幕内容
    async parse(promises) {
        throw new Error("Method 'parse()' must be implemented.");
    }

    // 综合处理入口，返回最终弹幕内容
    async work(url) {
        const promises = await this.resolve(url);
        if (!this.error_msg) {
		    console.log(this.name, "api lens:", promises.length);
		    this.content = await this.parse(promises);
        }
		return {
			title: this.title,
			content: this.content,
			msg: this.error_msg? this.error_msg: "ok"
		};
	}
    
}