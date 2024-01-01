const leancloud = require('../utils/leancloud');

async function main(ms) {
  const count = await leancloud.danmakuQuery(leancloud.currentDay(),"1217")
  console.log(count);
};


main().then(console.log("OK"));