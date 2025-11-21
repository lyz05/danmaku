import urlmodule from "url";
import axios from "axios";
import BaseSource from "./base.mjs";

export default class GamerSource extends BaseSource {

	constructor() {
		super();
		this.name = "巴哈姆特動畫瘋";
		this.domain = "gamer.com.tw";
		this.example_urls = [
			"https://ani.gamer.com.tw/animeVideo.php?sn=41645",
			"https://ani.gamer.com.tw/animeVideo.php?sn=41889"
		];
	}

	async resolve(url) {
		// 相关API
		const api_video_info = "https://api.gamer.com.tw/anime/v1/video.php";
		const api_danmu = "https://api.gamer.com.tw/anime/v1/danmu.php";
		const q = urlmodule.parse(url, true);
		// 获取视频sn信息
		const sn = q.query.sn;
		if (sn) {
            var url = api_video_info+'?videoSn='+sn;
            const res = await axios({
                url: url,
                method: "get"
            });
            const data = res.data;
			this.title = data.data.video.title;
			let promises = [];
			promises.push(axios({
				method: "get",
				url: api_danmu,
				params: {
					'videoSn': sn,
					'geo': 'TW,HK',
				},
			}));
			return promises;
		} else {
			this.error_msg = "不支持的巴哈姆特動畫瘋视频网址";
			return [];
		}

	};

	async parse(datas) {
		let contents = [];
		for (let i = 0; i < datas.length; i++) {
			const data = datas[i].data;
			for (const item of data.danmu) {
				const content = JSON.parse(JSON.stringify(this.content_template));
				content.timepoint = item.time / 10;
				content.content = item.text;
				content.uid = item.userid;
				content.color = parseInt(item.color.replace('#', ''), 16)
				contents.push(content);
			}
		}
		// contents = make_response(contents);
		return contents;
	}

}

// module.exports = Gamer;

// if(!module.parent) {
// 	const g = new Gamer();
//     g.work(g.example_urls[0]).then(res=>{
//         console.log(res)
//     });
// }
