const urlmodule = require('url');
const axios = require('axios');
const convert = require('xml-js');
const cookie = require('cookie');
const crypto = require('crypto');
const {make_response, content_template} = require('./utils');

function Youku() {
    this.name = '优酷'
    this.domain = 'v.youku.com'
    this.example_urls = [
        'https://v.youku.com/v_show/id_XNTE5NjUxNjUyOA==.html'
    ];

    this.get_tk_enc = async () => {
        api_url = "https://acs.youku.com/h5/mtop.com.youku.aplatform.weakget/1.0/?jsv=2.5.1&appKey=24679788"
        const res = await axios.get(api_url);
        const cookies = res.headers['set-cookie']
        let targetCookie = {};
        for (let cookieStr of cookies) {
            targetCookie = Object.assign(targetCookie, cookie.parse(cookieStr));
        }
        return targetCookie
    }
    this.get_cna = async () => {
        api_url = "https://log.mmstat.com/eg.js"
        const res = await axios.get(api_url);
        const cookies = res.headers['set-cookie']
        let targetCookie = {};
        for (let cookieStr of cookies) {
            targetCookie = Object.assign(targetCookie, cookie.parse(cookieStr));
        }
        return targetCookie['cna']
    }

    const yk_msg_sign = (msg) => {
        var md5 = crypto.createHash('md5');
        return md5.update(msg + "MkmC9SoIw6xCkSKHhJ7b5D2r51kBiREr").digest('hex');
    }

    const yk_t_sign = (token, t, appkey, data) => {
        text = [token, t, appkey, data].join('&');
        var md5 = crypto.createHash('md5');
        return md5.update(text).digest('hex')
    }

    const get_vinfos_by_video_id = async (url) => {
        const q = urlmodule.parse(url, true);
        const path = q.pathname.split('/');
        const video_id = path.slice(-1)[0].split('.')[0].slice(3);
        const duration = 0
        if (video_id) {
            // "?client_id=53e6cc67237fc59a&package=com.huawei.hwvplayer.youku&ext=show&video_id={}"
            api_url = "https://openapi.youku.com/v2/videos/show.json"
            params = {
                client_id: "53e6cc67237fc59a",
                video_id: video_id,
                package: "com.huawei.hwvplayer.youku",
                ext: "show"
            }
            const res = await axios.get(api_url, {params: params})
            const duration = res.data.duration
            this.title = res.data.title
            console.log("video_id:", video_id, 'duration:', duration, 'title:', this.title)
            return [video_id, duration]
        }
    }

    this.work = async (url) => {
        const cna = await this.get_cna()
        const tk_enc = await this.get_tk_enc()
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": '_m_h5_tk=' + tk_enc['_m_h5_tk'] + ';_m_h5_tk_enc=' + tk_enc['_m_h5_tk_enc'] + ';',
            "Referer": "https://v.youku.com",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36",
        }
        const [vid, duration] = await get_vinfos_by_video_id(url)

        let contents = [];
        const max_mat = Math.floor(duration / 60) + 1
        console.log(this.name, 'api lens:', max_mat)
        for (let mat = 0; mat < max_mat; mat++) {
            api_url = "https://acs.youku.com/h5/mopen.youku.danmu.list/1.0/"
            msg = {
                "ctime": Date.now(),
                "ctype": 10004,
                "cver": "v1.0",
                "guid": cna,
                "mat": mat,
                "mcount": 1,
                "pid": 0,
                "sver": "3.1.0",
                "type": 1,
                "vid": vid
            }
            // plain-text string
            const str = JSON.stringify(msg);
            const buff = Buffer.from(str, 'utf-8');
            const msg_b64encode = buff.toString('base64');
            msg['msg'] = msg_b64encode
            msg['sign'] = yk_msg_sign(msg_b64encode)
            data = JSON.stringify(msg)
            t = Date.now()
            params = {
                "jsv": "2.5.6",
                "appKey": "24679788",
                "t": t,
                "sign": yk_t_sign(tk_enc["_m_h5_tk"].slice(0, 32), t, "24679788", data),
                "api": "mopen.youku.danmu.list",
                "v": "1.0",
                "type": "originaljson",
                "dataType": "jsonp",
                "timeout": "20000",
                "jsonpIncPrefix": "utility"
            }
            const res = await axios.post(api_url, {data}, {headers: headers, params: params})
            danmus = JSON.parse(res.data.data.result).data.result
            // 接口请求情况
            console.log(mat, res.data.ret[0])
            for (danmu of danmus) {
                var content = JSON.parse(JSON.stringify(content_template));
                content.timepoint = danmu["playat"] / 1000
                if (danmu.propertis.color) {
                    content.color = JSON.parse(danmu.propertis).color
                }
                content.content = danmu.content
                contents.push(content)
            }
        }
        contents = make_response(contents)
        this.content = contents
        return {
            title: this.title,
            content: this.content,
            msg: 'ok'
        }
    }
}

module.exports = Youku

if (!module.parent) {
    const b = new Youku();
    b.work(b.example_urls[0]).then(() => {
        console.log(b.content);
        console.log(b.title);
    });
}
