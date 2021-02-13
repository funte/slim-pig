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
    } else if (stat.isFile()) {
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
    } else if (stat.isFile()) {
      if (fileCallback) {
        fileCallback(filePath);
      }
    }
  });
}

const walkSyncEx = function (dir, fileCallback = null, directoryCallback = null) {
  const files = fs.readdirSync(dir);

  for (let file of files) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    let op = {
      done: false,
      skip: false
    };
    if (stat.isDirectory()) {
      if (directoryCallback) {
        op = directoryCallback(file);
      }
      if (op && op.done) {
        return;
      }
      if (!op || !op.skip) {
        walkSync(file, fileCallback, directoryCallback);
      }
    } else if (stat.isFile()) {
      if (fileCallback) {
        op = fileCallback(file);
      }
      if (op && op.done) {
        return;
      }
    }
  }
}

/**
 * Is a sub directory.
 * See https://stackoverflow.com/a/45242825/5906199.
 * @param {string} child Sub directory to test.
 * @param {string} parent The parent directory.
 * @return {Boolean}.
 */
const isSubDirectory = function (child, parent) {
  const relative = path.relative(parent, child);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

module.exports = {
  walkCurrent: walkCurrent,
  walkCurrentSync: walkCurrentSync,
  walk: walk,
  walkSync: walkSync,
  walkSyncEx: walkSyncEx,
  isSubDirectory: isSubDirectory
};