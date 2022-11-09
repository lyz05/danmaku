const axios = require('axios');
const pako = require('pako');
const xml2js = require('xml2js');
const {time_to_second, make_response, content_template} = require('./utils');
const memory = require('../../utils/memory')

//资源消耗大 256M内存扛不住
function Iqiyi() {
    this.name = '爱奇艺'
    this.domain = 'iqiyi.com'
    this.example_urls = [
        'https://www.iqiyi.com/v_19rr1lm35o.html', //api lens 11
        'https://www.iqiyi.com/v_1wozsa91cfs.html', //api lens 9
        'https://www.iqiyi.com/v_1zzwhiozqww.html', //api lens 10
    ];

    this.resolve = async (url) => {
        const res = await axios({
            method: 'get',
            url: "https://proxy-fc-python-fdssfsqzaa.cn-shenzhen.fcapp.run/",
            params: {url},
            auth: {username: 'proxy', password: 'proxy'}
        });
        const data = res.data
        const result = data.match(/window.Q.PageInfo.playPageInfo=(.*);/)
        const page_info = JSON.parse(result[1])
        // console.log('page_info:', page_info)

        const duration = time_to_second(page_info.duration)
        this.title = page_info.tvName ? page_info.tvName : page_info.name
        const albumid = page_info.albumId
        const tvid = page_info.tvId.toString()
        const categoryid = page_info.cid
        const page = Math.floor(duration / (60 * 5)) + 1
        console.log('tvid', tvid)
        let promises = []
        for (let i = 0; i < page; i++) {
            const api_url = `https://cmts.iqiyi.com/bullet/${tvid.slice(-4, -2)}/${tvid.slice(-2)}/${tvid}_300_${i + 1}.z`
            const params = {
                rn: '0.0123456789123456',
                business: 'danmu',
                is_iqiyi: 'true',
                is_video_page: 'true',
                tvid: tvid,
                albumid: albumid,
                categoryid: categoryid,
                qypid: '01010021010000000000'
            }
            promises.push(axios({method: 'get', url: api_url, params: params, responseType: 'arraybuffer'}))
        }
        return promises
    }

    this.parse = async (promises) => {
        let contents = [];
        const values = await Promise.all(promises)
        const datas = values
            .map(value => value.data)
            .map(value => pako.inflate(value, {to: 'string'}));

        for (const xml of datas) {
            const json = await xml2js.parseStringPromise(xml)
            // console.log(json)
            global.gc()
            for (const entry of json.danmu.data[0].entry) {
                if (!entry.list[0].bulletInfo)
                    continue
                for (const bulletInfo of entry.list[0].bulletInfo){
                    // console.log(bulletInfo)
                    const content = JSON.parse(JSON.stringify(content_template));
                    content.timepoint = bulletInfo['showTime'][0]//showTime
                    content.color = parseInt(bulletInfo['color'][0], 16)//color
                    content.content = bulletInfo['content'][0] //content
                    content.size = bulletInfo['font'][0]//font
                    contents.push(content);
                }
            }
            memory()
            // $('bulletInfo').each(function () {
            // })
        }
        contents = make_response(contents)
        return contents
    }

    this.work = async (url) => {
        const promises = await this.resolve(url);
        console.log(this.name, 'api lens:', promises.length)
        this.content = await this.parse(promises);
        return {
            title: this.title,
            content: this.content,
            msg: 'ok'
        }
    }

}

module.exports = Iqiyi

if (!module.parent) {
    const m = new Iqiyi();

    m.work(m.example_urls[2]).then(() => {
        // console.log(m.content);
        console.log(m.title);
        memory();
    });
}