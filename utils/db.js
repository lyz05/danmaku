const sqlite3 = require('sqlite3').verbose();

let dbConnected = true; // 连接状态
let db;

if (dbConnected) {
  db = new sqlite3.Database(
    './db/danmaku.db',
    sqlite3.OPEN_READWRITE,
    function (err) {
      if (err) {
        console.log(err.message);
        dbConnected = false; // 更新连接状态
      } else {
        console.log('Connected to the database successfully');
      }
    }
  );
}



// 封装一个异步的 SQL 查询函数
function all(sql, params = []) {
  if (!dbConnected) return []; // 返回默认值
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function run(sql, params = []) {
  if (!dbConnected) return null; // 返回默认值
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

async function errorInsert(record) {
  if (!dbConnected) return null; // 返回默认值
  try {
    const rows = await run("INSERT INTO Error(ip, url, err, created_at) VALUES(?, ?, ?, datetime('now'))",
      [record.ip, record.url, record.err]
    );
    return rows;
  } catch (err) {
    console.error('Error during data insertion:', err.message);
  }
}

async function accessInsert(record) {
  if (!dbConnected) return null; // 返回默认值
  try {
    const rows = await run("INSERT INTO Access(ip, url, UA, created_at) VALUES(?, ?, ?, datetime('now'))",
      [record.ip, record.url, record.UA]
    );
    return rows;
  } catch (err) {
    console.error('Error during data insertion:', err.message);
  }
}

async function accessCountQuery() {
  if (!dbConnected) return {'today_visited': "null", 'lastday_visited': "null", 'month_visited': "null"}; // 返回默认值
  try {
    const ret = await all("SELECT * FROM AccessStatistics");
    return ret[0];
  } catch (err) {
    console.error('Error during data query:', err.message);
    return {'today_visited': "null", 'lastday_visited': "null", 'month_visited': "null"};
  }
}

async function videoInfoInsert(record) {
  if (!dbConnected) return null; // 返回默认值
  try {
    const rows = await run("INSERT INTO videoinfo(url, title) VALUES(?, ?)",
      [record.url, record.title]
    );
    return rows;
  } catch (err) {
    console.error('Error during data insertion:', err.message);
  }
}

async function hotlistQuery() {
  if (!dbConnected) return []; // 返回默认值
  try {
    return await all("SELECT * FROM YesterdayHotlist;");
  } catch (err) {
    console.error('Error during data query:', err.message);
    return null;
  }
}

// 删除三个月以前的记录Access,Error
async function deleteAccess() {
  if (!dbConnected) return null; // 返回默认值
  try {
    // vacuum
    await run("vacuum");
    let result,changes = 0;
    result = await run("DELETE FROM Access WHERE created_at < datetime('now', '-3 month')");
    changes += result.changes;
    result = await run("DELETE FROM Error WHERE created_at < datetime('now', '-3 month')");
    changes += result.changes;
    // vacuum
    await run("vacuum");
    console.log("deleteAccess Affect Rows:",changes)
    return changes; // 提取删除的行数
  } catch (err) {
    console.error('Error during data deletion:', err.message);
    return null;
  }
}

// async function main() {
//   const ret = await deleteAccess();
//   console.log(ret);
// }

// if (!module.parent) {
//   accessInsert({
//     'ip': '127.0.0.1',
//     'url': 'https://www.mgtv.com/b/336727/8087768.html',
//     'UA': 'PostmanRuntime/7.37.3'
//   });

//   videoInfoInsert({
//     'url': 'https://www.mgtv.com/b/336727/8087768.html',
//     'title': '婚前21天'
//   });

//   main();
// }

module.exports = { errorInsert, accessInsert, accessCountQuery, videoInfoInsert, hotlistQuery, deleteAccess };
