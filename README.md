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
    同步遍历目录.  
    对于文件回调函数 `fileCallback`, 如果返回对象 `done` 属性为 `true` 则停止遍历;  
    对于目录回调函数 `dirCallback`, 如果返回对象 `done` 属性为 `true` 停止遍历, 如果返回对象 `skip` 属性为 `true` 则跳过当前目录;  
    如果 `fileCallback` 和 `dirCallback` 都不返回任何数据, 则与 `walkSync` 相同.  
  + isSubDirectory  
    Is a sub directory. See https://stackoverflow.com/a/45242825/5906199.  
  + separateFilesDirs  
    Seprate the directories and files path.  
