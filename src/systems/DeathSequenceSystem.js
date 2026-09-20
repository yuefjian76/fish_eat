/**
 * DeathSequenceSystem — 死亡演出时序状态机
 *
 * 纯逻辑，不依赖 Phaser：给定 delta 推进时间轴，报告当前阶段与是否结束。
 * 所有视觉副作用（暂停物理、镜头推进、粒子、淡出）由 GameScene 根据 phase 执行。
 *
 * 阶段顺序固定：hitStop → impact → fadeOut
 */

const PHASES = ['hitStop', 'impact', 'fadeOut'];

export const DEFAULT_DEATH_SEQUENCE = {
    hitStop: {
        duration: 150,
        flash: { color: '#FFFFFF', alpha: 0.7, duration: 150 },
        shake: { intensity: 0.012, duration: 150 },
    },
    impact: {
        duration: 700,
        zoom: { from: 1.0, to: 1.3 },
        playerAlpha: { from: 1.0, to: 0.15 },
        particles: {
            count: 14,
            colors: ['#FF4444', '#FFA500', '#FFFFFF'],
            distance: 90,
            duration: 800,
        },
        text: {
            content: 'GAME OVER',
            color: '#FF4444',
            fontSize: 56,
            scaleFrom: 1.6,
        },
    },
    fadeOut: {
        duration: 500,
        color: '#000000',
    },
};

/**
 * 递归合并配置：对象深合并，数组与基本类型直接覆盖。
 */
function mergeConfig(base, override) {
    const out = {};
    for (const key of Object.keys(base)) {
        const baseValue = base[key];
        const overrideValue = override ? override[key] : undefined;
        if (overrideValue === undefined) {
            out[key] = baseValue;
        } else if (
            baseValue && typeof baseValue === 'object' && !Array.isArray(baseValue)
        ) {
            out[key] = mergeConfig(baseValue, overrideValue);
        } else {
            out[key] = overrideValue;
        }
    }
    return out;
}

export class DeathSequenceSystem {
    constructor(config = null) {
        this.config = mergeConfig(DEFAULT_DEATH_SEQUENCE, config || {});
        this.reset();
    }

    reset() {
        this._active = false;
        this._elapsed = 0;
        this._phase = 'idle';
        this._doneReported = false;
    }

    /** @returns {boolean} true 表示本次调用启动了演出；播放中再次调用返回 false */
    start() {
        if (this._active) return false;
        this._active = true;
        this._elapsed = 0;
        this._phase = PHASES[0];
        this._doneReported = false;
        return true;
    }

    isActive() {
        return this._active;
    }

    getPhase() {
        return this._phase;
    }

    getConfig() {
        return this.config;
    }

    getTotalDuration() {
        return PHASES.reduce((sum, phase) => sum + this.config[phase].duration, 0);
    }

    /**
     * 推进时间轴。
     * @param {number} delta 帧间隔（毫秒）
     * @returns {{phase:string, phaseChanged:boolean, progress:number, done:boolean, elapsed:number}|null}
     *          未在播放中返回 null；done 只在结束的那一帧为 true。
     */
    update(delta) {
        if (!this._active) return null;

        const previousPhase = this._phase;
        this._elapsed += delta;
        const total = this.getTotalDuration();

        if (this._elapsed >= total) {
            this._active = false;
            this._phase = 'done';
            const isFirstDoneReport = !this._doneReported;
            this._doneReported = true;
            return {
                phase: 'done',
                phaseChanged: true,
                progress: 1,
                done: isFirstDoneReport,
                elapsed: this._elapsed,
            };
        }

        this._phase = this._phaseAt(this._elapsed);
        return {
            phase: this._phase,
            phaseChanged: this._phase !== previousPhase,
            progress: this._elapsed / total,
            done: false,
            elapsed: this._elapsed,
        };
    }

    _phaseAt(elapsed) {
        let acc = 0;
        for (const phase of PHASES) {
            acc += this.config[phase].duration;
            if (elapsed < acc) return phase;
        }
        return PHASES[PHASES.length - 1];
    }
}

export default DeathSequenceSystem;
