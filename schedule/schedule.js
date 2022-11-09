const cron = require("node-cron");
const leancloud = require("../utils/leancloud");


cron.schedule('* * * * *', () => {
    // leancloud.add('Schedule',{})
    console.log("running a task every minute");
});