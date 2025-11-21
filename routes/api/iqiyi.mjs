import axios from "axios";
import BaseSource from "./base.mjs";
import pako from "pako";

export default class IqiyiSource extends BaseSource {
    constructor() {
        super();
        this.name = "爱奇艺";
        this.domain = "iqiyi.com";
        this.example_urls = [
            "https://www.iqiyi.com/v_bb6gsxzz78.html",
            "https://www.iqiyi.com/v_19rr1lm35o.html",
        ];
    }

    // 新的tvid获取方法
    async get_tvid(url) {
        const id = /v_(\w+)/.exec(url)[1];
        const api = `https://pcw-api.iq.com/api/decode/${id}?platformId=3&modeCode=intl&langCode=sg`;
        const response = await axios.get(api);
        return response.data.data.toString();
    };

    // 获取视频基础信息
    async get_video_info(tvid) {
        const api = `https://pcw-api.iqiyi.com/video/video/baseinfo/${tvid}`;
        const response = await axios.get(api);
        return response.data.data;
    };

    async resolve(url) {
        // 1. 获取tvid
        const tvid = await this.get_tvid(url);
        
        // 2. 获取视频基础信息
        const videoInfo = await this.get_video_info(tvid);
        this.title = videoInfo.name || videoInfo.tvName;
        const duration = videoInfo.durationSec;
        const albumid = videoInfo.albumId;
        const categoryid = videoInfo.channelId || videoInfo.categoryId;

        // 3. 计算需要请求的弹幕文件数量(每5分钟一个)
        const page = Math.ceil(duration / (60 * 5));
        console.log("tvid:", tvid, "duration:", duration, "pages:", page);

        // 4. 构建弹幕请求
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

    extract(xml, tag) {
        const reg = new RegExp(`<${tag}>(.*?)</${tag}>`, "g");
        const res = xml.match(reg)
            ?.map(x => x.substring(tag.length + 2, x.length - tag.length - 3));
        return res || [];
    }

    xml2json(xml, contents, length) {
        const danmaku = this.extract(xml, "content");
        const showTime = this.extract(xml, "showTime");
        const color = this.extract(xml, "color");

        const step = Math.ceil(danmaku.length * length / 10000);
        for (let i = 0; i < danmaku.length; i += step) {
            const content = JSON.parse(JSON.stringify(this.content_template));
            content.timepoint = showTime[i];
            content.color = parseInt(color[i], 16);
            content.content = danmaku[i];
            content.size = 25;
            contents.push(content);
        }
    };

    async parse(datas) {
        let contents = [];
        for (let i = 0; i < datas.length; i++) {
            const data = datas[i];
            let xml = pako.inflate(data, { to: "string" });
            this.xml2json(xml, contents, datas.length);
            datas[i] = null;
            xml = null;
            if (global.gc) global.gc();
        }
        return contents;
    };

}

// module.exports = Iqiyi;

// if (!module.parent) {
//     const m = new Iqiyi();
//     m.work(m.example_urls[0])
//         .then(() => {
//             console.log(m.title);
//         });
// }