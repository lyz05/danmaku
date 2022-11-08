let chai = require('chai');
let chaiHttp = require('chai-http');
let app = require('../app');
const { bilibili, mgtv, tencentvideo, youku, iqiyi } = require('../routes/api/base');
const list = [bilibili, mgtv, tencentvideo, youku, iqiyi];

chai.use(chaiHttp);

describe('App', () => {

    describe('弹幕解析模块测试', function () {
        this.timeout(1000*60);
        it('主页测试', (done) => {
            chai.request(app)
                .get('/')
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });

        for (const item of list) {
            const name = item.name;
            const example_urls = item.example_urls;
            for (const i in example_urls) {
                const url = example_urls[i];
                it(name+'视频测试#'+i, (done) => {
                    chai.request(app)
                        .get('/')
                        .query({url})
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.header['content-type'].should.equal('application/xml');
                            done();
                        });
                });
            }
        }

    });
    describe('users modules', () => {
        it('should GET the users response', (done) => {
            chai.request(app)
                .get('/users')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.text.should.equal('respond with a resource');
                    done();
                });
        });
    });

    it('should respond status 404', (done) => {
        chai.request(app)
            .get('/wrongUrl')
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });
    describe('ipinfo modules', () => {
        it('GET the ipinfo response', (done) => {
            chai.request(app)
                .get('/ipinfo')
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });
        it('GET the ipinfo with name', (done) => {
            chai.request(app)
                .get('/ipinfo?name=home999.cc')
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });
    });
    describe('airportsub modules',()=>{

    });
});