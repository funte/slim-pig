import { describe, it } from 'mocha';
import * as chai from 'chai';
const expect = chai.expect;
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import * as path from 'path';

import * as fs from '../src/lib/fs';
import * as str from '../src/lib/str';

describe('fs', function () {
  describe('#walk', () => {
    describe('with new API', () => {
      it('test done operation with file callback', async () => {
        const files: string[] = [];
        await fs.walk(path.resolve(__dirname, './fixtures'),
          // Stop when occurs any file.
          file => { return 'done'; },
          undefined,
          true
        );
        expect(files.length).to.equal(0);
      });

      it('test done operation with directory callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          // Stop when occurs any directory.
          dir => { return 'done'; },
          true
        );
        expect(files.length).to.equal(1);
      });

      it('test skip operation with directory callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          dir => {
            dir = str.unixlike(dir);
            const tokens = dir.split('/');
            // Skip sub directory "sub".
            if (tokens[tokens.length - 1] === 'sub')
              return 'skip';
          },
          true
        );
        expect(files.length).to.equal(1);
      });
    });
    describe('with old API', () => {
      it('test done operation with file callback', async () => {
        const files: string[] = [];
        await fs.walk(path.resolve(__dirname, './fixtures'),
          // Stop when occurs any file.
          file => { return 'done'; },
          undefined,
          false
        );
        expect(files.length).to.equal(0);
      });

      it('test done operation with directory callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          // Stop when occurs any directory.
          dir => { return 'done'; },
          false
        );
        expect(files.length).to.equal(1);
      });

      it('test skip operation with directory callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          dir => {
            dir = str.unixlike(dir);
            const tokens = dir.split('/');
            // Skip sub directory "sub".
            if (tokens[tokens.length - 1] === 'sub')
              return 'skip';
          },
          false
        );
        expect(files.length).to.equal(1);
      });
    });
  });

  describe('#walkSync', () => {
    describe('with new API', () => {
      it('test done operation with file callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          // Stop when occurs any file.
          file => { return 'done'; },
          undefined,
          true
        );
        expect(files.length).to.equal(0);
      });

      it('test done operation with directory callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          // Stop when occurs any directory.
          dir => { return 'done'; },
          true
        );
        expect(files.length).to.equal(1);
      });

      it('test skip operation with directory callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          dir => {
            dir = str.unixlike(dir);
            const tokens = dir.split('/');
            // Skip sub directory "sub".
            if (tokens[tokens.length - 1] === 'sub')
              return 'skip';
          },
          true
        );
        expect(files.length).to.equal(1);
      });
    });

    describe('with old API', () => {
      it('test done operation with file callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          // Stop when occurs any file.
          file => { return 'done'; },
          undefined,
          false
        );
        expect(files.length).to.equal(0);
      });

      it('test done operation with directory callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          // Stop when occurs any directory.
          dir => { return 'done'; },
          false
        );
        expect(files.length).to.equal(1);
      });

      it('test skip operation with directory callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          dir => {
            dir = str.unixlike(dir);
            const tokens = dir.split('/');
            // Skip sub directory "sub".
            if (tokens[tokens.length - 1] === 'sub')
              return 'skip';
          },
          false
        );
        expect(files.length).to.equal(1);
      });
    });
  });

  it('#isSubDirectory', () => {
    const args: Map<string[], boolean> = new Map([
      [['d:/down', 'd:/'], true],
      [['/d/down', '/d'], true],
      [['d:/', 'd:/down'], false],
      [['/d', '/d/down'], false],
      [['d:/down', 'd:/down'], false],
      [['/d/down', '/d/down'], false],
      [['d:/down/up/../../down', 'd:/'], true],
      [['/d/down/up/../../down', '/d'], true],
      [['d:/down', 'd:/down'], false],
      [['/d/down', '/d/down'], false]
    ]);
    for (const arg of args.keys()) {
      expect(fs.isSubDirectory(arg[0], arg[1])).to.equal(args.get(arg),
        `Expect "${arg[0]}" ${args.get(arg) ? 'is' : 'not'} sub directory of "${arg[1]}"`
      );
    }
  });

  // it('#separateFilesDirs', async () => {
  //   const filesdirs: string[] = [];
  //   fs.walkSync(
  //     path.resolve(__dirname, `./fixtures`),
  //     file => { filesdirs.push(file); },
  //     dir => { filesdirs.push(dir); }
  //   );
  //   expect(filesdirs.length).to.equal(3);

  //   expect(
  //     fs.separateFilesDirs(filesdirs).then(res => {
  //       expect(res.files.length).to.equal(2);
  //       expect(res.dirs.length).to.equal(1);
  //     })
  //   ).to.not.rejectedWith(Error);
  // });

  // it('#separateFilesDirsSync', () => {
  //   const filesdirs: string[] = [];
  //   fs.walkSync(
  //     path.resolve(__dirname, `./fixtures`),
  //     file => { filesdirs.push(file); },
  //     dir => { filesdirs.push(dir); }
  //   );
  //   expect(filesdirs.length).to.equal(3);

  //   const files: string[] = [];
  //   const dirs: string[] = [];
  //   fs.separateFilesDirsSync(
  //     filesdirs,
  //     file => { files.push(file); },
  //     dir => { dirs.push(dir); }
  //   );
  //   expect(files.length).to.equal(2);
  //   expect(dirs.length).to.equal(1);
  // });
});
