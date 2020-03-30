const pig = require('../src/index.js');
var assert = require('assert');
var path = require('path');

describe('fs', function () {
  describe('#walk()', function () {
    it('同步历目录', function (done) {
      var files = ['a', 'b'];
      pig.fs.walk(path.resolve('test/.fs.test'), filePath => {
        const basename = path.basename(filePath);
        const position = files.indexOf(basename);
        assert.notEqual(position, -1);
        files.splice(position, 1);
        if (files.length == 0) {
          done();
        }
      });
    });
  });

  // describe('#walkSync()', function () {
  //   it('异步遍历目录', function () {
  //     var files = ['a', 'b'];
  //     pig.fs.walkSync(path.resolve('test/.fs.test'), file => {
  //       var index = files.indexOf(path.basename(file));
  //       assert.notEqual(index, -1);
  //       files.splice(index, 1);
  //     });
  //     assert.equal(files.length, 0);
  //   });
  // });
});
