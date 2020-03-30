const fs = require("fs");
const path = require("path");

const walkCurrent = (dir, fileCallback = null, directoryCallback = null) => {
  fs.readdir(dir, (err, files) => {
    if (err)
      throw err;
    files.forEach(file => {
      const filePath = path.resolve(dir, file);
      fs.stat(filePath, (err, stats) => {
        if (stats.isDirectory()) {
          if (directoryCallback)
            directoryCallback(filePath);
        } else if (stats.isFile()) {
          if (fileCallback)
            fileCallback(filePath);
        }
      });
    })
  });
};

const walkCurrentSync = (dir, fileCallback, directoryCallback = null) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.resolve(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (directoryCallback)
        directoryCallback(filePath);
    } else {
      if (fileCallback)
        fileCallback(filePath);
    }
  });
};

const walk = (dir, fileCallback = null, directoryCallback = null) => {
  fs.readdir(dir, (err, files) => {
    if (err)
      throw err;
    files.forEach(file => {
      const filePath = path.resolve(dir, file);
      fs.stat(filePath, (err, stats) => {
        if (stats.isDirectory()) {
          if (directoryCallback)
            directoryCallback(filePath);
          walk(filePath, fileCallback, directoryCallback);
        } else if (stats.isFile()) {
          if (fileCallback)
            fileCallback(filePath);
        }
      });
    });
  });
};

const walkSync = (dir, fileCallback = null, directoryCallback = null) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.resolve(dir, file);
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      if (directoryCallback)
        directoryCallback(filePath);
      walkSync(filePath, fileCallback, directoryCallback);
    } else {
      if (fileCallback) {
        fileCallback(filePath);
      }
    }
  });
}

module.exports = {
  walkCurrent: walkCurrent,
  walkCurrentSync: walkCurrentSync,
  walk: walk,
  walkSync, walkSync
};