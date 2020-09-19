# WFPlayer
代码 Fork 自仓库: https://github.com/zhw2590582/WFPlayer         
Fork 时间: 2020年9月19号      

## WFPlayer 是什么?
是一个音频可视化播放器, 只负责绘制音频波形图 (`使用 <canvas> 实现`)       
其他的部分需要自己写（比如视频部分要自己弄 `<video>`)      
更通俗的来讲就是类似 Final Cut Pro 底部那个时间轴区域      
(具体请参照原项目提供的 demo，非常清晰)    

## 目的 / 意义 / 说明
这个只是 fork 之后读代码，写一些自己的注释，方便有需要时翻阅。     
不是为了发 pull request 来改善原项目。    

## 学习目的
理解 waveform 是怎么绘制到 canvas 上的。  
理解波形图是怎么绘制的，算法是什么。    

## 学习笔记
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