import { describe, it } from 'mocha';
import * as chai from 'chai';
const expect = chai.expect;
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import * as path from 'path';

import * as func from '../src/lib/func';

describe('func', () => {
  it('#isAsync', () => {
    // AsyncGeneratorFunction and closure.
    async function* asyncGeneratorFunction(): AsyncGenerator<void, void, void> { yield; }
    expect(func.isAsyncFunction(asyncGeneratorFunction)).to.true;
    expect(func.isAsyncFunction(
      async function* (): AsyncGenerator<void, void, void> { yield; }
    )).to.true;

    // AsyncFunction and closure.
    async function asyncFunction(): Promise<void> { return; }
    expect(func.isAsyncFunction(asyncFunction)).to.true;
    expect(func.isAsyncFunction(
      async function (): Promise<void> { return; }
    )).to.true;

    // Function and closure.
    function syncFunction() { return; }
    expect(func.isAsyncFunction(syncFunction)).to.false;
    expect(func.isAsyncFunction(() => { return; })).to.false;
  });
});
