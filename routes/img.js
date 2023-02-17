const express = require('express');
const router = express.Router();
const fs = require('fs');

router.get('/', function (req, res) {
  res.render('imgupload');
});

//图片上传
var multer = require('multer');
var upload = multer({
  dest: 'upload/',
  fileFilter(req, file, callback) {
    // 解决中文名乱码的问题
    file.originalname = Buffer.from(file.originalname, 'latin1')
      .toString(
        'utf8'
      );
    callback(null, true);
  }
});
router.post('/upload', upload.single('file'), function (req, res, next) {
  // 完整URL路径
  const path = req.protocol + '://' + req.headers.host;
  //  文件路径
  var fileName = req.file.filename;
  // 构建图片名
  var originalName = req.file.originalname;
  // 图片重命名
  fs.rename('upload/' + fileName, 'upload/' + originalName, (err) => {
    if (err) {
      res.json(JSON.stringify({
        status: '102',
        msg: '文件写入失败'
      }));
    } else {
      var key = path + '/upload/' + originalName;
      res.json({
        status: '100',
        msg: '上传成功',
        key: key,
        imgName: originalName
      });
    }
  });
});
module.exports = router;