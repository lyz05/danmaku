const axios = require("axios");
const pako = require("pako");
const {
	time_to_second,
	make_response,
	content_template,
} = require("./utils");
const memory = require("../../utils/memory");

//资源消耗大 256M内存扛不住
function Iqiyi() {
	this.name = "爱奇艺";
	this.domain = "iqiyi.com";
	this.example_urls = [
		"https://www.iqiyi.com/v_19rr1lm35o.html", //api lens 11
		"http://www.iqiyi.com/v_1qzx9b00hs4.html?vfm=m_331_dbdy" //api lens 25
	];

	this.resolve = async (url) => {
		const res = await axios({
			url: url,
			method: "get",
			headers: {
				"Accept-Encoding": "gzip,deflate,compress"
			}
		});
		const data = res.data;
		const result = data.match(/window.Q.PageInfo.playPageInfo=(.*);/);
		const page_info = JSON.parse(result[1]);
		// console.log('page_info:', page_info)

		const duration = time_to_second(page_info.duration);
		this.title = page_info.tvName ? page_info.tvName : page_info.name;
		const albumid = page_info.albumId;
		const tvid = page_info.tvId.toString();
		const categoryid = page_info.cid;
		const page = Math.round(duration / (60 * 5));
		console.log("tvid", tvid);
		let promises = [];
		for (let i = 0; i < page; i++) {
			const api_url = `https://cmts.iqiyi.com/bullet/${tvid.slice(-4, -2)}/${tvid.slice(-2)}/${tvid}_300_${i + 1}.z`;
			const params = {
				rn: "0.0123456789123456",
				business: "danmu",
				is_iqiyi: "true",
				is_video_page: "true",
				tvid: tvid,
				albumid: albumid,
				categoryid: categoryid,
				qypid: "01010021010000000000"
			};
			promises.push(axios({
				method: "get",
				url: api_url,
				params: params,
				responseType: "arraybuffer"
			}));
		}
		return promises;
	};

	function extract(xml, tag) {
		const reg = new RegExp(`<${tag}>(.*?)</${tag}>`, "g");
		const res = xml.match(reg)
			?.map(x => x.substring(tag.length + 2, x.length - tag.length - 3));
		return res || [];
	}

	this.xml2json = (xml, contents,length) => {
		const danmaku = extract(xml, "content");
		const showTime = extract(xml, "showTime");
		const color = extract(xml, "color");
		const font = extract(xml, "font");

    // 控制步长，减小内存占用
    const step = Math.ceil(danmaku.length*length/10000);
    // console.log(step)
		for (let i = 0; i < danmaku.length; i+=step) {
			// console.log(bulletInfo)
			const content = JSON.parse(JSON.stringify(content_template));
			content.timepoint = showTime[i];//showTime
			content.color = parseInt(color[i], 16);//color
			content.content = danmaku[i]; //content
			content.size = font[i];//font
			contents.push(content);
		}
	};

	this.parse = async (promises) => {
		memory();
		//筛选出成功的请求
		let datas = (await Promise.allSettled(promises))
			.filter(x => x.status === "fulfilled")
			.map(x => x.value.data);
		memory();
		let contents = [];
		for (let i = 0; i < datas.length; i++) {
			const data = datas[i];
			let xml = pako.inflate(data, { to: "string" });
			this.xml2json(xml, contents,datas.length);
			data[i] = undefined;
			xml = undefined;
			if (global.gc) {
				global.gc();
			}
			memory();
		}
		datas = undefined;
		// contents = make_response(contents);
		memory();
		return contents;
	};

	this.work = async (url) => {
		const promises = await this.resolve(url);
		console.log(this.name, "api lens:", promises.length);
		this.content = await this.parse(promises);
		return {
			title: this.title,
			content: this.content,
			msg: "ok"
		};
	};

}

module.exports = Iqiyi;

if (!module.parent) {
	const m = new Iqiyi();

	m.work(m.example_urls[1])
		.then(() => {
			// console.log(m.content);
			console.log(m.title);
			memory();
		});
}
