const pig = require('../src/index.js');
const { assert, expect } = require('chai');
var path = require('path');

describe('fs', function () {

  describe('#walkCurrent()', () => {
    it('异步遍历当前目录', done => {
      var files = ['a'];
      var directories = ['sub'];
      pig.fs.walkCurrent(path.resolve('test/.fs.test'),
        filePath => {
          const basename = path.basename(filePath);
          const index = files.indexOf(basename);
          assert.notEqual(index, -1);
          files.splice(index, 1);
          if (files.length == 0 && directories.length == 0) {
            done();
          }
        },
        directoryPath => {
          const basename = path.basename(directoryPath);
          const index = directories.indexOf(basename);
          assert.notEqual(index, -1);
          directories.splice(index, 1);
          if (files.length == 0 && directories.length == 0) {
            done();
          }
        }
      );
    });
  });

  describe('#walkCurrentSync()', () => {
    it('同步遍历当前目录', () => {
      var files = ['a'];
      var directories = ['sub'];
      pig.fs.walkCurrentSync(path.resolve('test/.fs.test'),
        filePath => {
          const basename = path.basename(filePath);
          const index = files.indexOf(basename);
          assert.notEqual(index, -1);
          files.splice(index, 1);
        },
        directoryPath => {
          const basename = path.basename(directoryPath);
          const index = directories.indexOf(basename);
          assert.notEqual(index, -1);
          directories.splice(index, 1);
        });
      assert.equal(files.length, 0);
      assert.equal(directories.length, 0);
    });
  });

  describe('#walk()', () => {
    it('异步历目录', done => {
      var files = ['a', 'b'];
      var directories = ['sub'];
      pig.fs.walk(path.resolve('test/.fs.test'),
        filePath => {
          const basename = path.basename(filePath);
          const index = files.indexOf(basename);
          assert.notEqual(index, -1);
          files.splice(index, 1);
          if (files.length == 0 && directories.length == 0) {
            done();
          }
        },
        directoryPath => {
          const basename = path.basename(directoryPath);
          const index = directories.indexOf(basename);
          assert.notEqual(index, -1);
          directories.splice(index, 1);
          if (files.length == 0 && directories.length == 0) {
            done();
          }
        }
      );
    });
  });

  describe('#walkSync()', () => {
    it('同步遍历目录', () => {
      var files = ['a', 'b'];
      var directories = ['sub'];
      pig.fs.walkSync(path.resolve('test/.fs.test'),
        filePath => {
          const index = files.indexOf(path.basename(filePath));
          assert.notEqual(index, -1);
          files.splice(index, 1);
        },
        directoryPath => {
          const basename = path.basename(directoryPath);
          const index = directories.indexOf(basename);
          assert.notEqual(index, -1);
          directories.splice(index, 1);
        }
      );
      assert.equal(files.length, 0);
      assert.equal(directories.length, 0);
    });
  });

  describe('#walkSyncEx', () => {
    it('同步遍历目录, 文件回调函数 测试 done operation', () => {
      let filesFound = [];
      pig.fs.walkSyncEx(path.resolve('test/.fs.test'),
        file => {
          filesFound.push(file);
          // Stop when file `a`.
          if (path.basename(file) === 'a') {
            return { done: true };
          }
        }
      );

      assert.equal(filesFound.length, 1);
    });

    it('同步遍历目录, 目录回调函数 测试 done operation', () => {
      let filesFound = [];
      pig.fs.walkSyncEx(path.resolve('test/.fs.test'),
        file => {
          filesFound.push(file);
        },
        dir => {
          dir = pig.str.unixlike(dir);
          const tokens = dir.split('/');
          // Stop when directory `sub`.
          if (tokens[tokens.length - 1] === 'sub') {
            return { done: true };
          }
        }
      );

      assert.equal(filesFound.length, 1);
    });

    it('同步遍历目录, 目录回调函数 测试 skip operation', () => {
      let filesFound = [];
      pig.fs.walkSyncEx(path.resolve('test/.fs.test'),
        file => {
          filesFound.push(file);
        },
        dir => {
          dir = pig.str.unixlike(dir);
          const tokens = dir.split('/');
          // Skip when directory `sub`.
          if (tokens[tokens.length - 1] === 'sub') {
            return { skip: true };
          }
        }
      );

      assert.equal(filesFound.length, 1);
    });
  });

  describe('#isSubDirectory', () => {
    it('test', () => {
      const args = [
        ['d:/down', 'd:/', true],
        ['/d/down', '/d', true],
        ['d:/', 'd:/down', false],
        ['/d', '/d/down', false],
        ['d:/down', 'd:/down', false],
        ['/d/down', '/d/down', false],
        ['d:/down/up/../../down', 'd:/', true],
        ['/d/down/up/../../down', '/d', true]
      ];
      args.forEach(values => {
        assert.equal(
          pig.fs.isSubDirectory(values[0], values[1]),
          values[2],
          `\"${values[0]}\" ${values[2] ? 'is' : 'not'} sub directory of \"${values[1]}\"`
        );
      })
    });
  });

  describe('#separateFilesDirs', () => {
    // TODO: test separateFilesDirs.
  });
});
