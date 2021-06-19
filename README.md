# slim pig
苗条猪.

## Install
`npm install slim-pig --save-dev`

## API
- string  
  + unixlike  
    Convert windows path separator `\` to `/`.  
    ```js
    const pig = require('slim-pig');
    const str = `D:\\syc\\project\\nodejs\\hellos\\main.js`
    const out = pig.str.unixlike(str);
    console.log(out); // D:/syc/project/nodejs/hellos/main.js
      ```
- file system  
  + walk  
    Async walk throurgh a directory.  
    ```js
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
  + walkSync  
    Sync walk throurgh a directory.  
    ```js
    const pig = require('slim-pig');
    const files = [];
    pig.fs.walkSync(
      '.',
      file => files.push(file)
    );
    console.log(files);
    ```
  + isSubDirectory  
     Whether child is a sub directory of parent.  
  + separateFilesDirs   
    Async seprate the directories and files, the directory or file must be exist.  
  + separateFilesDirsSync  
    Sync seprate the directories and files, the directory or file must be exist.  
- function
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
      console.log('cose time: ', cost);
    });
    ```