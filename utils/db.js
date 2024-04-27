const sqlite3 = require('sqlite3').verbose()

let db = new sqlite3.Database(
  './db/danmaku.db',
  sqlite3.OPEN_READWRITE, 
  function (err) {
      if (err) {
          console.log(err.message)
        db = null;
      }
      console.log('connect database successfully')
  }
)

// 封装一个异步的 SQL 查询函数
function query(sql, params = []) {
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

function insert(sql, params = []) {
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
  try {
    const rows = await insert("INSERT INTO Error(ip, url, err, created_at) VALUES(?, ?, ?, datetime('now'))",
      [record.ip,record.url,record.err]
    )
    return rows
  }catch (err) {
    console.error('Error during data insertion:', err.message);
  }
}

async function accessInsert(record) {
  try {
    const rows = await insert("INSERT INTO Access(ip, url, UA, created_at) VALUES(?, ?, ?, datetime('now'))",
      [record.ip,record.url,record.UA]
    )
    return rows
  }catch (err) {
    console.error('Error during data insertion:', err.message);
  }
  
}

async function accesscountquery() {
  try {
    const ret = await query("SELECT * FROM AccessStatistics");
    return ret[0];
  } catch (err) {
    console.error('Error during data query:', err.message);
    return {'today_visited':"null",'lastday_visited':"null",'month_visited':"null"};
  }
}

async function videoinfoInsert(record) {
  try {
    const rows = await insert("INSERT INTO videoinfo(url, title) VALUES(?, ?)",
      [record.url,record.title]
    )
    return rows
  }catch (err) {
    console.error('Error during data insertion:', err.message);
  }
}

async function hotlistquery() {
  try {
    return await query("SELECT * FROM YesterdayHotlist;");
  } catch (err) {
    console.error('Error during data query:', err.message);
    return null;
  }
}

async function main() {
  const ret = await hotlistquery()
  console.log(ret)
}

if (!module.parent) {
  accessInsert(
    {
      'ip': '127.0.0.1',
      'url': 'https://www.mgtv.com/b/336727/8087768.html',
      'UA': 'PostmanRuntime/7.37.3'
    }
  )
  
  videoinfoInsert(
    {
      'url': 'https://www.mgtv.com/b/336727/8087768.html',
      'title': '婚前21天'
    }
  )
  main()
}

module.exports = { errorInsert, accessInsert, accesscountquery, videoinfoInsert, hotlistquery};