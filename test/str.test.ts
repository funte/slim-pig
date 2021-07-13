import * as chai from 'chai';
const expect = chai.expect;
import * as str from '../src/lib/str';

describe('str', function () {
  describe('#unixlike()', function () {
    it('将路径字符串中的 `\\` 转换为 `/`', function () {
      expect(str.unixlike('..\\..\\src\\index.js')).to.equal(
        '../../src/index.js'
      );
    });
  });

  describe('#StringFormatter', function () {
    it('test format method', function () {
      const formatter = new str.StringFormatter().setTemplate`${0} ${'foo'}!`;
      expect(formatter.format('Hello', { foo: 'World' })).to.equal('Hello World!');
    });
  });
});
