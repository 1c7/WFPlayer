import { errorHandle } from './utils';
// 没看懂 Template 的意义
// 目前看来只是新建 canvas 然后放进容器里

export default class Template {
    constructor(wf) {
        this.wf = wf;
        this.canvas = null; // canvas 默认空
        this.update();
    }

    update() {
        const { container, pixelRatio } = this.wf.options;
        const { clientWidth, clientHeight } = container;
        if (this.canvas) {
            this.canvas.width = clientWidth * pixelRatio;
            this.canvas.height = clientHeight * pixelRatio;
        } else {
            errorHandle(
                this.wf.constructor.instances.every(wf => wf.options.container !== container),
                'Cannot mount multiple instances on the same dom element, please destroy the previous instance first.',
            );
            errorHandle(clientWidth && clientHeight, 'The width and height of the container cannot be 0');
            container.innerHTML = ''; // 清掉容器里所有东西
            this.canvas = document.createElement('canvas'); // 创建一个 canvas 元素
            this.canvas.width = clientWidth * pixelRatio;
            this.canvas.height = clientHeight * pixelRatio;
            this.canvas.style.width = '100%'; // 占满容器
            this.canvas.style.height = '100%';
            container.appendChild(this.canvas); // 加到容器里
        }
    }

    // 导出图片
    // 导出 canvas 为图片
    exportImage() {
        const elink = document.createElement('a');
        elink.style.display = 'none';
        elink.href = this.canvas.toDataURL('image/png');
        elink.download = `${Date.now()}.png`;
        document.body.appendChild(elink);
        elink.click();
        document.body.removeChild(elink);
    }

    destroy() {
        this.wf.options.container.innerHTML = '';
    }
}
