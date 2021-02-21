import { assert } from 'chai';
import * as str from '../src/lib/str';

describe('str', function () {
  describe('#unixlike()', function () {
    it('将路径字符串中的 `\\` 转换为 `/`', function () {
      assert.equal(
        str.unixlike('..\\..\\src\\index.js'),
        '../../src/index.js'
      );
    });
  });
});
