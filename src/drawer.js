import { durationToTime, clamp } from './utils';
// 绘制

export default class Drawer {
    constructor(wf) {
        this.wf = wf;
        this.canvas = wf.template.canvas; // 注意  canvas
        this.ctx = this.canvas.getContext('2d');
        this.gridNum = 0;
        this.gridGap = 0;
        this.beginTime = 0;

        this.update();

        // options 改了，当然需要 update 了
        wf.on('options', () => {
            this.update();
        });

        wf.on('channelData', () => {
            this.update();
        });
    }

    // 更新
    update() {
        const {
            currentTime,
            options: { cursor, grid, ruler, wave, duration, padding },
        } = this.wf;
        // 数据取出来

        // 几个关键的初始化，后面会大量用到
        this.gridNum = duration * 10 + padding * 2; // 有多少个 grid
        this.gridGap = this.canvas.width / this.gridNum; // grid 的间隔
        this.beginTime = Math.floor(currentTime / duration) * duration;
        // 这个开始时间为啥要这样计算？

        // 发出渲染事件，进行通知，并且提供对应参数
        this.wf.emit('render', {
            padding,
            duration,
            gridGap: this.gridGap,
            gridNum: this.gridNum,
            beginTime: this.beginTime,
        });

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
    }

    drawBackground() {
        const { backgroundColor, paddingColor, padding } = this.wf.options;
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height); // 擦除

        // 填入背景颜色
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(0, 0, width, height);
        
        // 填入padding，先填入左侧然后右侧
        this.ctx.fillStyle = paddingColor;
        this.ctx.fillRect(0, 0, padding * this.gridGap, height);
        this.ctx.fillRect(width - padding * this.gridGap, 0, padding * this.gridGap, height);
    }

    // 核心
    drawWave() {
        const {
            currentTime,
            options: { progress, waveColor, progressColor, duration, padding, waveScale },
            decoder: {
                channelData,
                audiobuffer: { sampleRate },
            },
        } = this.wf;
        // currentTime 类型暂时不明，不知道是 int 的 second 还是什么
        // channelData 是核心，类型是 Float32Array
        // sampleRate 是来自 AudioBuffer 的，就是 Web 标准，一个浮点数，表示缓冲区数据的当前采样率。
        // https://developer.mozilla.org/zh-CN/docs/Web/API/AudioBuffer/sampleRate

        const { width, height } = this.canvas; // 宽高
        const middle = height / 2;
        const waveWidth = width - this.gridGap * padding * 2; 
        // ?
        
        const startIndex = clamp(this.beginTime * sampleRate, 0, Infinity);
        const endIndex = clamp((this.beginTime + duration) * sampleRate, startIndex, Infinity);
        // 这俩 index 是整数还是什么？

        const step = Math.floor((endIndex - startIndex) / waveWidth); 
        // 这个算出来是什么？

        const cursorX = padding * this.gridGap + (currentTime - this.beginTime) * this.gridGap * 10;

        let stepIndex = 0;
        let xIndex = 0;
        let min = 1;
        let max = -1;
        // 索引遍历
        for (let i = startIndex; i < endIndex; i += 1) {
            stepIndex += 1; // 这个是纪录遍历到了哪里？
            const item = channelData[i] || 0; // 取不到数据就是 0？
            if (item < min) {
                min = item; // 存最小值和最大值
            } else if (item > max) {
                max = item;
            }
            if (stepIndex >= step && xIndex < waveWidth) {
                xIndex += 1;
                const waveX = this.gridGap * padding + xIndex;
                this.ctx.fillStyle = progress && cursorX >= waveX ? progressColor : waveColor;
                this.ctx.fillRect(
                    waveX,
                    (1 + min * waveScale) * middle,
                    1,
                    Math.max(1, (max - min) * middle * waveScale),
                );
                stepIndex = 0;
                min = 1;
                max = -1;
            }
        }
    }

    // 画 grid
    drawGrid() {
        const { gridColor, pixelRatio } = this.wf.options;
        // pixelRatio
        const { width, height } = this.canvas;
        this.ctx.fillStyle = gridColor;
        // 遍历 gridNumber
        for (let index = 0; index < this.gridNum; index += 1) {
            this.ctx.fillRect(this.gridGap * index, 0, pixelRatio, height);
        }
        for (let index = 0; index < height / this.gridGap; index += 1) {
            this.ctx.fillRect(0, this.gridGap * index, width, pixelRatio);
        }
    }

    // 画时间尺度
    drawRuler() {
        const { rulerColor, pixelRatio, padding, rulerAtTop } = this.wf.options;
        const { height } = this.canvas;
        const fontSize = 11;
        const fontHeight = 15;
        const fontTop = 30;
        // 一些基本的数据
        this.ctx.font = `${fontSize * pixelRatio}px Arial`;
        this.ctx.fillStyle = rulerColor; // ruler 的颜色
        let second = -1;
        for (let index = 0; index < this.gridNum; index += 1) {
            if (index && index >= padding && index <= this.gridNum - padding && (index - padding) % 10 === 0) {
                second += 1;
                this.ctx.fillRect(
                    this.gridGap * index,
                    rulerAtTop ? 0 : height - fontHeight * pixelRatio,
                    pixelRatio,
                    fontHeight * pixelRatio,
                );
                this.ctx.fillText(
                    durationToTime(this.beginTime + second).split('.')[0],
                    this.gridGap * index - fontSize * pixelRatio * 2 + pixelRatio,
                    rulerAtTop ? fontTop * pixelRatio : height - fontTop * pixelRatio + fontSize,
                );
            } else if (index && (index - padding) % 5 === 0) {
                this.ctx.fillRect(
                    this.gridGap * index,
                    rulerAtTop ? 0 : height - (fontHeight / 2) * pixelRatio,
                    pixelRatio,
                    (fontHeight / 2) * pixelRatio,
                );
            }
        }
    }

    // 画指针
    drawCursor() {
        const {
            currentTime,
            options: { cursorColor, pixelRatio, padding },
        } = this.wf;
        const { height } = this.canvas;
        this.ctx.fillStyle = cursorColor;
        this.ctx.fillRect(
            padding * this.gridGap + (currentTime - this.beginTime) * this.gridGap * 10,
            0,
            pixelRatio,
            height,
        );
    }
}
