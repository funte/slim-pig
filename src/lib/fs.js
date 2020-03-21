const fs = require("fs");
const path = require("path");

function walk(dir, callback) {
  fs.readdir(dir, function (err, files) {
    if (err) throw err;
    files.forEach(function (file) {
      var filepath = path.join(dir, file);
      fs.stat(filepath, function (err, stats) {
        if (stats.isDirectory()) {
          walk(filepath, callback);
        } else if (stats.isFile()) {
          callback(filepath);
        }
      });
    });
  });
}

function walkSync(dir, callback) {
  var files = fs.readdirSync(dir);
  files.forEach(file => {
    var filepath = path.join(dir, file);
    var stat = fs.statSync(filepath)
    if (stat.isDirectory()) {
      walkSync(filepath, callback);
    } else {
      callback(filepath);
    }
  });
}

module.exports = {
  walk: walk,
  walkSync, walkSync
};