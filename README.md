# 阿里云函数计算 Django项目
包含如下子项目
 - airportsub: 用于机场订阅
 - danmaku：用于弹幕解析
 - ipinfo: 用纯真IP数据库查询IP信息

# 依赖
- chai: 断言库
- mocha: 测试框架
- ejs: 模板引擎
- express: web框架
- lib-qqwry: 纯真IP数据库

# 部署到fly.io
```
curl -L https://fly.io/install.sh | sh
flyctl auth login
flyctl deploy
```

# 性能提升
相比于旧版的Python项目，Node对于异步并发的处理能力更强。
Express框架的性能也比Python的Django要好很多。