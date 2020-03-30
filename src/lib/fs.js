const fs = require("fs");
const path = require("path");

function walk(dir, fileCallback = null, directoryCallback = null) {
  fs.readdir(dir, function (err, files) {
    if (err) throw err;
    files.forEach(function (file) {
      var filePath = path.join(dir, file);
      fs.stat(filePath, function (err, stats) {
        if (stats.isDirectory()) {
          if (directoryCallback) {
            directoryCallback(filepath);
          }
          walk(filePath, fileCallback, directoryCallback);
        } else if (stats.isFile()) {
          if (fileCallback) {
            fileCallback(filePath);
          }
        }
      });
    });
  });
}

function walkSync(dir, fileCallback = null, directoryCallback = null) {
  var files = fs.readdirSync(dir);
  files.forEach(file => {
    var filePath = path.join(dir, file);
    var stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      if (directoryCallback) {
        directoryCallback(directoryCallback);
      }
      walkSync(filePath, fileCallback, directoryCallback);
    } else {
      if (fileCallback) {
        fileCallback(filePath);
      }
    }
  });
}

module.exports = {
  walk: walk,
  walkSync, walkSync
};