const pig = require('../src/index.js');
const assert = require('assert');

describe('str', function () {
  describe('#unixlike()', function () {
    it('将路径字符串中的 `\\` 转换为 `/`', function () {
      assert.strictEqual(
        pig.str.unixlike('..\\..\\src\\index.js'),
        '../../src/index.js'
      );
    });
  });
});
