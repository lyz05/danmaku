# danmaku
用于解析转换各大视频网站（芒果TV，腾讯视频，优酷视频，爱奇艺视频，哔哩哔哩）弹幕

# 依赖
- chai: 断言库
- mocha: 测试框架
- ejs: 模板引擎
- express: web框架

# 运行此项目
``` sh
npm install # 安装依赖
npm run dev # 本地运行
npm run test # 单元测试
```

# 部署到fly.io
``` sh
curl -L https://fly.io/install.sh | sh #linux
iwr https://fly.io/install.ps1 -useb | iex #windows
export FLYCTL_INSTALL="/home/codespace/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"
flyctl auth login
flyctl deploy
```

# 性能提升
相比于旧版的Python项目，Node对于异步并发的处理能力更强。
Express框架的性能也比Python的Django要好很多。

# fly.io常用命令
``` sh
flyctl status
flyctl scale count 0
flyctl regions add sea
flyctl regions remove hkg
flyctl config env
flyctl secrets set DEBUG=true
flyctl ssh console
flyctl checks list
```

# Node常用工具
```bash
npm outdated
npm update
```
