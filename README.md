# slim pig
苗条猪.

## Install
`npm install slim-pig`

## API
* file system  
  + FSOptions object  
    - FSOptions.FSFileSystem  
      User provided file system, like the `memfs`, defaults to `fs-extra`. On windows, some file systems which has no `lstatSync` method will behave strange for a symbolic/junction.  
    - FSOptions.useNewAPI  
      Whether use new file sytem API `fs.opendir/opendirSync`, it's little slow than `fs.readdir/readdirSync`, defaults to true. No influence if the user provided file system has no this API.  
    - FsOptions.followSymbolic  
      Whether follow the symbolic, if false only return symbolic path, defaults to true return the referenced file and directory path.  
    - FSOptions.bufferSize  
      `fs.opendir/opendirSync` bufferSize option, defaults to 32.
  + isSubDirectory  
    Whether child is a sub directory of parent.  
  + isSameDirectory  
    Whether the two directories are same.
  + separateFilesDirs   
    Async seprate the directories and files, the directory or file must be exist.  
  + separateFilesDirsSync  
    Sync seprate the directories and files, the directory or file must be exist. 
  + walk  
    Async walk through a pattern.  
    Note: walk is async but the fileCallback and dirCallback should be sync.  
    If occurs an error, using `Promise.catch` handle it, e.g. `await walk(...).catch(err => { })`.  
    ```js
    // Walk all file in CWD.
    (async function () {
      const pig = require('slim-pig');
      const files = [];
      await pig.fs.walk(
        '.',
        file => files.push(file)
      );
      console.log(files);
    })();
    ```
    ```js
    // Walk js file in CWD.
    (async function () {
      const pig = require('slim-pig');
      const files = [];
      await pig.fs.walk(
        '**/*.js',
        file => files.push(file)
      );
      console.log(files);
    })();
    ```
  + walkSync  
    Sync walk through a pattern.  
    ```js
    // Walk all file in CWD.
    const pig = require('slim-pig');
    const files = [];
    pig.fs.walkSync(
      '.',
      file => files.push(file)
    );
    console.log(files);
    ``` 
    ```js
    // Walk all js file in CWD.
    const pig = require('slim-pig');
    const files = [];
    pig.fs.walkSync(
      '**/*.js',
      file => files.push(file)
    );
    console.log(files);
    ``` 
* function
  + isAsyncFunction  
    Is async function.  
    ```js
    const pig = require('slim-pig');
    // AsyncGeneratorFunction and closure.
    async function* asyncGeneratorFunction() { yield; }
    console.log(pig.func.isAsyncFunction(asyncGeneratorFunction)); // true
    console.log(pig.func.isAsyncFunction(async function* () { yield; }));
    // AsyncFunction and closure.
    async function asyncFunction() { return; }
    console.log(pig.func.isAsyncFunction(asyncFunction)); // true
    console.log(pig.func.isAsyncFunction(async function () { return; })); // true
    // Function and closure.
    function syncFunction() { return; }
    console.log(pig.func.isAsyncFunction(syncFunction)); // false
    console.log(pig.func.isAsyncFunction(() => { return; })); // false
    ```
  + runcost  
    Run function and get cost time.  
    ```js
    const pig = require('slim-pig');
    async function delay(time) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(time);
        }, time);
      });
    }
    pig.func.runcost(delay, 1000).then(cost => {
      console.log('cost time: ', cost);
    });
    ```
* pattern  
  Some glob pattern tools.  
  ⚠ Note: all backslashes will be converted to slashes.  
  + globParent  
    Extract directory part from the pattern.  
    The returned directory has no trailing path separator and the first negative symbol "!" will be ignored.  
    !! If returned directory is a lonly windows device root, keep the trailing path separator.  
    ```js
    const { globParent } = require('slim-pig').pattern;
    console.log(globParent('a/**')); // a
    console.log(globParent('!a/**')); // a
    ```
  + globPart  
    Extract glob part from the glob pattern.  
    The returned glob has no leading, trailing path separator and the first negative symbol "!" will be ignored.  
    ```js
    const { globPart } = require('slim-pig').pattern;
    console.log(globPart('a/**')); // **
    console.log(globPart('!a/**')); // **
    ```
  + isAbsolute  
    Whether an absolute pattern.  
    If start with windows device root, it's absolute.  
    If start with slash, only absolute on linux, else platform and unknow pattern are not absolute.  
    ```js
    const os = require('os');
    const isWin32 = os.platform() === 'win32';
    const { isAbsolute } = require('slim-pig').pattern;
    console.log(isAbsolute('c:/a')); // true
    console.log(isAbsolute('a')); // false
    if (isWin32) {
      console.log(isAbsolute('/a')); // false
    } else {
      console.log(isAbsolute('/a')); // true
    }
    ```
  + isGlob  
    Is a glob pattern.  
    All matching features, see: https://github.com/isaacs/minimatch#features.  
  + isWin32Pattern  
    Whether a windows pattern.  
    If start with windows device root, return true, else rely on the platform.  
    ```js
    const os = require('os');
    const isWin32 = os.platform() === 'win32';
    const { isWin32Pattern } = require('slim-pig').pattern;
    console.log(isWin32Pattern('c:/a')); // true
    if (isWin32) {
      console.log(isWin32Pattern('a')); // true
      console.log(isWin32Pattern('/a')); // true
    } else {
      console.log(isWin32Pattern('a')); // false
      console.log(isWin32Pattern('/a')); // false
    }
    ```
  + removeLeadingDot  
    Remove leading dot from pattern.  
    ```js
    const { removeLeadingDot } = require('slim-pig').pattern;
    console.log(removeLeadingDot('')); // ""
    console.log(removeLeadingDot('./foo')); // "foo"
    console.log(removeLeadingDot('.')); // "."
    console.log(removeLeadingDot('./')); // ""
    console.log(removeLeadingDot('.\\')); // ""
    ```
  + resolvePattern  
    Resolve the pattern to absolute.  
    ```js
    const os = require('os');
    const isWin32 = os.platform() === 'win32';
    const { resolvePattern } = require('slim-pig').pattern;
    console.log(resolvePattern('c:/', 'c:/')); // c:/
    console.log(resolvePattern('.', 'c:/')); // c:/
    console.log(resolvePattern('!*.js', 'c:/a')); // !c:/a/*.js
    if (!isWin32) {
      console.log(resolvePattern('/a')); // /a
      console.log(resolvePattern('a', '/')); // /a
      console.log(resolvePattern('!*.js', '/a')); // !/a/*.js
    }
    ```
  + unixlike  
    Convert windows path separator `\` to POSIX separator `/`.  
    ```js
    const { unixlike } = require('slim-pig').pattern;
    const str = `D:\\syc\\project\\nodejs\\hellos\\main.js`
    console.log(unixlike(str)); // "D:/syc/project/nodejs/hellos/main.js"
    ```
* string  
  + StringFormatter  
    A simple string formatter that using tagged template.  
    See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates.  
    ```js
    const { StringFormatter } = require('slim-pig').str;
    const formatter = new StringFormatter().setTemplate`${0} ${'foo'}!`;
    const out = formatter.format('Hello', { foo: 'World' });
    console.log(out); //" Hello World!"
    ```