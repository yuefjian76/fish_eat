import { LowHealthWarningSystem, DEFAULT_LOW_HEALTH_CONFIG } from '../LowHealthWarningSystem.js';

const CONFIG = {
    threshold: 0.30,
    maxVignetteAlpha: 0.8,
    alphaExponent: 0.5,
    pulse: { enabled: true, startThreshold: 0.18, slowPeriod: 1000, fastPeriod: 320, minFactor: 0.45 },
    heartbeat: { enabled: true, startThreshold: 0.18, slowInterval: 1200, fastInterval: 500 },
    text: { content: '危险', blinkPeriod: 500 },
};

const IDLE = { hpRatio: 1.0, delta: 16 };

describe('LowHealthWarningSystem', () => {
    describe('A. 健康血量（阈值以上）', () => {
        test('满血时完全静默', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            const s = sys.update(1.0, 16);
            expect(s.active).toBe(false);
            expect(s.alpha).toBe(0);
            expect(s.showText).toBe(false);
            expect(s.heartbeatDue).toBe(false);
        });

        test('刚好等于阈值时仍静默（边界，不包含）', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            expect(sys.update(0.30, 16).active).toBe(false);
        });

        test('阈值下方一点即激活', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            expect(sys.update(0.29, 16).active).toBe(true);
        });
    });

    describe('B. alpha 曲线', () => {
        test('alpha 随血量降低线性增强', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            const near = sys.update(0.30 - 0.001, 16).alpha;
            const mid = sys.update(0.15, 16).alpha;
            const dead = sys.update(0.0, 16).alpha;
            expect(near).toBeLessThan(mid);
            expect(mid).toBeLessThan(dead);
        });

        test('0 血时 alpha 在脉冲峰值达到 maxVignetteAlpha', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            const samples = [];
            for (let i = 0; i < 40; i++) samples.push(sys.update(0, 16).alpha);
            expect(Math.max(...samples)).toBeCloseTo(0.8, 2);
            // 谷值 = maxVignetteAlpha * minFactor
            expect(Math.min(...samples)).toBeCloseTo(0.8 * 0.45, 2);
        });

        test('非 critical 区间 alpha 不含脉冲（等于 base alpha）', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            expect(sys.update(0.24, 16).alpha).toBeCloseTo(0.8 * Math.sqrt(1 - 0.24 / 0.30), 5);
        });

        test('平方根曲线让 25% 血量的警告明显强于线性（可感知性）', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            const alpha = sys.update(0.25, 16).alpha;
            expect(alpha).toBeGreaterThan(0.25); // 线性只有 0.8*0.167 = 0.13
        });

        test('alpha 永远不超过 maxVignetteAlpha', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            expect(sys.update(-5, 16).alpha).toBeLessThanOrEqual(0.8);
        });

        test('非 critical 区间 alpha 不脉冲（连续两帧相等）', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            const a = sys.update(0.25, 16).alpha;
            const b = sys.update(0.25, 16).alpha;
            expect(a).toBe(b);
        });
    });

    describe('C. severity 与脉冲递进', () => {
        test('severity 在 critical 起点为 0，血量为 0 时为 1', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            expect(sys.update(0.18, 16).severity).toBeCloseTo(0, 2);
            expect(sys.update(0, 16).severity).toBeCloseTo(1, 2);
        });

        test('血量越低脉冲周期越短', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            const slow = sys.update(0.179, 16).pulsePeriod;
            const fast = sys.update(0.02, 16).pulsePeriod;
            expect(fast).toBeLessThan(slow);
        });

        test('脉冲周期被钳制在配置范围内', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            expect(sys.update(0.179, 16).pulsePeriod).toBeLessThanOrEqual(1000);
            expect(sys.update(0, 16).pulsePeriod).toBeGreaterThanOrEqual(320);
        });

        test('critical 区间内 alpha 随时间振荡', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            const samples = [];
            for (let i = 0; i < 40; i++) samples.push(sys.update(0.05, 50).alpha);
            expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.05);
        });

        test('振荡不突破 base alpha 上限', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            for (let i = 0; i < 60; i++) {
                expect(sys.update(0.10, 50).alpha).toBeLessThanOrEqual(0.8 + 1e-6);
            }
        });
    });

    describe('D. 心跳', () => {
        test('健康血量不触发心跳', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            sys.update(0.5, 5000);
            expect(sys.getHeartbeatCount()).toBe(0);
        });

        test('critical 区间内按间隔累计触发心跳', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            let due = 0;
            for (let i = 0; i < 60; i++) {
                if (sys.update(0.02, 100).heartbeatDue) due++;
            }
            expect(due).toBeGreaterThanOrEqual(4);
            expect(sys.getHeartbeatCount()).toBe(due);
        });

        test('血量越低心跳越急促', () => {
            const slowSys = new LowHealthWarningSystem(CONFIG);
            const fastSys = new LowHealthWarningSystem(CONFIG);
            let slowCount = 0;
            let fastCount = 0;
            for (let i = 0; i < 100; i++) {
                if (slowSys.update(0.179, 100).heartbeatDue) slowCount++;
                if (fastSys.update(0.02, 100).heartbeatDue) fastCount++;
            }
            expect(fastCount).toBeGreaterThan(slowCount);
        });

        test('离开 critical 后不再触发心跳，计数保留', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            for (let i = 0; i < 30; i++) sys.update(0.02, 100);
            const count = sys.getHeartbeatCount();
            expect(count).toBeGreaterThan(0);
            for (let i = 0; i < 30; i++) {
                expect(sys.update(0.9, 100).heartbeatDue).toBe(false);
            }
            expect(sys.getHeartbeatCount()).toBe(count);
        });
    });

    describe('E. 文字提示', () => {
        test('非 critical 不显示文字', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            expect(sys.update(0.25, 16).showText).toBe(false);
            expect(sys.update(0.25, 16).textAlpha).toBe(0);
        });

        test('critical 显示文字且 alpha 在 0-1 之间振荡', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            const samples = [];
            for (let i = 0; i < 40; i++) samples.push(sys.update(0.05, 50));
            expect(samples.every(s => s.showText)).toBe(true);
            expect(Math.max(...samples.map(s => s.textAlpha))).toBeGreaterThan(0.9);
            expect(Math.min(...samples.map(s => s.textAlpha))).toBeLessThan(0.5);
            expect(Math.min(...samples.map(s => s.textAlpha))).toBeGreaterThanOrEqual(0);
        });

        test('text 内容来自配置', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            const s = sys.update(0.05, 16);
            expect(s.text).toBe('危险');
        });
    });

    describe('F. reset 与配置', () => {
        test('reset() 清空累计状态', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            for (let i = 0; i < 30; i++) sys.update(0.02, 100);
            sys.reset();
            expect(sys.getHeartbeatCount()).toBe(0);
            expect(sys.isActive()).toBe(false);
            expect(sys.update(1.0, 16).active).toBe(false);
        });

        test('缺省 config 使用默认值', () => {
            const sys = new LowHealthWarningSystem();
            expect(sys.getConfig().threshold).toBe(DEFAULT_LOW_HEALTH_CONFIG.threshold);
        });

        test('部分 config 深合并', () => {
            const sys = new LowHealthWarningSystem({ heartbeat: { slowInterval: 4321 } });
            expect(sys.getConfig().heartbeat.slowInterval).toBe(4321);
            expect(sys.getConfig().threshold).toBe(DEFAULT_LOW_HEALTH_CONFIG.threshold);
        });

        test('alpha 下限不为负（血量不可能为负，但需防御）', () => {
            const sys = new LowHealthWarningSystem(CONFIG);
            expect(sys.update(-1, 16).alpha).toBeGreaterThanOrEqual(0);
        });
    });
});
