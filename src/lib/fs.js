const fs = require("fs");
const path = require("path");
const uniq = require('lodash.uniq');

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

/**
 * Seprate the directories and files path.
 * @param {string} filesDirs Directories and files path.
 * @param {Function} fileCallback Called when it's a file.
 * @param {Function} dirCallback Called when it's a directory.
 */
const separateFilesDirs = function (filesDirs, fileCallback, dirCallback) {
  filesDirs = filesDirs ? filesDirs : [];
  filesDirs = Array.isArray(filesDirs) ? filesDirs : [filesDirs];
  filesDirs = uniq(filesDirs);

  filesDirs.forEach(fileDir => {
    const fileDir_ = path.resolve(fileDir);
    // `fs.statSync` throw error if not found.
    const stat = fs.statSync(fileDir_);
    if (stat.isFile()) {
      fileCallback(fileDir_);
    } else if (stat.isDirectory()) {
      dirCallback(fileDir_);
    } else {
      throw new Error(`Not a file or directory \"${fileDir}\"!!`);
    }
  });
}

module.exports = {
  walkCurrent: walkCurrent,
  walkCurrentSync: walkCurrentSync,
  walk: walk,
  walkSync: walkSync,
  walkSyncEx: walkSyncEx,
  isSubDirectory: isSubDirectory,
  separateFilesDirs: separateFilesDirs
};