import { jest } from '@jest/globals';
import { DriftBottleSystem } from '../DriftBottleSystem.js';
import { LuckSystem } from '../LuckSystem.js';

describe('DriftBottleSystem', () => {
    let driftBottleSystem;
    let externalLuck;
    const mockDriftBottleData = {
        effects: [
            { id: 'full_health', name: 'Full Health', type: 'instant', good: true, weight: 10 },
            { id: 'double_coins', name: '2x Coins', type: 'buff', good: true, weight: 5, duration: 30000 },
            { id: 'speed_down', name: 'Slow', type: 'debuff', good: false, weight: 3, duration: 10000 }
        ],
        luckInfluence: {
            baseGoodChance: 70,
            goodBonusPerLuck: 2,
            badReductionPerLuck: 1
        }
    };

    beforeEach(() => {
        driftBottleSystem = new DriftBottleSystem(mockDriftBottleData);
        externalLuck = new LuckSystem(10);
    });

    describe('constructor', () => {
        test('initializes with luck system', () => {
            expect(driftBottleSystem.luckSystem instanceof LuckSystem).toBe(true);
        });

        test('initializes with double coins inactive', () => {
            expect(driftBottleSystem.isDoubleCoinsActive()).toBe(false);
        });

        test('initializes with cooldown accel inactive', () => {
            expect(driftBottleSystem.isCooldownAccelActive()).toBe(false);
        });
    });

    describe('setLuckSystem', () => {
        test('sets external luck system', () => {
            driftBottleSystem.setLuckSystem(externalLuck);
            expect(driftBottleSystem.luckSystem).toBe(externalLuck);
        });
    });

    describe('isDoubleCoinsActive', () => {
        test('returns false initially', () => {
            expect(driftBottleSystem.isDoubleCoinsActive()).toBe(false);
        });
    });

    describe('isCooldownAccelActive', () => {
        test('returns false initially', () => {
            expect(driftBottleSystem.isCooldownAccelActive()).toBe(false);
        });
    });

    describe('getCooldownMultiplier', () => {
        test('returns 1 when not active', () => {
            expect(driftBottleSystem.getCooldownMultiplier()).toBe(1);
        });

        test('returns 0.5 when active', () => {
            driftBottleSystem.cooldownAccelActive = true;
            expect(driftBottleSystem.getCooldownMultiplier()).toBe(0.5);
        });
    });

    describe('reset', () => {
        test('resets luck system', () => {
            driftBottleSystem.luckSystem.baseLuck = 0;
            driftBottleSystem.luckSystem.luck = 20;
            driftBottleSystem.reset();
            expect(driftBottleSystem.luckSystem.getLuck()).toBe(0);
        });

        test('clears active effects', () => {
            driftBottleSystem.doubleCoinsActive = true;
            driftBottleSystem.reset();
            expect(driftBottleSystem.doubleCoinsActive).toBe(false);
        });
    });

    describe('selectEffect', () => {
        test('selects from good effects when luck is high', () => {
            driftBottleSystem.luckSystem.setLuck(20);
            // Mock Math.random to control selection - 50 gives good roll (below 95% goodChance)
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(0.5);
            const effect = driftBottleSystem.selectEffect();
            Math.random = originalRandom;
            expect(effect.good).toBe(true);
        });

        test('selects from bad effects when luck is very low', () => {
            driftBottleSystem.luckSystem.setLuck(-30);
            // Mock Math.random to control selection - 90 gives bad roll (above 40% goodChance)
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(0.9);
            const effect = driftBottleSystem.selectEffect();
            Math.random = originalRandom;
            expect(effect.good).toBe(false);
        });
    });

    describe('setScene', () => {
        test('sets scene reference', () => {
            const mockScene = { level: 5 };
            driftBottleSystem.setScene(mockScene);
            expect(driftBottleSystem.scene).toBe(mockScene);
        });
    });

    describe('trigger', () => {
        test('triggers an effect and returns result', () => {
            const mockScene = {
                player: { x: 100, y: 100 },
                time: { now: 1000, delayedCall: () => {} },
                tweens: { add: () => {} },
                add: { text: () => ({ setOrigin: () => {}, setDepth: () => {} }) },
                score: 0,
                hp: 50,
                maxHp: 100,
                scene: { get: () => ({ updateUI: () => {} }) },
                growthSystem: { getExpForLevel: () => 100 }
            };
            driftBottleSystem.setScene(mockScene);
            driftBottleSystem.luckSystem.setLuck(20);

            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(0.5);
            const result = driftBottleSystem.trigger();
            Math.random = originalRandom;

            expect(result.success).toBe(true);
            expect(result.effect).toBeDefined();
        });
    });

    describe('applyInstantEffect', () => {
        test('full_health restores hp', () => {
            const mockScene = {
                player: { x: 100, y: 100 },
                hp: 50,
                maxHp: 100,
                score: 0,
                tweens: { add: () => {} },
                add: { text: () => ({ setOrigin: () => {}, setDepth: () => {} }) },
                scene: { get: () => ({ updateUI: () => {} }) },
                growthSystem: { getExpForLevel: () => 100 }
            };
            driftBottleSystem.setScene(mockScene);
            driftBottleSystem.applyInstantEffect({ id: 'full_health', name: 'Full Health' });
            expect(mockScene.hp).toBe(100);
        });

        test('coins_50 adds score', () => {
            const mockScene = {
                player: { x: 100, y: 100 },
                hp: 100,
                score: 0,
                tweens: { add: () => {} },
                add: { text: () => ({ setOrigin: () => {}, setDepth: () => {} }) },
                scene: { get: () => ({ updateUI: () => {} }) },
                growthSystem: { getExpForLevel: () => 100 }
            };
            driftBottleSystem.setScene(mockScene);
            driftBottleSystem.applyInstantEffect({ id: 'coins_50', name: '50 Coins' });
            expect(mockScene.score).toBe(50);
        });

        test('coins_minus_30 reduces score', () => {
            const mockScene = {
                player: { x: 100, y: 100 },
                hp: 100,
                score: 100,
                tweens: { add: () => {} },
                add: { text: () => ({ setOrigin: () => {}, setDepth: () => {} }) },
                scene: { get: () => ({ updateUI: () => {} }) },
                growthSystem: { getExpForLevel: () => 100 }
            };
            driftBottleSystem.setScene(mockScene);
            driftBottleSystem.applyInstantEffect({ id: 'coins_minus_30', name: 'Coins -30' });
            expect(mockScene.score).toBe(70);
        });

        test('does nothing when no scene', () => {
            driftBottleSystem.scene = null;
            driftBottleSystem.applyInstantEffect({ id: 'full_health' });
            // Should not throw
        });
    });

    describe('applyBuffEffect', () => {
        test('double_coins activates buff', () => {
            const mockScene = {
                player: { x: 100, y: 100 },
                time: { now: 1000, delayedCall: () => {} },
                tweens: { add: () => {} },
                add: { text: () => ({ setOrigin: () => {}, setDepth: () => {} }) }
            };
            driftBottleSystem.setScene(mockScene);
            driftBottleSystem.applyBuffEffect({ id: 'double_coins', name: '2x Coins', duration: 30000 });
            expect(driftBottleSystem.isDoubleCoinsActive()).toBe(true);
        });

        test('cooldown_accel activates buff', () => {
            const mockScene = {
                player: { x: 100, y: 100 },
                time: { now: 1000, delayedCall: () => {} },
                tweens: { add: () => {} },
                add: { text: () => ({ setOrigin: () => {}, setDepth: () => {} }) }
            };
            driftBottleSystem.setScene(mockScene);
            driftBottleSystem.applyBuffEffect({ id: 'cooldown_accel', name: 'CD Accel', duration: 15000 });
            expect(driftBottleSystem.isCooldownAccelActive()).toBe(true);
        });
    });

    describe('applyDebuffEffect', () => {
        test('speed_down reduces speed', () => {
            const mockPlayer = {
                x: 100, y: 100,
                setTint: () => {},
                clearTint: () => {}
            };
            const mockScene = {
                player: mockPlayer,
                speed: 100,
                time: { now: 1000, delayedCall: () => {} },
                tweens: { add: () => {} },
                add: { text: () => ({ setOrigin: () => {}, setDepth: () => {} }) }
            };
            driftBottleSystem.setScene(mockScene);
            driftBottleSystem.applyDebuffEffect({ id: 'speed_down', name: 'Slow', duration: 10000 });
            expect(mockScene.speed).toBe(70);
        });
    });

    describe('applyPermanentEffect', () => {
        test('luck_up increases luck', () => {
            const mockScene = {
                player: { x: 100, y: 100 },
                tweens: { add: () => {} },
                add: { text: () => ({ setOrigin: () => {}, setDepth: () => {} }) }
            };
            driftBottleSystem.setScene(mockScene);
            const initialLuck = driftBottleSystem.luckSystem.getLuck();
            driftBottleSystem.applyPermanentEffect({ id: 'luck_up', name: 'Luck Up' });
            expect(driftBottleSystem.luckSystem.getLuck()).toBe(initialLuck + 1);
        });

        test('luck_down decreases luck', () => {
            const mockScene = {
                player: { x: 100, y: 100 },
                tweens: { add: () => {} },
                add: { text: () => ({ setOrigin: () => {}, setDepth: () => {} }) }
            };
            driftBottleSystem.setScene(mockScene);
            driftBottleSystem.luckSystem.setLuck(5);
            driftBottleSystem.applyPermanentEffect({ id: 'luck_down', name: 'Luck Down' });
            expect(driftBottleSystem.luckSystem.getLuck()).toBe(4);
        });
    });

    describe('showEffectText', () => {
        test('creates floating text', () => {
            const mockScene = {
                player: { x: 100, y: 100 },
                add: {
                    text: () => ({
                        setOrigin: () => ({ setDepth: () => {} }),
                        setDepth: () => {}
                    })
                },
                tweens: { add: () => {} }
            };
            driftBottleSystem.setScene(mockScene);
            driftBottleSystem.showEffectText(mockScene.player, 'Test Effect', '#00ff00');
            // Should not throw
        });

        test('does nothing when no scene', () => {
            driftBottleSystem.scene = null;
            driftBottleSystem.showEffectText(null, 'Test');
            // Should not throw
        });
    });

    describe('updateUI', () => {
        test('calls UI scene update', () => {
            const mockUIScene = { updateUI: jest.fn() };
            const mockScene = {
                score: 100,
                exp: 50,
                level: 3,
                hp: 80,
                maxHp: 100,
                growthSystem: { getExpForLevel: () => 200 },
                scene: { get: () => mockUIScene }
            };
            driftBottleSystem.setScene(mockScene);
            driftBottleSystem.updateUI();
            expect(mockUIScene.updateUI).toHaveBeenCalled();
        });

        test('does nothing when no scene', () => {
            driftBottleSystem.scene = null;
            driftBottleSystem.updateUI();
            // Should not throw
        });
    });
});