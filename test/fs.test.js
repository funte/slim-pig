const pig = require('../src/index.js');
var assert = require('assert');
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
});
