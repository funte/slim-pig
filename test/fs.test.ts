import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as path from 'path';

import * as fs from '../src/lib/fs';

describe('fs', function () {
  it('isSubDirectory', () => {
    const args: Map<string[], boolean> = new Map([
      [['d:/foo', 'd:/'], true],
      [['/d/foo', '/d'], true],
      [['d:/', 'd:/foo'], false],
      [['/d', '/d/foo'], false],
      [['d:/foo', 'd:/foo'], false],
      [['/d/foo', '/d/foo'], false],
      [['d:/foo/up/../../foo', 'd:/'], true],
      [['/d/foo/up/../../foo', '/d'], true],
      [['d:/foo', 'd:/foo'], false],
      [['/d/foo', '/d/foo'], false]
    ]);
    for (const [arg, result] of args.entries()) {
      expect(fs.isSubDirectory(arg[0], arg[1])).to.equal(result,
        `Expect "${arg[0]}" ${result ? 'is' : 'not'} sub directory of "${arg[1]}"`
      );
    }
  });

  it('isSameDirectory', () => {
    const args: Map<string[], boolean> = new Map([
      [['a', 'a'], true],
      [['/a', '/a'], true],
      [['d:/', 'd:/'], true],
      [['D:/', 'd:/'], true],
      [['d:', 'd:'], true],
      [['d:/a/..', 'd:/'], true],
      [['d:/a/.', 'd:/a'], true],
      [['.', ''], true],
      [['a', 'b'], false]
    ]);
    for (const [arg, result] of args.entries()) {
      expect(fs.isSameDirectory(arg[0], arg[1])).to.equal(result,
        `Expect "${arg[0]}" ${result ? 'is' : 'not'} same to "${arg[1]}"`
      );
    }
  });

  it('separateFilesDirs', async () => {
    const filesdirs: string[] = [];
    const files: string[] = [];
    const dirs: string[] = [];

    fs.walkSync(
      path.resolve(__dirname, 'fixtures'),
      file => { filesdirs.push(file); },
      dir => { filesdirs.push(dir); }
    );
    expect(filesdirs.length).to.equal(6);

    await fs.separateFilesDirs(
      filesdirs,
      file => { files.push(file); },
      dir => { dirs.push(dir); }
    );
    expect(files.length).to.equal(3);
    expect(dirs.length).to.equal(3);
  });

  it('separateFilesDirsSync', () => {
    const filesdirs: string[] = [];
    const files: string[] = [];
    const dirs: string[] = [];

    fs.walkSync(
      path.resolve(__dirname, './fixtures'),
      file => { filesdirs.push(file); },
      dir => { filesdirs.push(dir); }
    );
    expect(filesdirs.length).to.equal(6);

    fs.separateFilesDirsSync(
      filesdirs,
      file => { files.push(file); },
      dir => { dirs.push(dir); }
    );
    expect(files.length).to.equal(3);
    expect(dirs.length).to.equal(3);
  });

  describe('walk', () => {
    describe('with new API', () => {
      it('walk file', async () => {
        const files: string[] = [];
        await fs.walk(
          path.resolve(__dirname, './fixtures/a/a.js'),
          file => { files.push(file); }
        );
        expect(files.length).to.equal(1);
      });

      it('walk directory', async () => {
        const files: string[] = [];
        await fs.walk(
          path.resolve(__dirname, './fixtures'),
          file => { files.push(file); }
        );
        expect(files.length).to.equal(3);
      })

      it('test done operation with file callback', async () => {
        const files: string[] = [];
        await fs.walk(path.resolve(__dirname, './fixtures'),
          // Stop when occurs any file.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          file => { return 'done'; },
          undefined
        );
        expect(files.length).to.equal(0);
      });

      it('test done operation with directory callback', async () => {
        const files: string[] = [];
        await fs.walk(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          // Stop when occurs any directory.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          dir => { return 'done'; }
        );
        expect(files.length).to.equal(0);
      });

      it('test skip operation with directory callback', async () => {
        const files: string[] = [];
        await fs.walk(path.resolve(__dirname, './fixtures'),
          file => {
            files.push(file);
          },
          dir => {
            // Skip sub directory "a".
            if (dir.includes('fixtures/a') || dir.includes('fixtures\\a')) {
              return 'skip';
            }
          }
        );
        expect(files.length).to.equal(2);
      });
    });

    describe('with old API', () => {
      it('walk file', async () => {
        const files: string[] = [];
        await fs.walk(
          path.resolve(__dirname, './fixtures/a/a.js'),
          file => { files.push(file); },
          undefined,
          { useNewAPI: false }
        );
        expect(files.length).to.equal(1);
      });

      it('walk directory', async () => {
        const files: string[] = [];
        await fs.walk(
          path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          undefined,
          { useNewAPI: false }
        );
        expect(files.length).to.equal(3);
      })

      it('test done operation with file callback', async () => {
        const files: string[] = [];
        await fs.walk(path.resolve(__dirname, './fixtures'),
          // Stop when occurs any file.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          file => { return 'done'; },
          undefined,
          { useNewAPI: false }
        );
        expect(files.length).to.equal(0);
      });

      it('test done operation with directory callback', async () => {
        const files: string[] = [];
        await fs.walk(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          // Stop when occurs any directory.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          dir => { return 'done'; },
          { useNewAPI: false }
        );
        expect(files.length).to.equal(0);
      });

      it('test skip operation with directory callback', async () => {
        const files: string[] = [];
        await fs.walk(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          dir => {
            // Skip sub directory "a".
            if (dir.includes('fixtures/a') || dir.includes('fixtures\\a')) {
              return 'skip';
            }
          },
          { useNewAPI: false }
        );
        expect(files.length).to.equal(2);
      });
    });

    describe('walk absolute glob', () => {
      it('walk absolute glob', async () => {
        const files: string[] = [];
        await fs.walk(
          path.resolve(__dirname, './fixtures/**/a.js'),
          file => { files.push(file); }
        );
        expect(files.length).to.equal(1);
        expect(path.basename(files[0])).to.equal('a.js');
      });

      it('walk negative absolute glob', async () => {
        const files: string[] = [];
        await fs.walk(
          '!' + path.resolve(__dirname, './fixtures/**/a.js'),
          file => { files.push(file); }
        );
        expect(files.length).to.equal(2);
      });
    });

    describe('walk relative glob', () => {
      it('walk relative glob', async () => {
        const files: string[] = [];
        await fs.walk(
          './test/fixtures/**/a.js',
          file => { files.push(file); }
        );
        expect(files.length).to.equal(1);
        expect(path.basename(files[0])).to.equal('a.js');
      });

      it('walk negative relative glob', async () => {
        const files: string[] = [];
        await fs.walk(
          '!./test/fixtures/**/a.js',
          file => { files.push(file); }
        );
        expect(files.length).to.equal(2);
      });
    });

    it('pattern ./test/fixtures/**/* should match root file index.js', async () => {
      let found = false;
      await fs.walk(
        './test/fixtures/**/*',
        file => {
          if (path.basename(file) === 'index.js') {
            found = true;
          }
        }
      );
      expect(found).to.true;
    });
  });

  describe('walkSync', () => {
    describe('with new API', () => {
      it('walk file', () => {
        const files: string[] = [];
        fs.walkSync(
          path.resolve(__dirname, './fixtures/a/a.js'),
          file => { files.push(file); }
        );
        expect(files.length).to.equal(1);
      });

      it('walk directory', async () => {
        const files: string[] = [];
        fs.walkSync(
          path.resolve(__dirname, './fixtures'),
          file => { files.push(file); }
        );
        expect(files.length).to.equal(3);
      })

      it('test done operation with file callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          // Stop when occurs any file.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          file => { return 'done'; },
          undefined
        );
        expect(files.length).to.equal(0);
      });

      it('test done operation with directory callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          // Stop when occurs any directory.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          dir => { return 'done'; }
        );
        expect(files.length).to.equal(0);
      });

      it('test skip operation with directory callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          dir => {
            // Skip sub directory "a".
            if (dir.includes('fixtures/a') || dir.includes('fixtures\\a')) {
              return 'skip';
            }
          }
        );
        expect(files.length).to.equal(2);
      });
    });

    describe('with old API', () => {
      it('walk file', () => {
        const files: string[] = [];
        fs.walkSync(
          path.resolve(__dirname, './fixtures/a/a.js'),
          file => { files.push(file); },
          undefined,
          { useNewAPI: false }
        );
        expect(files.length).to.equal(1);
      });

      it('walk directory', async () => {
        const files: string[] = [];
        fs.walkSync(
          path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          undefined,
          { useNewAPI: false }
        );
        expect(files.length).to.equal(3);
      })

      it('test done operation with file callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          // Stop when occurs any file.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          file => { return 'done'; },
          undefined,
          { useNewAPI: false }
        );
        expect(files.length).to.equal(0);
      });

      it('test done operation with directory callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          // Stop when occurs any directory.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          dir => { return 'done'; },
          { useNewAPI: false }
        );
        expect(files.length).to.equal(0);
      });

      it('test skip operation with directory callback', () => {
        const files: string[] = [];
        fs.walkSync(path.resolve(__dirname, './fixtures'),
          file => { files.push(file); },
          dir => {
            // Skip sub directory "a".
            if (dir.includes('fixtures/a') || dir.includes('fixtures\\a')) {
              return 'skip';
            }
          },
          { useNewAPI: false }
        );
        expect(files.length).to.equal(2);
      });
    });

    describe('walk absolute glob', () => {
      it('walk absolute glob', async () => {
        const files: string[] = [];
        fs.walkSync(
          path.resolve(__dirname, './fixtures/**/a.js'),
          file => { files.push(file); }
        );
        expect(files.length).to.equal(1);
        expect(path.basename(files[0])).to.equal('a.js');
      });

      it('walk negative absolute glob', async () => {
        const files: string[] = [];
        fs.walkSync(
          '!' + path.resolve(__dirname, './fixtures/**/a.js'),
          file => { files.push(file); }
        );
        expect(files.length).to.equal(2);
      });
    });

    describe('walk relative glob', () => {
      it('walk relative glob', async () => {
        const files: string[] = [];
        fs.walkSync(
          './test/fixtures/**/a.js',
          file => { files.push(file); }
        );
        expect(files.length).to.equal(1);
        expect(path.basename(files[0])).to.equal('a.js');
      });

      it('walk negative relative glob', async () => {
        const files: string[] = [];
        fs.walkSync(
          '!./test/fixtures/**/a.js',
          file => { files.push(file); }
        );
        expect(files.length).to.equal(2);
      });
    });

    it('pattern ./test/fixtures/**/* should match root file index.js', () => {
      let found = false;
      fs.walkSync(
        './test/fixtures/**/*',
        file => {
          if (path.basename(file) === 'index.js') {
            found = true;
          }
        }
      );
      expect(found).to.true;
    });
  });
});
