const axios = require("axios");
const pako = require("pako");
const {
    time_to_second,
    content_template,
} = require("./utils");
const memory = require("../../utils/memory");

function Iqiyi() {
    this.name = "爱奇艺";
    this.domain = "iqiyi.com";
    this.example_urls = [
        "https://www.iqiyi.com/v_bb6gsxzz78.html",
        "https://www.iqiyi.com/v_19rr1lm35o.html",
    ];

    // 新的tvid获取方法
    this.get_tvid = async (url) => {
        const id = /v_(\w+)/.exec(url)[1];
        const api = `https://pcw-api.iq.com/api/decode/${id}?platformId=3&modeCode=intl&langCode=sg`;
        const response = await axios.get(api);
        return response.data.data.toString();
    };

    // 获取视频基础信息
    this.get_video_info = async (tvid) => {
        const api = `https://pcw-api.iqiyi.com/video/video/baseinfo/${tvid}`;
        const response = await axios.get(api);
        return response.data.data;
    };

    this.resolve = async (url) => {
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

    function extract(xml, tag) {
        const reg = new RegExp(`<${tag}>(.*?)</${tag}>`, "g");
        const res = xml.match(reg)
            ?.map(x => x.substring(tag.length + 2, x.length - tag.length - 3));
        return res || [];
    }

    this.xml2json = (xml, contents, length) => {
        const danmaku = extract(xml, "content");
        const showTime = extract(xml, "showTime");
        const color = extract(xml, "color");

        const step = Math.ceil(danmaku.length * length / 10000);
        for (let i = 0; i < danmaku.length; i += step) {
            const content = JSON.parse(JSON.stringify(content_template));
            content.timepoint = showTime[i];
            content.color = parseInt(color[i], 16);
            content.content = danmaku[i];
            content.size = 25;
            contents.push(content);
        }
    };

    this.parse = async (promises) => {
        memory();
        let datas = (await Promise.allSettled(promises))
            .filter(x => x.status === "fulfilled")
            .map(x => x.value.data);
        memory();
        let contents = [];
        for (let i = 0; i < datas.length; i++) {
            const data = datas[i];
            let xml = pako.inflate(data, { to: "string" });
            this.xml2json(xml, contents, datas.length);
            datas[i] = null;
            xml = null;
            if (global.gc) global.gc();
            memory();
        }
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
    m.work(m.example_urls[0])
        .then(() => {
            console.log(m.title);
            memory();
        });
}