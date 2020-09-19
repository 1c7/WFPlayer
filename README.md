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

回答：似乎是因为 fetch 的 readable stream 只返回这个格式，没的选。
需要进一步看看。

## 工作原理（步骤）（未写完）
* 起始代码在 `src/index.js` 文件
* 里面有一个 `class WFPlayer`，里面的 `constructor` 初始化必要的参数

* 初始化的核心是 `container` 这个参数，必须是 string，
* 它的值最后会传给 `document.querySelector`，返回一个 HTML 元素

* 初始化完之后，必须手动调用 `load(target)`， 
* 这个 `target` 参数可以是一个 url 或者一个 html 元素，代码在 `src/index.js`

* 这个 `load()` 方法内部做了简单判断，判断是 url 还是 html 元素
* 反正最后的结果就是一个  string, 这个 string 就是资源的 url

* 然后会调用 `class Loader` 里的 `load(url)`
* 对，这是一个名字一样的方法，代码位于 `src/loader.js` 的 `class Loader`

* `load()` 会加载这个 url，方法是使用 `fetch` (很常见的 API 了)
* fetch 的 then 会调用 `response.body.getReader()`

* 详解：这个 body 的类型是 ReadableStream
* getReader() 是 ReadableStream.getReader()
* getReader() 返回的是 ReadableStreamDefaultReader
* ReadableStreamDefaultReader 有一个 read() 方法    
```
read() 方法返回一个 promise
promise 里面是数据 `{ value: theChunk, done: false }`
如果读完了，就是： `{ value: undefined, done: true }`   

value 是一个 Uint8Array

注意，这个 read() 方法不是一次性就结束了，读一点调用一次，会调用很多次
总之每次会 emit 一个 loading 事件，并且会把读到的所有数据，交给 class Decoder 
（还没写完）   
```

## TODO 待解决的问题 （未写完）
* 为啥 load 的时候用 new Uint8Array() 
然后转换成 Float32Array()


## 总结
这是个专门针对 Web 平台的波形绘制库（人话：只能跑在浏览器里）        
依赖了 canvas, Audio 等 Web API   