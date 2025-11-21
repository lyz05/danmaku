const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const compression = require('compression');
// 引入环境变量
require("dotenv")
	.config();
const app = express();
// 引入一个个路由模块
// const danmakuRouter = require("./routes/danmaku.mjs").default;
async function loadRouter() {
  const { default: danmakuRouter } = await import('./routes/danmaku.mjs');
  app.use("/", danmakuRouter);

	// 启用gzip压缩
	app.use(compression());

	// view engine setup
	app.set("views", path.join(__dirname, "views"));
	app.set("view engine", "ejs");
	app.set("trust proxy", true);

	app.use(logger("dev"));
	app.use(express.json());
	app.use(express.urlencoded({ extended: false, validate: { trustProxy: false } }));
	app.use(cookieParser());
	// 加载静态资源
	app.use(express.static(path.join(__dirname, "public"), {maxAge: 86400*1000 }));
	app.use(express.static(path.join(__dirname,"db")))
	app.use("/assets", [
		express.static(__dirname + "/node_modules/jquery/dist/",{maxAge: 86400*1000}),
		express.static(__dirname + "/node_modules/bootstrap/dist/",{maxAge: 86400*1000}),
		express.static(__dirname + "/node_modules/axios/dist/",{maxAge: 86400*1000}),
		express.static(__dirname + "/node_modules/leancloud-storage/dist",{maxAge: 86400*1000}),
	]);



	// catch 404 and forward to error handler
	app.use(function (req, res, next) {
		next(createError(404));
	});

	// error handler
	app.use(function (err, req, res) {
		// set locals, only providing error in development
		res.locals.message = err.message;
		res.locals.error = req.app.get("env") === "development" ? err : {};

		// render the error page
		res.status(err.status || 500);
		res.render("error");
	});
}
loadRouter();

module.exports = app;
