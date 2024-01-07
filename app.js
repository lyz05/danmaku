const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

// 引入环境变量
require("dotenv")
	.config();

// 引入一个个路由模块
const danmakuRouter = require("./routes/danmaku");
const airportsubRouter = require("./routes/airportsub");
const DEBUG = !(process.env.DEBUG === "false");
const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.set("trust proxy", true);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// 加载静态资源
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", [
	express.static(__dirname + "/node_modules/jquery/dist/"),
	express.static(__dirname + "/node_modules/bootstrap/dist/"),
	express.static(__dirname + "/node_modules/axios/dist/"),
]);
app.use("/upload", express.static(__dirname + "/upload"));

// 加载路由
app.use("/", danmakuRouter);
app.use("/sub", airportsubRouter);

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

if (!DEBUG) {
	console.log("PRODUCTION MODE!该模式下日志记录正常运行");
} else {
	console.log("DEBUG MODE!该模式下将关闭日志记录功能");
}

module.exports = app;
