import { expect } from 'chai';
import { describe, it } from 'mocha';

import { StringFormatter } from '../src/lib/str';

describe('str', function () {
  describe('StringFormatter', function () {
    it('test format method', function () {
      const formatter = new StringFormatter().setTemplate`${0} ${'foo'}!`;
      expect(formatter.format('Hello', { foo: 'World' })).to.equal('Hello World!');
    });
  });
});
