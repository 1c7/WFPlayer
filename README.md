# WFPlayer
代码 Fork 自仓库: https://github.com/zhw2590582/WFPlayer         
Fork 时间: 2020年9月19号  

## 这个对谁有用？
只对本仓库创建者有用。      
这里只是学习笔记，不过你要是愿意读这些内容也可以    
有多少帮助就很难说了，   
我这些只是写给自己看的     

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
* 核心源代码在 `src/` 文件夹里   
文件数量不多，只有9个。总体代码量不大

* 另一个核心是 `docs/` 这个是官网的示例，也必须看


## 工作原理（未写完）
看起来有点乱，但仔细读会发现其实很清晰了，        
你必须和代码一起参照着读，互相印证，光是读下面的文字没有意义。    
因为内容实在太长了，我分成了几个大步骤       


## 第一步：初始化
* 起始代码在 `src/index.js` 文件
* 里面有一个 `class WFPlayer`，里面的 `constructor` 初始化必要的参数

* 初始化的核心是 `container` 这个参数，必须是 string，
* 它的值最后会传给 `document.querySelector`，返回一个 HTML 元素

* 初始化完之后，必须手动调用 `load(target)`， 
* 这个 `target` 参数可以是一个 url 或者一个 html 元素，代码在 `src/index.js`

* 这个 `load()` 方法内部做了简单判断，判断是 url 还是 html 元素
* 反正最后的结果就是一个 string, 这个 string 就是资源的 url


## 第二步：加载 URL
* 然后会调用 `class Loader` 里的 `load(url)`
* 对，这是一个名字一样的方法，代码位于 `src/loader.js` 的 `class Loader`
* `load()` 会加载这个 url，方法是使用 `fetch` (很常见的 API 了)


### 第三步：读取到了音频数据，开始解析
```
* fetch 的 then 会调用 `response.body.getReader()`

* 详解：这个 body 的类型是 ReadableStream
* getReader() 是 ReadableStream.getReader()
* getReader() 返回的是 ReadableStreamDefaultReader
* ReadableStreamDefaultReader 有一个 read() 方法    
文档在此: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/read

read() 方法返回一个 promise
promise 里面是数据 `{ value: theChunk, done: false }`
如果读完了，就是： `{ value: undefined, done: true }`   

value 的类型是 Uint8Array
注意，这个类型是没得选的，read() 方法不接受任何参数
反正就是只给你 Uint8Array
如果需要转换类型，比如 Uint8Array 转成 Float32Array  
https://stackoverflow.com/questions/34669537/javascript-uint8array-to-float32array

var convertBlock(incomingData) { // incoming data is a UInt8Array
    var i, l = incomingData.length;
    var outputData = new Float32Array(incomingData.length);
    for (i = 0; i < l; i++) {
        outputData[i] = (incomingData[i] - 128) / 128.0;
    }
    return outputData;
}

Float32Array 的文档地址
https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Float32Array

注意，数据没有损失，只是换了个类型，本质上还是二进制数据。  

注意，这个 reader.read() 方法不是一次性就结束了，会调用很多次，
这里用的方法是递归
https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/read
    
    // Read some more, and call this function again
    return reader.read().then(processText);


总之，每次 read() 会 emit 一个 loading 事件，这个事件的参数是读到的所有数据。
数据类型是 Uint8Array

此时画面切向 class Decoder，也就是 src/decoder.js 文件   
该它进行下一步了
因为 emit loading 事件的时候会触发它

因为初始化 class Decoder 时写了 `on('loading', 函数)`
负责监听 loading 事件
它会调用 `decodeAudioData`，只有一个参数叫做 uint8，类型是 Uint8Array
(另外，因为 loading 触发很频繁，所以 throttle 了 decodeAudioData 的调用)

然后 decodeAudioData 会调用 `this.audioCtx.decodeAudioData`


decodeAudioData 是 Web API
文档地址：
https://developer.mozilla.org/zh-CN/docs/Web/API/AudioContext/decodeAudioData


旧版的写法是传参数和回调函数  
新版写法改成了 promise，

decodeAudioData 的参数是 ArrayBuffer
获得这个 ArrayBuffer 的方法是调用 Uint8Array 的 buffer 属性(只读)

Uint8Array 的文档是
https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array

文档原话 
Uint8Array.prototype.buffer 只读
返回由 Uint8Array引用的 ArrayBuffer ，在构造时期固定，所以是只读的

然后 decodeAudioData 的回调方法里会得到 decodedData 类型是 AudioBuffer 

好，现在拿到了一个 AudioBuffer，到这里就算解析完成了。

因为声音是有声道的  
下一步是调用 audiobuffer.getChannelData(0)
获取第一个声道
它返回一个 Float32Array
这个 Float32Array 会存入 this.channelData

class Decoder 的任务就此完成。这个文件一共才45行代码。不长。

好，现在我们手上有一个 this.channelData，代表当前选中的这个声道里面的音频数据。
它的类型是 Float32Array

那么下一步是要进行绘制了
```

### 第四步：绘制波形图
* 负责绘制的是 `class Drawer`, 文件位于 `src/drawer.js`   
* 这里面有一个 `update()` 方法是核心  
* 什么时候会调用呢？初始化 `class Drawer` 的时候会调用1次
* .on('options'), 选项更新的时候也会调用
* 初始化的时候就有 
`this.ctx = this.canvas.getContext('2d');`
拿到 canvas 的 context    

* `update()` 函数的代码非常易懂，如下：

```javascript
    // 画背景
    this.drawBackground();
    // 有 grid 就画 grid, 这几个 option 全部都是 true | false 的 Boolean 值
    if (grid) {
        this.drawGrid();
    }
    if (ruler) {
        this.drawRuler();
    }
    if (wave) {
        this.drawWave();
    }
    if (cursor) {
        this.drawCursor();
    }
```

分析：
* 背景不管怎样都是要画的，
* 后面的 if(grid), if(ruler)，这些变量全部都是 Boolean，代表用户设置需不需要这些
* 然后调用不同的绘制部分
* `drawRuler` 画时间线
* `drawWave` 画波形图
* 这俩函数才是核心



## 自问自答
* 问：为啥 load 的时候用 new Uint8Array() 然后转换成 Float32Array()？     
回答：因为 fetch API 只给你 Uint8Array，你没得选，不过不用担心，它不会损坏你的数据，也不会丢失一部分（比如损失精度）        
只需要调用 Uint8Array.buffer     
就可以拿到 ArrayBuffer 了，然后你自己爱怎么转换怎么转换      


## 总结
这是个专门针对 Web 平台的波形绘制库（人话：只能跑在浏览器里）        
依赖了 canvas, Audio 等 Web API   


## 学会了什么
* fetch 的 `response.body.getReader()`
* getReader() 是 ReadableStream.getReader()
* getReader() 返回的是 ReadableStreamDefaultReader
* ReadableStreamDefaultReader 有一个 read() 方法   
* 这个 read() 方法是读一小块数据，读的是 Uint8Array

* Uint8Array
* ArrayBuffer
* Uint8Array 如何转换成 ArrayBuffer

* decodeAudioData
* AudioBuffer
* getChannelData
* Float32Array


## 解析 `docs/` 里的代码
这个就是官网的 demo   

## 用了什么第三方库
* Pickr 弹出选择颜色的窗口 https://github.com/Simonwep/pickr

* ArtPlayer 做视频 (作者自己的)  https://github.com/zhw2590582/ArtPlayer   

* powerange 做 slider https://github.com/abpetkov/powerange
这是个2014年的项目，很老了

## 详解
* 只需要看 docs/assets/js/index.js 就可以了，其他的不重要  
