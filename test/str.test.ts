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
    const form = '{0}比{1}聪明';
    const args = ['猪', '人'];
    const result = '猪比人聪明';

    it('test static format method', function () {
      expect(str.StringFormatter.format(form, args)).to.equal(result);
    });

    it('test format method', function () {
      const formatter = new str.StringFormatter(form);
      expect(formatter.format(args)).to.equal(result);
    });
  });
});
