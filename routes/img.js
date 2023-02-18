const express = require("express");
const router = express.Router();
const fs = require("fs");
const oss = require("../utils/oss");

//设置跨域访问
router.all("*", function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By", " 3.2.1");
	next();
});

router.get("/", function (req, res) {
	res.render("imgupload");
});

//图片上传
var multer = require("multer");
var upload = multer({
	dest: "upload/",
	fileFilter(req, file, callback) {
		// 解决中文名乱码的问题
		file.originalname = Buffer.from(file.originalname, "latin1")
			.toString(
				"utf8"
			);
		callback(null, true);
	}
});
router.post("/upload", upload.single("file"), async function (req, res, next) {
	//  文件路径
	var fileName = req.file.filename;
	// 构建图片名
	var originalName = req.file.originalname;
	const localfilename = "upload/" + fileName;
	const key = "upload/" + originalName;
	const ret = await oss.putfile(key, localfilename);
	oss.putACL(key);
	res.json(ret);
	// res.json({
	// 	status: "100",
	// 	msg: "上传成功",
	// 	key: key,
	// 	imgName: originalName
	// });
});

router.get("/search", async function (req, res, next) {
	const objects = (await oss.list("upload/")).objects.map(
		obj => {
			let {lastModified,name,size,url} = obj;
			name = name.replace("upload/","");
			return {lastModified,name,size,url};
		}
	);
	objects.sort((a,b) => {return b.lastModified>a.lastModified?1:-1;});

	res.json(objects);
});

module.exports = router;
