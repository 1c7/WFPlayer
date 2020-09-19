import DT from 'duration-time-conversion';
// 这个 DT  是什么
// https://www.npmjs.com/package/duration-time-conversion
// 这是他自己写的一个库，做一些时间的比较和转换

//这个文件，总的来说，看起来就是几个简单的的 helper 方法

// 自定义的错误, 继承了 Errors
export class WFPlayerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'WFPlayerError';
    }
}

export function errorHandle(condition, msg) {
    if (!condition) {
        throw new WFPlayerError(msg);
    }
    return condition;
}

export function durationToTime(duration = 0) {
    return DT.d2t(duration.toFixed(3));
}

export function timeToDuration(time) {
    return DT.t2d(time);
}

// 干啥了
// merge Uint8Array 数组， 就是 append 到后面去
// this.data = mergeBuffer(this.data, value)
// 这个 ...buffers 的3个点的用法不好理解，反正就是拆成数组了
export function mergeBuffer(...buffers) {
    const Cons = buffers[0].constructor;
    return buffers.reduce((pre, val) => {
        const merge = new Cons((pre.byteLength | 0) + (val.byteLength | 0));
        merge.set(pre, 0);
        merge.set(val, pre.byteLength | 0);
        return merge;
    }, new Cons());
}

// 这个是干什么?
// 似乎 clamp 是 CSS  里的一个名字，说白了就是给一个最大最小的限定范围
// 如果数字超过最小，用最小，超过最大，用最大，如果在范围内，原样返回
// JS 的 ES6 里好像也有
export function clamp(num, a, b) {
    return Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));
}

export function setStyle(element, key, value) {
    if (typeof key === 'object') {
        Object.keys(key).forEach(item => {
            setStyle(element, item, key[item]);
        });
    }
    element.style[key] = value;
    return element;
}