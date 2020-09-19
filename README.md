# WFPlayer
这个只是 fork 下来自己读读代码，然后存一些自己写的注释，方便以后有需要的时候可以翻阅。
不是为了发 pull request

## 笔记
* 文件：都在 src/ 里，文件不多，9个。代码量不大
* 核心： src/drawer 负责绘制
* 其他的文件，有的是加载 url，有的是 decode 数据

## 待解决的问题
* 为啥 load 的时候用 new Uint8Array() 
然后转换成 Float32Array()

回答：似乎是因为 fetch 的 readable stream 只返回这个格式，没的选。
需要进一步看看。

## 工作原理（步骤）
* `src/index.js` 里有一个 `class WFPlayer`，里面的 `constructor` 初始化必要的参数
* 2