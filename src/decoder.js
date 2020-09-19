import throttle from 'lodash/throttle';
import { errorHandle } from './utils';
// 就是利用 web 平台提供的 API 进行解码
// 注意这个 Decoder 和 Loader 是搭配使用的
// Loader 会不断 emit loading 事件，然后把数据带过来

// 输入：UInt8Array 
// 输出：channelData 用于给 drawer.js 进行绘制
// 何时触发：Loader 载入 url 里的数据，每次载入一点数据就触发（被 throttle 了，确保调用频率不会过高）

// 核心是 AudioBuffer
// 通过  this.audiobuffer.getChannelData(channel); 获得不同声道的数据
// 存入 this.channelData
// 绘制的时候用的就是 this.channelData

export default class Decoder {
    constructor(wf) {
        this.wf = wf;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // 拿到 audio context

        this.throttleDecodeAudioData = throttle(this.decodeAudioData, 1000);
        // https://www.lodashjs.com/docs/lodash.throttle
        // 为啥要 throttle？

        this.audiobuffer = this.audioCtx.createBuffer(2, 22050, 44100);
        // 新建一个空白的 AudioBuffer
        // https://developer.mozilla.org/zh-CN/docs/Web/API/AudioContext/createBuffer


        this.channelData = new Float32Array(); // 频道数据

        // 载入的时候调用这个
        this.wf.on('loading', uint8 => {
            this.throttleDecodeAudioData(uint8);
            // loading 的时候 throttle，为什么呢？

            // 明白了，load 的速度有快有慢，取决于网速（和其他因素）

            // 只有每次 load 到了一块新数据，
            // 就会把新数据 append 道已经读取的数据（就是 merge 在一起）
            // 成为一块新的整体

            // 这个整体并不会因为函数被 throttle 造成数据丢失
            // 这里只是降低调用频率，保证性能

            // 因为 loading 这里不是每次传递过来新 load 的那一块数据
            // 每次传递过来的都是一个整体
        });
    }

    decodeAudioData(uint8) {
        const {
            options: { channel },
        } = this.wf;
        // 这个  channel 是什么？
        // Which audio channel to render
        // 就是多声道的情况下，选择哪一个渲染，默认是0，也就是第一个声道

        // 看看这里干了啥
        // https://developer.mozilla.org/zh-CN/docs/Web/API/AudioContext/decodeAudioData
        // 异步解码音频文件中的 ArrayBuffer
        this.audioCtx.decodeAudioData(
            uint8.buffer, // 数据
            audiobuffer => {
                // 返回解析后的数据，类型是 AudioBuffer
                // AudioBuffer接口表示存在内存里的一段短小的音频资源
                // https://developer.mozilla.org/zh-CN/docs/Web/API/AudioBuffer
                this.audiobuffer = audiobuffer;
                this.wf.emit('audiobuffer', this.audiobuffer);
                this.wf.emit('decodeing', this.audiobuffer.duration / this.wf.duration);
                this.channelData = audiobuffer.getChannelData(channel); // 返回一个 Float32Array
                this.wf.emit('channelData', this.channelData);
            },
            error => {
                errorHandle(false, `It seems that the AudioContext decoding get wrong: ${error.message.trim()}`);
            },
        );
    }

    // 改变声道
    changeChannel(channel) {
        this.channelData = this.audiobuffer.getChannelData(channel);
        // getChannelData
        // https://developer.mozilla.org/zh-CN/docs/Web/API/AudioBuffer/getChannelData
        // returns a Float32Array containing the PCM data associated with the channel
        // channelData 的类型是 Float32Array

        this.wf.emit('channelData', this.channelData);
    }

    // 清空数据
    destroy() {
        this.audiobuffer = this.audioCtx.createBuffer(2, 22050, 44100);
        this.channelData = new Float32Array();
    }
}
