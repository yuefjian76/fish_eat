/**
 * LowHealthWarningSystem — 低血量警告的纯逻辑
 *
 * 输入 hpRatio + delta，输出这一帧的警告状态（红光强度、脉冲周期、是否该响心跳、文字闪烁）。
 * 不含任何 Phaser 依赖，UIScene 只负责按返回的状态渲染。
 *
 * 强度曲线：
 *   ratio >= threshold            → 静默
 *   criticalStart < ratio < 阈值  → 红光线性增强，无脉冲、无心跳
 *   ratio <= criticalStart        → 叠加脉冲 + 心跳 + 文字，越接近 0 越急促
 */

export const DEFAULT_LOW_HEALTH_CONFIG = {
    threshold: 0.30,
    maxVignetteAlpha: 0.8,
    // < 1 lifts the early part of the ramp so a 25%-HP warning is actually
    // perceptible in the middle of a fight (see feat-053 spec §4).
    alphaExponent: 0.5,
    pulse: {
        enabled: true,
        startThreshold: 0.18,
        slowPeriod: 1000,
        fastPeriod: 320,
        minFactor: 0.45,
    },
    heartbeat: {
        enabled: true,
        startThreshold: 0.18,
        slowInterval: 1200,
        fastInterval: 500,
    },
    text: {
        content: '危险',
        blinkPeriod: 500,
    },
};

function mergeConfig(base, override) {
    const out = {};
    for (const key of Object.keys(base)) {
        const baseValue = base[key];
        const overrideValue = override ? override[key] : undefined;
        if (overrideValue === undefined) {
            out[key] = baseValue;
        } else if (baseValue && typeof baseValue === 'object' && !Array.isArray(baseValue)) {
            out[key] = mergeConfig(baseValue, overrideValue);
        } else {
            out[key] = overrideValue;
        }
    }
    return out;
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** 在 [from, to] 之间按 t（0→1）线性插值 */
const lerp = (from, to, t) => from + (to - from) * clamp(t, 0, 1);

export class LowHealthWarningSystem {
    constructor(config = null) {
        this.config = mergeConfig(DEFAULT_LOW_HEALTH_CONFIG, config || {});
        this.reset();
    }

    reset() {
        this._active = false;
        this._critical = false;
        this._pulsePhase = 0;
        this._heartbeatTimer = 0;
        this._heartbeatCount = 0;
    }

    isActive() {
        return this._active;
    }

    getHeartbeatCount() {
        return this._heartbeatCount;
    }

    getConfig() {
        return this.config;
    }

    /**
     * 推进一帧。
     * @param {number} hpRatio 当前血量比例（0-1）
     * @param {number} delta 帧间隔（毫秒）
     * @returns {{active:boolean, alpha:number, critical:boolean, severity:number,
     *            pulsePeriod:number, showText:boolean, textAlpha:number,
     *            text:string, heartbeatDue:boolean, entered:boolean, exited:boolean}}
     */
    update(hpRatio, delta = 0) {
        const cfg = this.config;
        const ratio = clamp(Number.isFinite(hpRatio) ? hpRatio : 1, 0, 1);
        const wasActive = this._active;
        const wasCritical = this._critical;

        this._active = ratio < cfg.threshold;

        if (!this._active) {
            this._resetTransientState();
            return this._buildState({
                alpha: 0,
                critical: false,
                severity: 0,
                pulsePeriod: cfg.pulse.slowPeriod,
                showText: false,
                textAlpha: 0,
                heartbeatDue: false,
                entered: false,
                exited: wasActive,
            });
        }

        const danger = 1 - ratio / cfg.threshold;
        const exponent = Number.isFinite(cfg.alphaExponent) ? cfg.alphaExponent : 1;
        const baseAlpha = cfg.maxVignetteAlpha * Math.pow(danger, exponent);
        const criticalStart = cfg.pulse.startThreshold;
        const critical = ratio <= criticalStart;

        // severity: 0 在 critical 起点，1 在血量 0
        const severity = critical ? 1 - ratio / criticalStart : 0;

        const pulsePeriod = lerp(cfg.pulse.slowPeriod, cfg.pulse.fastPeriod, severity);
        const heartbeatInterval = lerp(
            cfg.heartbeat.slowInterval,
            cfg.heartbeat.fastInterval,
            severity
        );

        let alpha = baseAlpha;
        let textAlpha = 0;
        let heartbeatDue = false;

        if (critical) {
            if (!wasCritical) {
                // 进入 critical：相位与计时归零，保证第一拍立刻可感知
                this._pulsePhase = 0;
                this._heartbeatTimer = heartbeatInterval;
            }

            this._pulsePhase = (this._pulsePhase + delta) % pulsePeriod;
            const pulseFactor = this._pulseFactor(this._pulsePhase, pulsePeriod, cfg.pulse.minFactor);
            alpha = baseAlpha * pulseFactor;

            textAlpha = pulseFactor;

            if (cfg.heartbeat.enabled) {
                this._heartbeatTimer += delta;
                if (this._heartbeatTimer >= heartbeatInterval) {
                    this._heartbeatTimer = 0;
                    this._heartbeatCount++;
                    heartbeatDue = true;
                }
            }
        } else if (wasCritical) {
            this._pulsePhase = 0;
            this._heartbeatTimer = 0;
        }

        this._critical = critical;

        return this._buildState({
            alpha,
            critical,
            severity,
            pulsePeriod,
            showText: critical,
            textAlpha,
            heartbeatDue,
            entered: !wasActive,
            exited: false,
        });
    }

    /** 三角波：0 → 1 → 0，比 sin 更"心跳"，且完全确定性 */
    _pulseFactor(phase, period, minFactor) {
        const half = period / 2 || 1;
        const t = phase < half ? phase / half : 1 - (phase - half) / half;
        return lerp(minFactor, 1, t);
    }

    _resetTransientState() {
        this._critical = false;
        this._pulsePhase = 0;
        this._heartbeatTimer = 0;
    }

    _buildState(fields) {
        return {
            active: this._active,
            critical: this._critical,
            severity: fields.severity,
            alpha: Math.max(0, fields.alpha),
            pulsePeriod: fields.pulsePeriod,
            showText: fields.showText,
            textAlpha: clamp(fields.textAlpha, 0, 1),
            text: this.config.text.content,
            heartbeatDue: fields.heartbeatDue,
            entered: fields.entered,
            exited: fields.exited,
        };
    }
}

export default LowHealthWarningSystem;
