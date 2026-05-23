import { TreasureSystem } from '../TreasureSystem.js';

// Mock treasure box factory
const createMockTreasureBox = (type = 'COIN', amount = 10, isCollected = false) => {
    let collected = isCollected;
    return {
        treasureBoxData: {
            type,
            amount,
            isCollected: collected,
            collect: () => {
                if (collected) return null;
                collected = true;
                return { type, amount };
            }
        },
        x: 100,
        y: 100
    };
};

describe('TreasureSystem', () => {
    describe('initialization', () => {
        test('creates treasure system', () => {
            const ts = new TreasureSystem({});
            expect(ts).toBeDefined();
        });

        test('initializes collected count to 0', () => {
            const ts = new TreasureSystem({});
            expect(ts.getCollectedCount()).toBe(0);
        });
    });

    describe('checkCollect', () => {
        test('collects treasure and returns reward', () => {
            const ts = new TreasureSystem({});
            const box = createMockTreasureBox('COIN', 100);
            const reward = ts.checkCollect({}, box);
            expect(reward).not.toBeNull();
            expect(reward.type).toBe('COIN');
            expect(reward.amount).toBe(100);
        });

        test('increments collected count', () => {
            const ts = new TreasureSystem({});
            const box = createMockTreasureBox('COIN', 100);
            ts.checkCollect({}, box);
            expect(ts.getCollectedCount()).toBe(1);
        });

        test('calls onCollect callback', () => {
            const collected = [];
            const ts = new TreasureSystem({
                onCollect: (box, reward) => collected.push({ box, reward })
            });
            const box = createMockTreasureBox('POTION', 50);
            ts.checkCollect({}, box);
            expect(collected.length).toBe(1);
            expect(collected[0].reward.type).toBe('POTION');
        });

        test('returns null for already collected box', () => {
            const ts = new TreasureSystem({});
            const box = createMockTreasureBox('COIN', 100, true);
            const reward = ts.checkCollect({}, box);
            expect(reward).toBeNull();
        });

        test('does not increment count for already collected box', () => {
            const ts = new TreasureSystem({});
            const box = createMockTreasureBox('COIN', 100, true);
            ts.checkCollect({}, box);
            expect(ts.getCollectedCount()).toBe(0);
        });
    });

    describe('reset', () => {
        test('resets collected count to 0', () => {
            const ts = new TreasureSystem({});
            const box = createMockTreasureBox('COIN', 100);
            ts.checkCollect({}, box);
            expect(ts.getCollectedCount()).toBe(1);
            ts.reset();
            expect(ts.getCollectedCount()).toBe(0);
        });
    });
});