import { assert } from 'chai';
import * as path from 'path';
import * as fs from '../src/lib/fs';
import * as str from '../src/lib/str';

describe('fs', function () {
  describe('#walkCurrent()', () => {
    it('异步遍历当前目录', done => {
      const files: Array<string> = ['a'];
      const dirs: Array<string> = ['sub'];
      fs.walkCurrent(path.resolve(__dirname, './.fs.test'),
        filePath => {
          const basename: string = path.basename(filePath);
          const index: number = files.indexOf(basename);
          assert.notEqual(index, -1);
          files.splice(index, 1);
          if (files.length == 0 && dirs.length == 0) {
            done();
          }
        },
        directoryPath => {
          const basename: string = path.basename(directoryPath);
          const index: number = dirs.indexOf(basename);
          assert.notEqual(index, -1);
          dirs.splice(index, 1);
          if (files.length == 0 && dirs.length == 0) {
            done();
          }
        }
      );
    });
  });

  describe('#walkCurrentSync()', () => {
    it('同步遍历当前目录', () => {
      const files: Array<string> = ['a'];
      const dirs: Array<string> = ['sub'];
      fs.walkCurrentSync(path.resolve(__dirname, './.fs.test'),
        filePath => {
          const basename = path.basename(filePath);
          const index = files.indexOf(basename);
          assert.notEqual(index, -1);
          files.splice(index, 1);
        },
        directoryPath => {
          const basename = path.basename(directoryPath);
          const index = dirs.indexOf(basename);
          assert.notEqual(index, -1);
          dirs.splice(index, 1);
        });
      assert.equal(files.length, 0);
      assert.equal(dirs.length, 0);
    });
  });

  describe('#walk()', () => {
    it('异步历目录', done => {
      const files: Array<string> = ['a', 'b'];
      const dirs: Array<string> = ['sub'];
      fs.walk(path.resolve(__dirname, './.fs.test'),
        filePath => {
          const basename = path.basename(filePath);
          const index = files.indexOf(basename);
          assert.notEqual(index, -1);
          files.splice(index, 1);
          if (files.length == 0 && dirs.length == 0) {
            done();
          }
        },
        directoryPath => {
          const basename = path.basename(directoryPath);
          const index = dirs.indexOf(basename);
          assert.notEqual(index, -1);
          dirs.splice(index, 1);
          if (files.length == 0 && dirs.length == 0) {
            done();
          }
        }
      );
    });
  });

  describe('#walkSync()', () => {
    it('同步遍历目录', () => {
      const files: Array<string> = ['a', 'b'];
      const dirs: Array<string> = ['sub'];
      fs.walkSync(path.resolve(__dirname, './.fs.test'),
        filePath => {
          const index = files.indexOf(path.basename(filePath));
          assert.notEqual(index, -1);
          files.splice(index, 1);
        },
        directoryPath => {
          const basename = path.basename(directoryPath);
          const index = dirs.indexOf(basename);
          assert.notEqual(index, -1);
          dirs.splice(index, 1);
        }
      );
      assert.equal(files.length, 0);
      assert.equal(dirs.length, 0);
    });
  });

  describe('#walkSyncEx', () => {
    it('同步遍历目录, 文件回调函数 测试 done operation', () => {
      const filesFound: Array<string> = [];
      fs.walkSyncEx(path.resolve(__dirname, './.fs.test'),
        file => {
          filesFound.push(file);
          // Stop when find file "a".
          if (path.basename(file) === 'a')
            return { done: true };
        }
      );
      assert.equal(filesFound.length, 1);
    });

    it('同步遍历目录, 目录回调函数 测试 done operation', () => {
      const filesFound: Array<string> = [];
      fs.walkSyncEx(path.resolve(__dirname, './.fs.test'),
        file => {
          filesFound.push(file);
        },
        dir => {
          dir = str.unixlike(dir);
          const tokens = dir.split('/');
          // Stop when found directory "sub".
          if (tokens[tokens.length - 1] === 'sub')
            return { done: true };
        }
      );
      assert.equal(filesFound.length, 1);
    });

    it('同步遍历目录, 目录回调函数 测试 skip operation', () => {
      const filesFound: Array<string> = [];
      fs.walkSyncEx(path.resolve(__dirname, './.fs.test'),
        file => {
          filesFound.push(file);
        },
        dir => {
          dir = str.unixlike(dir);
          const tokens = dir.split('/');
          // Skip when found directory "sub".
          if (tokens[tokens.length - 1] === 'sub')
            return { skip: true };
        }
      );
      assert.equal(filesFound.length, 1);
    });
  });

  describe('#isSubDirectory', () => {
    it('test', () => {
      const args: Map<Array<string>, boolean> = new Map([
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
        assert.equal(fs.isSubDirectory(arg[0], arg[1]), args.get(arg),
          `Expect "${arg[0]}" ${args.get(arg) ? 'is' : 'not'} sub directory of "${arg[1]}"`
        );
      }
    });
  });

  describe('#separateFilesDirs', () => {
    const filesDirs: Array<string> = [];
    fs.walkSync(
      path.resolve(__dirname, `./.fs.test`),
      file => { filesDirs.push(file); },
      dir => { filesDirs.push(dir); }
    );
    assert.equal(filesDirs.length, 3);

    const files: Array<string> = [];
    const dirs: Array<string> = [];
    fs.separateFilesDirs(
      filesDirs,
      file => { files.push(file); },
      dir => { dirs.push(dir); }
    );
    assert.equal(files.length, 2);
    assert.equal(dirs.length, 1);
  });
});
