import validator from 'option-validator'; // 这个也是他自己写的
// 下载量不大的一个包
import Emitter from './emitter'; // 
import Events from './events';
import Template from './template';
import Drawer from './drawer';
import Decoder from './decoder';
import Loader from './loader';
import Controller from './controller';
import { timeToDuration, clamp, errorHandle } from './utils';
// 大集合
// static 和 get 是什么意思？
// get 的意思就是可以把 class 里的 function 当做 property 来调用 
// 比如 object.method 这样，就不需要 () 这样的括号
// 缺点似乎是无法传递参数了。

// 注意全局的变量
let id = 0;
const instances = [];


export default class WFPlayer extends Emitter {
    static get instances() {
        return instances;
    }

    static get version() {
        return '__VERSION__';
    }

    static get env() {
        return '__ENV__';
    }

    // 默认选项
    static get default() {
        return {
            container: '#waveform',
            mediaElement: null,
            
            wave: true,
            
            waveColor: 'rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgb(28, 32, 34)',
            paddingColor: 'rgba(255, 255, 255, 0.05)',
            
            cursor: true,

            cursorColor: '#ff0000',
            progress: true,
            progressColor: 'rgba(255, 255, 255, 0.5)',
            
            grid: true,
            
            gridColor: 'rgba(255, 255, 255, 0.05)',
            
            ruler: true,

            rulerColor: 'rgba(255, 255, 255, 0.5)',
            rulerAtTop: true,
            withCredentials: false,
            cors: false,
            headers: {},
            channel: 0,
            duration: 10,
            padding: 5,
            waveScale: 0.8,
            pixelRatio: window.devicePixelRatio,
        };
    }

    // 这个 scheme 是意义是什么
    static get scheme() {
        const checkNum = (name, min, max, isInteger) => (value, type) => {
            errorHandle(type === 'number', `${name} expects to receive number as a parameter, but got ${type}.`);
            errorHandle(
                value >= min && value <= max && (isInteger ? Number.isInteger(value) : true),
                `'options.${name}' expect ${
                    isInteger ? 'an integer ' : 'a '
                }number that >= ${min} and <= ${max}, but got ${value}.`,
            );
            return true;
        };

        return {
            container: 'htmlelement|htmldivelement',
            mediaElement: 'null|htmlvideoelement|htmlaudioelement',
            wave: 'boolean',
            waveColor: 'string',
            backgroundColor: 'string',
            paddingColor: 'string',
            cursor: 'boolean',
            cursorColor: 'string',
            progress: 'boolean',
            progressColor: 'string',
            grid: 'boolean',
            gridColor: 'string',
            ruler: 'boolean',
            rulerColor: 'string',
            rulerAtTop: 'boolean',
            withCredentials: 'boolean',
            cors: 'boolean',
            headers: 'object',
            channel: checkNum('channel', 0, 5, true),
            duration: checkNum('duration', 1, 100, true),
            padding: checkNum('padding', 1, 100, true),
            waveScale: checkNum('waveScale', 0.1, 10, false),
            pixelRatio: checkNum('pixelRatio', 1, 10, false),
        };
    }

    // 初始化呗
    constructor(options = {}) {
        super();

        this._currentTime = 0; // 当前时间（私有，默认）
        this.isDestroy = false;
        this.options = {};
        this.setOptions(options); // 解析传递进来的选项

        this.events = new Events(this);
        this.template = new Template(this);
        this.decoder = new Decoder(this);
        this.drawer = new Drawer(this);
        this.controller = new Controller(this);
        this.loader = new Loader(this);
        // 初始化各种东西

        id += 1;
        this.id = id;
        instances.push(this);
        // 意义是初始化多个的时候，可以知道
    }

    // 当前时间
    get currentTime() {
        return this.options.mediaElement ? this.options.mediaElement.currentTime : this._currentTime;
    }

    // 时长
    get duration() {
        return this.options.mediaElement ? this.options.mediaElement.duration : timeToDuration('99:59:59.999');
    }

    // 是否在播放
    get playing() {
        const { mediaElement } = this.options;
        if (mediaElement) {
            return !!(
                mediaElement.currentTime > 0 &&
                !mediaElement.paused &&
                !mediaElement.ended &&
                mediaElement.readyState > 2
            );
        }
        return false;
    }

    // 修改选项
    setOptions(options = {}) {
        // 错误检测
        errorHandle(validator.kindOf(options) === 'object', 'setOptions expects to receive object as a parameter.');

        if (typeof options.container === 'string') {
            options.container = document.querySelector(options.container);
        }

        if (typeof options.mediaElement === 'string') {
            options.mediaElement = document.querySelector(options.mediaElement);
        }

        // schema 原来是用于验证的
        this.options = validator(
            {
                ...WFPlayer.default,
                ...this.options,
                ...options,
            },
            WFPlayer.scheme,
        );

        this.emit('options', this.options);
        return this;
    }

    // 载入
    // target 必须是 HTML audio or video 元素
    load(target) {
        if (target instanceof HTMLVideoElement || target instanceof HTMLAudioElement) {
            this.options.mediaElement = target;
            target = target.src;
        }
        errorHandle(
            typeof target === 'string' && target.trim(),
            `The load target is not a string. If you are loading a mediaElement, make sure the mediaElement.src is not empty.`,
        );
        this.loader.load(target); // 叫 loader 加载这个元素了
        this.emit('load');
        return this;
    }

    // seed 秒
    seek(second) {
        errorHandle(typeof second === 'number', 'seek expects to receive number as a parameter.');
        // 这个 clamp 是把当前时间限定在一个合理的范围内，不能是负数也不能超过媒体资源的长度
        this._currentTime = clamp(second, 0, this.duration);
        if (this.options.mediaElement && this.options.mediaElement.currentTime !== this._currentTime) {
            this.options.mediaElement.currentTime = this._currentTime;
            // 如果媒体元素存在，就设置 currentTime 属性
        }
        this.drawer.update(); // 然后 drawer 更新
        return this;
    }

    // 改频道是啥意思？
    changeChannel(channel) {
        this.setOptions({ channel });
        this.decoder.changeChannel(channel);
    }

    // 导出图片 (就是字面意思)
    exportImage() {
        this.template.exportImage();
        return this;
    }

    // 为啥要 destory
    destroy() {
        this.isDestroy = true;
        this.events.destroy();
        this.template.destroy();
        this.controller.destroy();
        this.decoder.destroy();
        this.loader.destroy();
        instances.splice(instances.indexOf(this), 1);
    }
}
