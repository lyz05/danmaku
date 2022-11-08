const axios = require('axios');
const convert = require('xml-js');
const pako = require('pako');
const cheerio = require('cheerio');
const {time_to_second, make_response, content_template} = require('./utils');


function Iqiyi() {
    this.name = '爱奇艺'
    this.domain = 'iqiyi.com'
    this.example_urls = [
        'https://www.iqiyi.com/v_19rr1lm35o.html'
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
        page = Math.floor(duration / (60 * 5)) + 1
        console.log('tvid', tvid)
        let promises = []
        for (let i = 0; i < page; i++) {
            const api_url = `http://cmts.iqiyi.com/bullet/${tvid.slice(-4, -2)}/${tvid.slice(-2)}/${tvid}_300_${i + 1}.z`
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
        let datas = values.map(value => value.data)

        for (const data of datas) {
            const xml = pako.inflate(data, {to: 'string'})
            const $ = cheerio.load(xml, {xmlMode: true});
            $('bulletInfo').each(function (i, elem) {
                var content = JSON.parse(JSON.stringify(content_template));
                content.timepoint = $(this).find('showTime').text()//showTime
                content.color = parseInt($(this).find('color').text(), 16)//color
                content.content = $(this).find('content').text() //content
                content.size = $(this).find('font').text()//font
                contents.push(content);
            })
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

    m.work(m.example_urls[0]).then(() => {
        console.log(m.content);
        console.log(m.title);
    });
}