import { DeathSequenceSystem, DEFAULT_DEATH_SEQUENCE } from '../DeathSequenceSystem.js';

const CONFIG = {
    hitStop: { duration: 100 },
    impact: { duration: 400 },
    fadeOut: { duration: 200 },
};

describe('DeathSequenceSystem', () => {
    describe('A. 初始状态', () => {
        it('未开始时 isActive() 为 false，phase 为 idle', () => {
            const sys = new DeathSequenceSystem(CONFIG);
            expect(sys.isActive()).toBe(false);
            expect(sys.getPhase()).toBe('idle');
        });

        it('未开始时 update() 返回 null', () => {
            const sys = new DeathSequenceSystem(CONFIG);
            expect(sys.update(16)).toBeNull();
        });

        it('缺少 config 时使用默认配置', () => {
            const sys = new DeathSequenceSystem();
            expect(sys.getConfig().hitStop.duration).toBe(DEFAULT_DEATH_SEQUENCE.hitStop.duration);
        });

        it('部分 config 与默认值深合并', () => {
            const sys = new DeathSequenceSystem({ impact: { duration: 1234 } });
            expect(sys.getConfig().impact.duration).toBe(1234);
            expect(sys.getConfig().fadeOut.duration).toBe(DEFAULT_DEATH_SEQUENCE.fadeOut.duration);
        });
    });

    describe('B. 阶段推进', () => {
        it('start() 返回 true，第二次返回 false（重入保护）', () => {
            const sys = new DeathSequenceSystem(CONFIG);
            expect(sys.start()).toBe(true);
            expect(sys.start()).toBe(false);
        });

        it('start() 后进入第一个阶段 hitStop', () => {
            const sys = new DeathSequenceSystem(CONFIG);
            sys.start();
            expect(sys.getPhase()).toBe('hitStop');
            expect(sys.isActive()).toBe(true);
        });

        it('按累计时长切换阶段', () => {
            const sys = new DeathSequenceSystem(CONFIG);
            sys.start();

            expect(sys.update(50).phase).toBe('hitStop');
            expect(sys.update(50).phase).toBe('impact'); // 100ms 边界
            expect(sys.update(399).phase).toBe('impact');
            expect(sys.update(1).phase).toBe('fadeOut'); // 500ms 边界
        });

        it('phaseChanged 只在跨阶段的那一帧为 true', () => {
            const sys = new DeathSequenceSystem(CONFIG);
            sys.start();
            expect(sys.update(50).phaseChanged).toBe(false);
            expect(sys.update(50).phaseChanged).toBe(true);
            expect(sys.update(50).phaseChanged).toBe(false);
        });

        it('progress 是 0→1 的整体进度', () => {
            const sys = new DeathSequenceSystem(CONFIG);
            sys.start();
            expect(sys.update(350).progress).toBeCloseTo(0.5, 5);
        });
    });

    describe('C. 结束', () => {
        it('总时长走完后 done 为 true，isActive() 变 false', () => {
            const sys = new DeathSequenceSystem(CONFIG);
            sys.start();
            const result = sys.update(700);
            expect(result.done).toBe(true);
            expect(sys.isActive()).toBe(false);
            expect(sys.getPhase()).toBe('done');
        });

        it('done 只报告一次', () => {
            const sys = new DeathSequenceSystem(CONFIG);
            sys.start();
            expect(sys.update(700).done).toBe(true);
            expect(sys.update(16)).toBeNull();
        });

        it('结束后可以再次 start()', () => {
            const sys = new DeathSequenceSystem(CONFIG);
            sys.start();
            sys.update(700);
            expect(sys.start()).toBe(true);
            expect(sys.getPhase()).toBe('hitStop');
        });

        it('单次超大 delta 不会跳过 done', () => {
            const sys = new DeathSequenceSystem(CONFIG);
            sys.start();
            expect(sys.update(99999).done).toBe(true);
        });
    });

    describe('D. reset', () => {
        it('reset() 回到 idle 并可重新开始', () => {
            const sys = new DeathSequenceSystem(CONFIG);
            sys.start();
            sys.update(200);
            sys.reset();
            expect(sys.isActive()).toBe(false);
            expect(sys.getPhase()).toBe('idle');
            expect(sys.update(16)).toBeNull();
            expect(sys.start()).toBe(true);
        });

        it('getTotalDuration() 等于各阶段之和', () => {
            const sys = new DeathSequenceSystem(CONFIG);
            expect(sys.getTotalDuration()).toBe(700);
        });
    });
});
