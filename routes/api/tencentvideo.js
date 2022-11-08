const urlmodule = require('url');
const axios = require('axios');
const cheerio = require("cheerio");
const {make_response, content_template} = require('./utils');


function Tencentvideo() {
    this.name = '腾讯视频'
    this.domain = 'v.qq.com'
    this.example_urls = [
        'https://v.qq.com/x/cover/mzc002003pn34qk/u3319i5s3jt.html',
        'https://v.qq.com/x/cover/53q0eh78q97e4d1/x00174aq5no.html',//api lens 50
        'https://v.qq.com/x/cover/mzc00200fph94nw/l00448ijvve.html',//api lens 91
    ];

    this.resolve = async (url) => {
        const api_danmaku_base = "https://dm.video.qq.com/barrage/base/"
        const api_danmaku_segment = "https://dm.video.qq.com/barrage/segment/"
        const q = urlmodule.parse(url, true);
        const path = q.pathname.split('/');
        let vid;
        if (q.query.vid) {
            vid = q.query.vid
        } else {
            vid = path.slice(-1)[0].split('.')[0];
        }
        console.log('vid:', vid)
        let res = await axios.get(url);
        const $ = cheerio.load(res.data, null, false);
        this.title = $("title")[0].children[0].data;
        res = await axios.get(api_danmaku_base + vid);

        let promises = []
        let list = Object.values(res.data.segment_index)
        for (item of list) {
            promises.push(axios.get(`${api_danmaku_segment}${vid}/${item.segment_name}`))
        }
        return promises
    }

    this.parse = async (promises) => {
        let contents = [];
        const values = await Promise.all(promises)
        let datas = values.map(value => value.data)

        for (const data of datas) {
            for (const item of data.barrage_list) {
                var content = JSON.parse(JSON.stringify(content_template));
                content.timepoint = item.time_offset / 1000;
                if (item.content_style.color) {
                    const content_style = JSON.stringify(item.content_style.color)
                    console.log("有颜色", content_style);
                }
                content.content = item.content;
                contents.push(content);
            }
        }
        contents = make_response(contents)
        return contents
    }

    this.work = async (url) => {
        promises = await this.resolve(url);
        console.log(this.name, 'api lens:', promises.length)
        this.content = await this.parse(promises);
        return {
            title: this.title,
            content: this.content,
            msg: 'ok'
        }
    }

}

module.exports = Tencentvideo

if (!module.parent) {
    console.log('main')
    const t = new Tencentvideo()
    t.work(t.example_urls[0]).then(() => {
        console.log(t.content)
        console.log(t.title)
    });
}