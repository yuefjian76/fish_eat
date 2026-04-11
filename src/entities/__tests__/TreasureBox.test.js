import { jest } from '@jest/globals';
import { TreasureBox } from '../../entities/TreasureBox.js';

describe('TreasureBox', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                graphics: jest.fn(() => ({
                    fillStyle: jest.fn().mockReturnThis(),
                    fillCircle: jest.fn().mockReturnThis(),
                    fillRect: jest.fn().mockReturnThis(),
                    lineStyle: jest.fn().mockReturnThis(),
                    strokeCircle: jest.fn().mockReturnThis(),
                    strokeRect: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setOrigin: jest.fn().mockReturnThis(),
                    setScale: jest.fn().mockReturnThis(),
                    body: {
                        setSize: jest.fn().mockReturnThis(),
                        setOffset: jest.fn().mockReturnThis(),
                        setImmovable: jest.fn().mockReturnThis()
                    }
                })),
                text: jest.fn(() => ({
                    setOrigin: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                }))
            },
            physics: {
                world: { enable: jest.fn() }
            },
            tweens: {
                add: jest.fn()
            },
            treasureBoxes: { add: jest.fn() }
        };
    });

    describe('TYPE enum', () => {
        test('has COIN type', () => {
            expect(TreasureBox.TYPE.COIN).toBe('coin');
        });

        test('has POTION type', () => {
            expect(TreasureBox.TYPE.POTION).toBe('potion');
        });

        test('has SKILL_FRAGMENT type', () => {
            expect(TreasureBox.TYPE.SKILL_FRAGMENT).toBe('skillFragment');
        });

        test('has EXP type', () => {
            expect(TreasureBox.TYPE.EXP).toBe('exp');
        });

        test('has COOLDOWN_REDUCTION type', () => {
            expect(TreasureBox.TYPE.COOLDOWN_REDUCTION).toBe('cooldownReduction');
        });

        test('has INVINCIBILITY type', () => {
            expect(TreasureBox.TYPE.INVINCIBILITY).toBe('invincibility');
        });

        test('has TELEPORT type', () => {
            expect(TreasureBox.TYPE.TELEPORT).toBe('teleport');
        });

        test('has DOUBLE_REWARDS type', () => {
            expect(TreasureBox.TYPE.DOUBLE_REWARDS).toBe('doubleRewards');
        });
    });

    describe('constructor', () => {
        test('creates treasure box at given position', () => {
            const box = new TreasureBox(mockScene, 100, 200, TreasureBox.TYPE.COIN, 50);
            expect(box.x).toBe(100);
            expect(box.y).toBe(200);
        });

        test('stores reward type and amount', () => {
            const box = new TreasureBox(mockScene, 100, 200, TreasureBox.TYPE.EXP, 100);
            expect(box.rewardType).toBe('exp');
            expect(box.rewardAmount).toBe(100);
        });

        test('initializes as not collected', () => {
            const box = new TreasureBox(mockScene, 100, 200, TreasureBox.TYPE.COIN, 50);
            expect(box.isCollected).toBe(false);
        });

        test('enables physics on graphics', () => {
            new TreasureBox(mockScene, 100, 200, TreasureBox.TYPE.COIN, 50);
            expect(mockScene.physics.world.enable).toHaveBeenCalled();
        });
    });

    describe('collect', () => {
        test('marks box as collected', () => {
            const box = new TreasureBox(mockScene, 100, 200, TreasureBox.TYPE.COIN, 50);
            const mockPlayer = { x: 100, y: 200 };
            box.collect(mockPlayer);
            expect(box.isCollected).toBe(true);
        });

        test('stops rise and wander tweens on collect', () => {
            const box = new TreasureBox(mockScene, 100, 200, TreasureBox.TYPE.COIN, 50);
            box.riseTween = { stop: jest.fn() };
            box.wanderTween = { stop: jest.fn() };
            const mockPlayer = { x: 100, y: 200 };
            box.collect(mockPlayer);
            expect(box.riseTween.stop).toHaveBeenCalled();
            expect(box.wanderTween.stop).toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        test('destroys graphics and bubble', () => {
            const mockGraphics = { destroy: jest.fn() };
            const mockGlow = { destroy: jest.fn() };
            const mockBubble = { destroy: jest.fn() };
            const box = new TreasureBox(mockScene, 100, 200, TreasureBox.TYPE.COIN, 50);
            box.graphics = mockGraphics;
            box.glowGraphics = mockGlow;
            box.bubbleGraphics = mockBubble;
            box.destroy();
            expect(mockGraphics.destroy).toHaveBeenCalled();
            expect(mockGlow.destroy).toHaveBeenCalled();
            expect(mockBubble.destroy).toHaveBeenCalled();
        });
    });
});
