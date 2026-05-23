import { WaveSystem } from '../WaveSystem.js';

describe('WaveSystem', () => {
    describe('initialization', () => {
        test('starts in calm state', () => {
            const ws = new WaveSystem({});
            expect(ws.getState()).toBe('calm');
        });

        test('uses default config values', () => {
            const ws = new WaveSystem({});
            expect(ws.getSpawnInterval()).toBe(2000); // baseInterval
        });

        test('uses custom config values', () => {
            const ws = new WaveSystem({
                calmDuration: 10000,
                surgeDuration: 5000,
                peakDuration: 4000,
                baseInterval: 3000,
                surgeInterval: 500
            });
            expect(ws.getSpawnInterval()).toBe(3000);
        });
    });

    describe('state transitions', () => {
        test('calm → surge after calmDuration', () => {
            const ws = new WaveSystem({ calmDuration: 8000 });
            ws.update(8000);
            expect(ws.getState()).toBe('surge');
        });

        test('surge → peak after surgeDuration', () => {
            const ws = new WaveSystem({ calmDuration: 100, surgeDuration: 4000 });
            ws.update(100);  // enter surge
            ws.update(4000); // exit surge
            expect(ws.getState()).toBe('peak');
        });

        test('peak → calm after peakDuration', () => {
            const ws = new WaveSystem({ calmDuration: 100, surgeDuration: 100, peakDuration: 3000 });
            ws.update(100);  // enter surge
            ws.update(100);  // enter peak
            ws.update(3000); // back to calm
            expect(ws.getState()).toBe('calm');
        });

        test('timer resets on state transition', () => {
            const ws = new WaveSystem({ calmDuration: 8000 });
            ws.update(9000); // past calmDuration
            expect(ws.getState()).toBe('surge');
        });
    });

    describe('spawn interval', () => {
        test('returns baseInterval in calm state', () => {
            const ws = new WaveSystem({ baseInterval: 2000, surgeInterval: 400 });
            expect(ws.getSpawnInterval()).toBe(2000);
        });

        test('returns surgeInterval in surge state', () => {
            const ws = new WaveSystem({ calmDuration: 100, baseInterval: 2000, surgeInterval: 400 });
            ws.update(100); // enter surge
            expect(ws.getSpawnInterval()).toBe(400);
        });

        test('returns baseInterval in peak state', () => {
            const ws = new WaveSystem({ calmDuration: 100, surgeDuration: 100, baseInterval: 2000, surgeInterval: 400 });
            ws.update(100);  // enter surge
            ws.update(100);  // enter peak
            expect(ws.getSpawnInterval()).toBe(2000);
        });
    });

    describe('callbacks', () => {
        test('onStateChange called on transition', () => {
            const stateLog = [];
            const ws = new WaveSystem({
                calmDuration: 8000,
                onStateChange: (state) => stateLog.push(state)
            });
            ws.update(8000);
            expect(stateLog).toContain('surge');
        });

        test('onIntervalChange called on state transition', () => {
            const intervalLog = [];
            const ws = new WaveSystem({
                calmDuration: 8000,
                baseInterval: 2000,
                surgeInterval: 400,
                onIntervalChange: (interval) => intervalLog.push(interval)
            });
            ws.update(8000); // calm → surge
            expect(intervalLog[0]).toBe(400); // first call is the new interval
        });
    });

    describe('reset()', () => {
        test('resets state to calm', () => {
            const ws = new WaveSystem({ calmDuration: 100 });
            ws.update(100); // enter surge
            expect(ws.getState()).toBe('surge');
            ws.reset();
            expect(ws.getState()).toBe('calm');
        });

        test('resets timer to 0', () => {
            const ws = new WaveSystem({ calmDuration: 100 });
            ws.update(50);
            ws.reset();
            ws.update(50); // should not transition since timer reset
            expect(ws.getState()).toBe('calm');
        });

        test('accepts new config', () => {
            const ws = new WaveSystem({ calmDuration: 8000 });
            ws.reset({ calmDuration: 10000 });
            ws.update(9000);
            expect(ws.getState()).toBe('calm'); // 9000 < 10000
            ws.update(2000); // now should transition
            expect(ws.getState()).toBe('surge');
        });
    });

    describe('edge cases', () => {
        test('handles zero delta', () => {
            const ws = new WaveSystem({});
            ws.update(0);
            expect(ws.getState()).toBe('calm');
        });

        test('handles very large delta (single transition only)', () => {
            const ws = new WaveSystem({ calmDuration: 100, surgeDuration: 100, peakDuration: 100 });
            ws.update(1000); // large delta, but only one transition per update
            expect(ws.getState()).toBe('surge'); // transitioned to surge, not through full cycle
        });

        test('multiple updates with accumulated time complete cycle', () => {
            const ws = new WaveSystem({ calmDuration: 100, surgeDuration: 100, peakDuration: 100 });
            ws.update(100); // calm → surge
            ws.update(100); // surge → peak
            ws.update(100); // peak → calm
            expect(ws.getState()).toBe('calm');
        });

        test('preserves callback references after reset without config', () => {
            const cb = () => {};
            const ws = new WaveSystem({ onStateChange: cb });
            ws.reset();
            expect(ws.config.onStateChange).toBe(cb);
        });
    });
});