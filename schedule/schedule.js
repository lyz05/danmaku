const cron = require("node-cron");
const leancloud = require("../utils/leancloud");
const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");


function subcache() {
    console.log("Running Cron Job：subcache");
    chai.use(chaiHttp);
    chai.request(app)
        .get('/sub/cache')
        .end((err, res) => {
            leancloud.add('Schedule', {name: 'subcache', result: res.text});
            console.log(res.text);
        });
}

cron.schedule('0 12 * * *', () => {
    subcache();
});

console.log('schedule.js loaded');
if (!module.parent) {
    subcache();
}