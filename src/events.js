// 事件
// 但是暂时没看明白为什么这么写
// 这里的核心是 this.proxy

export default class Events {
    constructor() {
        this.destroyEvents = [];
        this.proxy = this.proxy.bind(this);
    }

    proxy(target, name, callback, option = {}) {
        // name 如果是数组就拆分成单个（递归）
        if (Array.isArray(name)) {
            name.forEach(item => this.proxy(target, item, callback, option));
        } else {
            // 然后给 target 加上 event listner
            target.addEventListener(name, callback, option);
            this.destroyEvents.push(() => {
                target.removeEventListener(name, callback, option);
            });
        }
    }

    destroy() {
        this.destroyEvents.forEach(event => event());
    }
}
