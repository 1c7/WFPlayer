import { mergeBuffer } from './utils';
// 发 http 请求(用 fetch ) 来加载数据
// 把数据保存到 this.data 里
// 并在加载过程中（以及加载完成后） emit 合适的事件以进行通知

// 最终结果: this.data 里面有数据了

/*
// 核心 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
// ArrayBuffer 对象的说明：
// The ArrayBuffer object is used to represent a generic, fixed-length raw binary data buffer.
说白了就是用来表示二进制数据
一个通用的，固定长度的数据
It is an array of bytes
often referred to in other languages as a "byte array"

You cannot directly manipulate the contents of an ArrayBuffer; instead, you create one of the typed array objects
不能直接操作，要用 type 才能操作

You cannot directly manipulate the contents of an ArrayBuffer; instead, you create one of the typed array objects
*/

export default class Loader {
    constructor(wf) {
        this.wf = wf;
        this.fileSize = 0; // 文件大小
        this.loadSize = 0;
        this.data = new Uint8Array();
        this.reader = null; // 和 fetch 相关的一个 reader
        this.abortController = null;
    }

    // 载入
    load(url) {
        this.destroy();
        this.abortController = new AbortController();
        const { withCredentials, cors, headers } = this.wf.options;
        this.wf.emit('loadStart');
        return fetch(url, {
            credentials: withCredentials ? 'include' : 'omit',
            mode: cors ? 'cors' : 'no-cors',
            signal: this.abortController.signal,
            headers,
        })
            .then(response => {
                // 这里读取的时候，就是直接 body.getReader()
                // body 是一个 ReadableStream

                // getReader() 是 ReadableStream.getReader()
                // getReader() 返回的是 ReadableStreamDefaultReader
                
                // ReadableStreamDefaultReader 有一个 read() 方法
                // read() 方法返回一个 promise
                
                // promise 里面就是数据 { value: theChunk, done: false }
                // 如果读完了，就是： { value: undefined, done: true }

                // 问题来了，这个 value 具体是什么？ string？

                if (response.body && typeof response.body.getReader === 'function') {
                    // 如果能拿到 reader，并且 reader 是个函数
                    // 反正就是能正确读取到数据
                    this.fileSize = Number(response.headers.get('content-length'));
                    // 读取到文件地址并保存
                    this.wf.emit('fileSize', this.fileSize);
                    this.reader = response.body.getReader();
                    return function read() {
                        return this.reader.read().then(({ done, value }) => {
                            // 这个 value 是核心，数据类型是 Uint8Array
                            // 这里 MDN 手册写得不够好
                            // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader
                            // 应该把 value 的类型是 Uint8Array 这件事写的更清楚

                            if (done) {
                                this.wf.emit('loadEnd'); // 读完了就 loadEnd 事件
                                return null;
                            }
                            // 读内容呗
                            this.loadSize += value.byteLength; // 纪录一下载入了多少
                            this.wf.emit('downloading', this.loadSize / this.fileSize); // 加载了多少
                            this.data = mergeBuffer(this.data, value); // merge 到哪里去了
                            this.wf.emit('loading', this.data.slice()); // slice 好像只是复制数组
                            return read.call(this);
                        });
                    }.call(this);
                }
                return response.arrayBuffer(); // 反正是返回一个 ArrayBuffer 对象
            })
            .then(arrayBuffer => {
                // 这个 ArrayBuffer 本身就是一个对象
                // 需要转成特定类型才能操作

                if (arrayBuffer && arrayBuffer.byteLength) { // 确保上一步的确正确解析了
                    // 毕竟那个 URL 是有可能返回 404 或者其他奇怪数据的
                    const uint8 = new Uint8Array(arrayBuffer); // 改成一个 Uint8Array？
                    // ArrayBuffer 对象用来表示通用的、固定长度的原始二进制数据缓冲区。
                    // 你不能直接操作 ArrayBuffer 的内容，而是要通过类型数组对象或 DataView 对象来操作，
                    // TypedArray 指的是以下的其中之一： 
                    // Int8Array(); 
                    // Uint8Array(); 
                    // Uint8ClampedArray();
                    // Int16Array(); 
                    // Uint16Array();
                    // Int32Array(); 
                    // Uint32Array(); 
                    // Float32Array(); 
                    // Float64Array();
                    this.fileSize = uint8.byteLength; //
                    this.wf.emit('fileSize', this.fileSize);
                    this.loadSize = uint8.byteLength;
                    this.wf.emit('downloading', this.loadSize / this.fileSize);
                    this.wf.emit('loading', uint8);
                    this.wf.emit('loadEnd'); // 载入完成
                }
            });
    }

    // 摧毁
    destroy() {
        this.fileSize = 0;
        this.loadSize = 0;
        this.data = new Uint8Array();
        if (this.reader) { // reader 干嘛的?
            this.reader.cancel();
            this.reader = null;
        }
        if (this.abortController) { // abort 控制是怎么控制的？
            this.abortController.abort();
            this.abortController = null;
        }
    }
}
