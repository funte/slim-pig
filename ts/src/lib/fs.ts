import * as fs from 'fs-extra';
import * as path from 'path';

type FileCallback = (file: string) => void;
type DirectoryCallback = (dir: string) => void;

/**
 * 异步遍历当前目录.
 */
export function walkCurrent(dir: string, fileCallback?: FileCallback, dirCallback?: DirectoryCallback): void {
  fs.readdir(dir, (err, fielsDirs) => {
    if (err)
      throw err;
    fielsDirs.forEach(fileDir => {
      fileDir = path.resolve(dir, fileDir);
      fs.stat(fileDir, (err, stats) => {
        if (err)
          throw err;
        if (stats.isDirectory()) {
          if (dirCallback)
            dirCallback(fileDir);
        } else if (stats.isFile()) {
          if (fileCallback)
            fileCallback(fileDir);
        }
      });
    })
  });
}

/**
 * 同步遍历当前目录.
 */
export function walkCurrentSync(dir: string, fileCallback?: FileCallback, dirCallback?: DirectoryCallback): void {
  const filesDirs = fs.readdirSync(dir);
  filesDirs.forEach(fileDir => {
    fileDir = path.resolve(dir, fileDir);
    const stat = fs.statSync(fileDir);
    if (stat.isDirectory()) {
      if (dirCallback)
        dirCallback(fileDir);
    } else if (stat.isFile()) {
      if (fileCallback)
        fileCallback(fileDir);
    }
  });
}

/**
 * 异步遍历目录.
 */
export function walk(dir: string, fileCallback?: FileCallback, dirCallback?: DirectoryCallback): void {
  fs.readdir(dir, (err, filesDirs) => {
    if (err)
      throw err;
    filesDirs.forEach(fileDir => {
      fileDir = path.resolve(dir, fileDir);
      fs.stat(fileDir, (err, stats) => {
        if (err)
          throw err;
        if (stats.isDirectory()) {
          if (dirCallback)
            dirCallback(fileDir);
          walk(fileDir, fileCallback, dirCallback);
        } else if (stats.isFile()) {
          if (fileCallback)
            fileCallback(fileDir);
        }
      });
    });
  });
}

/**
 * 同步遍历目录.
 */
export function walkSync(dir: string, fileCallback?: FileCallback, dirCallback?: DirectoryCallback): void {
  const filesDirs = fs.readdirSync(dir);
  filesDirs.forEach(fileDir => {
    fileDir = path.resolve(dir, fileDir);
    const stat = fs.statSync(fileDir)
    if (stat.isDirectory()) {
      if (dirCallback)
        dirCallback(fileDir);
      walkSync(fileDir, fileCallback, dirCallback);
    } else if (stat.isFile()) {
      if (fileCallback) {
        fileCallback(fileDir);
      }
    }
  });
}

type FileCallbackEx = (file: string) => { done: boolean } | void;
type DirectoryCallbackEx = (file: string) => { done: boolean, skip: boolean } | { done: boolean } | { skip: boolean } | void;

/**
 * 同步遍历目录.
 * 对于文件回调函数 "fileCallback", 如果返回对象 "done" 属性为 true 则停止遍历;
 * 对于目录回调函数 "dirCallback", 如果返回对象 "done" 属性为 true 停止遍历,
 * 如果返回对象 "skip" 属性为 true 则跳过当前目录.  
 */
export function walkSyncEx(dir: string, fileCallback?: FileCallbackEx, dirCallback?: DirectoryCallbackEx): void {
  for (let fileDir of fs.readdirSync(dir)) {
    fileDir = path.resolve(dir, fileDir);
    const stat = fs.statSync(fileDir);
    // const op = new Op();
    const op = { done: false, skip: false };
    if (stat.isDirectory()) {
      if (dirCallback)
        Object.assign(op, dirCallback(fileDir));
      if (op.done)
        return;
      if (!op.skip)
        walkSyncEx(fileDir, fileCallback, dirCallback);
    } else if (stat.isFile()) {
      if (fileCallback)
        Object.assign(op, fileCallback(fileDir));
      if (op.done)
        return;
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
export function isSubDirectory(child: string, parent: string): boolean {
  const relative = path.relative(parent, child);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Seprate the directories and files path.
 * @param {string} filesDirs Directories and files path.
 * @param {Function} fileCallback Called when it's a file.
 * @param {Function} dirCallback Called when it's a directory.
 */
export function separateFilesDirs(filesDirs: Array<string>, fileCallback?: FileCallback, dirCallback?: DirectoryCallback): void {
  filesDirs.forEach(fileDir => {
    fileDir = path.resolve(fileDir);
    // `fs.statSync` throw error if not found.
    const stat = fs.statSync(fileDir);
    if (stat.isFile()) {
      if (fileCallback)
        fileCallback(fileDir);
    } else if (stat.isDirectory()) {
      if (dirCallback)
        dirCallback(fileDir);
    }
  });
}
