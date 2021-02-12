## slim pig
苗条猪.

## api
- stirng  
  + unixlike  
    将路径字符串中的 `\` 转换为 `/`  
- file system  
  + walkCurrent  
    异步遍历当前目录  
  + walkCurrentSync  
    同步遍历当前目录  
  + walk  
    异步遍历目录  
  + walkSync  
    同步遍历目录  
  + walkSyncEx  
    同步遍历目录. 对于文件回调函数 `fileCallback`, 如果返回 `{ done: true }` 则停止遍历; 对于目录回调函数 `directoryCallback` 如果返回 `{ done: true }` 停止遍历, 如果返回 `{ skip: true }` 则跳过当前目录.  
