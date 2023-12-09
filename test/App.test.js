let chai = require("chai");
let chaiHttp = require("chai-http");
let app = require("../app");
const { bilibili, mgtv, tencentvideo, youku, iqiyi } = require("../routes/api/base");
const list = [bilibili, mgtv, tencentvideo, youku, iqiyi];
chai.should();
chai.use(chaiHttp);

//TODO: add more test cases
describe("App", () => {
	describe("弹幕解析模块测试", function () {
		this.timeout(1000*10);
		it("主页测试", (done) => {
			chai.request(app)
				.get("/")
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
		it("页面统计计数测试", (done) => {
			chai.request(app)
				.get("/pageinfo")
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
		it("传入无法打开的url测试", (done) => {
			chai.request(app)
				.get("/?url=ababa")
				.end((err, res) => {
					res.should.have.status(403);
					done();
				});
		});
		it("传入不支持的网址", (done) => {
			chai.request(app)
				.get("/?url=https://tv.sohu.com/v/MjAyMDA2MjYvbjYwMDg3NDcwOS5zaHRtbA==.html")
				.end((err, res) => {
					res.should.have.status(403);
					done();
				});
		});
		for (const item of list) {
			const name = item.name;
			const example_urls = item.example_urls;
			for (const i in example_urls) {
				const url = example_urls[i];
				it(name+"视频测试#"+i, (done) => {
					chai.request(app)
						.get("/")
						.query({url})
						.end((err, res) => {
							if (err) {
								//B站弹幕获取会遇到解压错误
								err.code.should.equal("Z_DATA_ERROR")
							}
							if (res) {
								res.should.have.status(200);
								res.header["content-type"].should.equal("application/xml; charset=utf-8");
							}
							done();
						});
				});
			}
		}

	});
	it("should respond status 404", (done) => {
		chai.request(app)
			.get("/wrongUrl")
			.end((err, res) => {
				res.should.have.status(404);
				done();
			});
	});
	describe("ipinfo模块", () => {
		it("GET the ipinfo response", (done) => {
			chai.request(app)
				.get("/ipinfo")
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
		it("GET the ipinfo with name", (done) => {
			chai.request(app)
				.get("/ipinfo?name=home999.cc")
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
		it("GET the ddns", (done) => {
			chai.request(app)
				.get("/ipinfo/ddns")
				.end((err, res) => {
					res.text.should.have.string("subdomain");
					done();
				});
		});
	});
});
