import urlmodule from "url";
import axios from "axios";
import BaseSource from "./base.mjs";


export default class MgtvSource extends BaseSource {
	constructor() {
		super();
		this.name = "芒果TV";
		this.domain = "mgtv.com";
		this.example_urls = [
			"https://www.mgtv.com/b/336727/8087768.html",
			"https://www.mgtv.com/b/459529/17730031.html" //api lens 90
		];
	}

	async resolve(url) {
		const api_video_info = "https://pcweb.api.mgtv.com/video/info";
		const api_danmaku = "https://galaxy.bz.mgtv.com/rdbarrage";
		const q = urlmodule.parse(url, true);
		const path = q.pathname.split("/");
		const cid = path.slice(-2)[0];
		const vid = path.slice(-1)[0].split(".")[0];
		const res = await axios.get(api_video_info, {params: {cid, vid}});
		this.title = res.data.data.info.videoName;
		const time = res.data.data.info.time;

		const step = 60 * 1000;
		const end_time = this.time_to_second(time) * 1000;
		let promises = [];
		for (let i = 0; i < end_time; i += step) {
			promises.push(axios({method: "get", url: api_danmaku, params: {vid, cid, time: i}}));
		}
		return promises;
	}

	async parse(promises) {
		let contents = [];
		const results = await Promise.allSettled(promises);
		let datas = results.filter(result => result.status === 'fulfilled')
			.map(result => result.value.data);
		for (const data of datas) {
			if (data.data.items === null)
				continue;
			for (const item of data.data.items) {
				const content = JSON.parse(JSON.stringify(this.content_template));
				content.timepoint = item.time / 1000;
				content.content = item.content;
				content.uid = item.uid;
				contents.push(content);
			}
		}
		// contents = make_response(contents);
		return contents;
	}
}

// module.exports = Mgtv;

// if (!module.parent) {
// 	const m = new Mgtv();

// 	m.work(m.example_urls[0]).then(() => {
// 		console.log(m.content);
// 		console.log(m.title);
// 	});
// }

