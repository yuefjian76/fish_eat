import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { Enemy } from '../../entities/Enemy.js';

describe('EnemyAI States', () => {
    describe('STATE enum', () => {
        test('FLEEING state exists', () => {
            expect(Enemy.STATE.FLEEING).toBe('fleeing');
        });

        test('FISHING state exists', () => {
            expect(Enemy.STATE.FISHING).toBe('fishing');
        });

        test('has all required states', () => {
            expect(Enemy.STATE.WANDERING).toBe('wandering');
            expect(Enemy.STATE.CHASING).toBe('chasing');
            expect(Enemy.STATE.ATTACKING).toBe('attacking');
            expect(Enemy.STATE.FLEEING).toBe('fleeing');
            expect(Enemy.STATE.FISHING).toBe('fishing');
        });
    });

    describe('FLEEING behavior', () => {
        test('setState transitions to FLEEING and stores attacker', () => {
            // Create a minimal mock enemy
            const mockLogger = { debug: jest.fn() };
            const enemy = {
                state: Enemy.STATE.WANDERING,
                fishType: 'test_fish',
                fleeTimer: 0,
                fleeDuration: 3000,
                attacker: null,
                fishingTarget: null,
                logger: mockLogger
            };

            // Call the actual setState method
            const setStateFn = Enemy.prototype.setState;
            setStateFn.call(enemy, Enemy.STATE.FLEEING, { x: 100, y: 100 });

            expect(enemy.state).toBe(Enemy.STATE.FLEEING);
            expect(enemy.attacker).toEqual({ x: 100, y: 100 });
            expect(enemy.fleeTimer).toBe(0);
        });

        test('updateFleeing moves away from attacker', () => {
            // Create mock scene
            const mockScene = {
                physics: {
                    moveTo: jest.fn()
                }
            };

            // Create enemy with FLEEING state
            const enemy = {
                scene: mockScene,
                state: Enemy.STATE.FLEEING,
                graphics: { x: 100, y: 100, rotation: 0, active: true },
                attacker: { x: 50, y: 100 },
                fleeTimer: 0,
                fleeDuration: 3000,
                baseSpeed: 100,
                fishType: 'test_fish',
                logger: { debug: jest.fn() },
                setState: jest.fn()
            };

            // Call the actual updateFleeing method
            const updateFleeingFn = Enemy.prototype.updateFleeing;
            updateFleeingFn.call(enemy, 16);

            expect(mockScene.physics.moveTo).toHaveBeenCalled();
        });

        test('updateFleeing returns to WANDERING after 3 seconds', () => {
            // Create mock scene
            const mockScene = {
                physics: {
                    moveTo: jest.fn()
                }
            };

            // Create enemy with FLEEING state
            const enemy = {
                scene: mockScene,
                state: Enemy.STATE.FLEEING,
                graphics: { x: 100, y: 100, rotation: 0, active: true },
                attacker: { x: 50, y: 100 },
                fleeTimer: 0,
                fleeDuration: 3000,
                baseSpeed: 100,
                fishType: 'test_fish',
                logger: { debug: jest.fn() },
                setState: jest.fn()
            };

            // Call updateFleeing with 3000ms (3 seconds)
            const updateFleeingFn = Enemy.prototype.updateFleeing;
            updateFleeingFn.call(enemy, 3000);

            expect(enemy.state).toBe(Enemy.STATE.WANDERING);
        });

        test('updateFleeing handles missing attacker', () => {
            // Create mock scene
            const mockScene = {
                physics: {
                    moveTo: jest.fn()
                }
            };

            // Create enemy with FLEEING state but no attacker
            const enemy = {
                scene: mockScene,
                state: Enemy.STATE.FLEEING,
                graphics: { x: 100, y: 100, rotation: 0, active: true },
                attacker: null,
                fleeTimer: 0,
                fleeDuration: 3000,
                baseSpeed: 100,
                fishType: 'test_fish',
                logger: { debug: jest.fn() },
                setState: jest.fn()
            };

            // Call updateFleeing
            const updateFleeingFn = Enemy.prototype.updateFleeing;
            updateFleeingFn.call(enemy, 16);

            expect(enemy.state).toBe(Enemy.STATE.WANDERING);
        });
    });

    describe('FISHING behavior', () => {
        test('setState transitions to FISHING and clears fishing target', () => {
            const enemy = {
                state: Enemy.STATE.WANDERING,
                fishType: 'test_fish',
                fleeTimer: 0,
                fleeDuration: 3000,
                attacker: null,
                fishingTarget: { x: 150, y: 150 },
                logger: { debug: jest.fn() }
            };

            const setStateFn = Enemy.prototype.setState;
            setStateFn.call(enemy, Enemy.STATE.FISHING);

            expect(enemy.state).toBe(Enemy.STATE.FISHING);
            expect(enemy.fishingTarget).toBeNull();
        });

        test('updateFishing with pre-set target chases and attacks', () => {
            // Create mock target with proper graphics structure
            const targetEnemy = {
                graphics: { x: 150, y: 150, active: true },
                x: 150,
                y: 150,
                active: true,
                fishData: { size: 25 },
                currentHp: 50,
                expValue: 10,
                takeDamage: jest.fn().mockReturnValue(false),
                destroy: jest.fn()
            };

            const mockScene = {
                fishes: {
                    getChildren: jest.fn().mockReturnValue([targetEnemy])
                },
                physics: {
                    moveTo: jest.fn()
                },
                time: {
                    now: 2000 // Time enough for cooldown (2000 - 0 >= 1500)
                }
            };

            // Create enemy with FISHING state and pre-set target (so it skips search)
            const enemy = {
                scene: mockScene,
                state: Enemy.STATE.FISHING,
                graphics: { x: 100, y: 100, rotation: 0, active: true },
                fishingTarget: targetEnemy, // Pre-set so search is skipped
                fishConfig: { size: 30 },
                attackRange: 50,
                attackCooldown: 1500,
                lastAttackTime: 0,
                chaseSpeedMultiplier: 1.5,
                baseSpeed: 100,
                expValue: 10,
                fishType: 'test_fish',
                logger: { debug: jest.fn() },
                setState: jest.fn()
            };

            // Mock Distance.Between to return small distance (within attack range)
            Phaser.Math.Distance.Between.mockReturnValue(10);

            // Call updateFishing
            const updateFishingFn = Enemy.prototype.updateFishing;
            updateFishingFn.call(enemy, 16);

            // Since distance=10 <= attackRange=50, should attack (not moveTo)
            // cooldown: 2000 - 0 >= 1500 -> true
            expect(targetEnemy.takeDamage).toHaveBeenCalled();
        });

        test('updateFishing gains exp when killing target', () => {
            // Create mock target with proper graphics structure
            const targetEnemy = {
                graphics: { x: 105, y: 105, active: true },
                x: 105,
                y: 105,
                active: true,
                fishData: { size: 25 },
                currentHp: 1,
                maxHp: 50,
                expValue: 20,
                takeDamage: jest.fn().mockReturnValue(true), // Target dies
                destroy: jest.fn()
            };

            const mockScene = {
                fishes: {
                    getChildren: jest.fn().mockReturnValue([targetEnemy])
                },
                physics: {
                    moveTo: jest.fn()
                },
                time: {
                    now: 2000 // Time enough for cooldown (2000 - 0 >= 1500)
                }
            };

            // Create enemy with FISHING state and pre-set target
            const enemy = {
                scene: mockScene,
                state: Enemy.STATE.FISHING,
                graphics: { x: 100, y: 100, rotation: 0, active: true },
                fishingTarget: targetEnemy,
                fishConfig: { size: 30 },
                attackRange: 50,
                attackCooldown: 1500,
                lastAttackTime: 0,
                chaseSpeedMultiplier: 1.5,
                baseSpeed: 100,
                expValue: 10,
                fishType: 'test_fish',
                logger: { debug: jest.fn() },
                setState: jest.fn()
            };

            // Mock Distance.Between to return small distance (within attack range)
            Phaser.Math.Distance.Between.mockReturnValue(10);

            // Call updateFishing
            const updateFishingFn = Enemy.prototype.updateFishing;
            updateFishingFn.call(enemy, 16);

            // Should have gained 50% of target's exp (20 * 0.5 = 10)
            expect(enemy.expValue).toBe(20); // 10 + 10 = 20
            expect(enemy.state).toBe(Enemy.STATE.WANDERING);
        });

        test('updateFishing returns to WANDERING when no targets available', () => {
            const mockScene = {
                fishes: {
                    getChildren: jest.fn().mockReturnValue([]) // No enemies
                },
                physics: {
                    moveTo: jest.fn()
                }
            };

            // Create enemy with FISHING state and no valid target
            const enemy = {
                scene: mockScene,
                state: Enemy.STATE.FISHING,
                graphics: { x: 100, y: 100, rotation: 0, active: true },
                fishingTarget: null,
                fishConfig: { size: 30 },
                fishType: 'test_fish',
                logger: { debug: jest.fn() },
                setState: jest.fn()
            };

            // Call updateFishing
            const updateFishingFn = Enemy.prototype.updateFishing;
            updateFishingFn.call(enemy, 16);

            expect(enemy.state).toBe(Enemy.STATE.WANDERING);
        });
    });

    describe('takeDamage flee trigger', () => {
        test('takeDamage checks for flee when HP < 30%', () => {
            const enemy = {
                hp: 25,
                maxHp: 100,
                updateHealthBar: jest.fn(),
                logger: { debug: jest.fn() },
                setState: jest.fn()
            };

            // Mock Math.random to return 0.3 (below 0.5 threshold)
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(0.3);

            // Call takeDamage
            const takeDamageFn = Enemy.prototype.takeDamage;
            takeDamageFn.call(enemy, 1, { x: 50, y: 100 });

            // Should have called setState with FLEEING
            expect(enemy.setState).toHaveBeenCalledWith(Enemy.STATE.FLEEING, { x: 50, y: 100 });

            Math.random = originalRandom;
        });

        test('takeDamage does not flee when HP >= 30%', () => {
            const enemy = {
                hp: 35,
                maxHp: 100,
                updateHealthBar: jest.fn(),
                logger: { debug: jest.fn() },
                setState: jest.fn()
            };

            // Mock Math.random (shouldn't matter since HP >= 30%)
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(0.3);

            // Call takeDamage
            const takeDamageFn = Enemy.prototype.takeDamage;
            takeDamageFn.call(enemy, 1, { x: 50, y: 100 });

            // Should NOT have called setState
            expect(enemy.setState).not.toHaveBeenCalled();

            Math.random = originalRandom;
        });

        test('takeDamage does not flee when random > 0.5', () => {
            const enemy = {
                hp: 25,
                maxHp: 100,
                updateHealthBar: jest.fn(),
                logger: { debug: jest.fn() },
                setState: jest.fn()
            };

            // Mock Math.random to return 0.6 (above 0.5 threshold)
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(0.6);

            // Call takeDamage
            const takeDamageFn = Enemy.prototype.takeDamage;
            takeDamageFn.call(enemy, 1, { x: 50, y: 100 });

            // Should NOT have called setState
            expect(enemy.setState).not.toHaveBeenCalled();

            Math.random = originalRandom;
        });
    });
});

describe('updateHealthBar', () => {
    test('updateHealthBar creates health bar graphics', () => {
        const mockGraphics = {
            clear: jest.fn().mockReturnThis(),
            fillStyle: jest.fn().mockReturnThis(),
            fillRect: jest.fn().mockReturnThis(),
            lineStyle: jest.fn().mockReturnThis(),
            strokeRect: jest.fn().mockReturnThis()
        };
        const enemy = {
            healthBar: mockGraphics,
            hp: 75,
            maxHp: 100,
            healthBarWidth: 60,
            healthBarHeight: 4,
            fishConfig: { size: 30 }
        };

        const updateHealthBarFn = Enemy.prototype.updateHealthBar;
        updateHealthBarFn.call(enemy);

        expect(mockGraphics.clear).toHaveBeenCalled();
        expect(mockGraphics.fillStyle).toHaveBeenCalled();
        expect(mockGraphics.fillRect).toHaveBeenCalled();
    });

    test('health bar color changes based on HP percentage', () => {
        const mockGraphics = {
            clear: jest.fn().mockReturnThis(),
            fillStyle: jest.fn().mockReturnThis(),
            fillRect: jest.fn().mockReturnThis(),
            lineStyle: jest.fn().mockReturnThis(),
            strokeRect: jest.fn().mockReturnThis()
        };
        const enemy = {
            healthBar: mockGraphics,
            hp: 20, // 20% HP - should be red
            maxHp: 100,
            healthBarWidth: 60,
            healthBarHeight: 4,
            fishConfig: { size: 30 }
        };

        const updateHealthBarFn = Enemy.prototype.updateHealthBar;
        updateHealthBarFn.call(enemy);

        // Second fillStyle call should be for health (0xff0000 for red when HP < 25%)
        const fillStyleCalls = mockGraphics.fillStyle.mock.calls;
        expect(fillStyleCalls[1][0]).toBe(0xff0000);
    });
});

describe('isPlayerInVision', () => {
    test('returns true when player within vision range', () => {
        const enemy = {
            graphics: { x: 100, y: 100 },
            visionRange: 200
        };
        const player = { x: 150, y: 100 }; // Distance = 50 < 200

        Phaser.Math.Distance.Between.mockReturnValue(50);

        const isPlayerInVisionFn = Enemy.prototype.isPlayerInVision;
        expect(isPlayerInVisionFn.call(enemy, player)).toBe(true);
    });

    test('returns false when player outside vision range', () => {
        const enemy = {
            graphics: { x: 100, y: 100 },
            visionRange: 200
        };
        const player = { x: 400, y: 100 }; // Distance = 300 > 200

        Phaser.Math.Distance.Between.mockReturnValue(300);

        const isPlayerInVisionFn = Enemy.prototype.isPlayerInVision;
        expect(isPlayerInVisionFn.call(enemy, player)).toBe(false);
    });

    test('returns false when player is null', () => {
        const enemy = { graphics: { x: 100, y: 100 }, visionRange: 200 };

        const isPlayerInVisionFn = Enemy.prototype.isPlayerInVision;
        expect(isPlayerInVisionFn.call(enemy, null)).toBe(false);
    });
});

describe('isPlayerInAttackRange', () => {
    test('returns true when player within attack range', () => {
        const enemy = {
            graphics: { x: 100, y: 100 },
            attackRange: 50
        };
        const player = { x: 130, y: 100 }; // Distance = 30 < 50

        Phaser.Math.Distance.Between.mockReturnValue(30);

        const isPlayerInAttackRangeFn = Enemy.prototype.isPlayerInAttackRange;
        expect(isPlayerInAttackRangeFn.call(enemy, player)).toBe(true);
    });

    test('returns false when player outside attack range', () => {
        const enemy = {
            graphics: { x: 100, y: 100 },
            attackRange: 50
        };
        const player = { x: 200, y: 100 }; // Distance = 100 > 50

        Phaser.Math.Distance.Between.mockReturnValue(100);

        const isPlayerInAttackRangeFn = Enemy.prototype.isPlayerInAttackRange;
        expect(isPlayerInAttackRangeFn.call(enemy, player)).toBe(false);
    });
});

describe('chasePlayer', () => {
    test('chasePlayer calls physics.moveTo', () => {
        const mockScene = {
            physics: { moveTo: jest.fn() }
        };
        const enemy = {
            scene: mockScene,
            graphics: { x: 100, y: 100, rotation: 0 },
            baseSpeed: 100,
            chaseSpeedMultiplier: 1.5
        };
        const player = { x: 200, y: 150 };

        const chasePlayerFn = Enemy.prototype.chasePlayer;
        chasePlayerFn.call(enemy, player);

        expect(mockScene.physics.moveTo).toHaveBeenCalled();
    });
});

describe('attackPlayer', () => {
    test('attackPlayer returns damage when off cooldown', () => {
        const enemy = {
            scene: { time: { now: 3000 } },
            lastAttackTime: 0,
            attackCooldown: 1500,
            state: Enemy.STATE.CHASING,
            fishConfig: { size: 40 }
        };

        const attackPlayerFn = Enemy.prototype.attackPlayer;
        const damage = attackPlayerFn.call(enemy, {});

        expect(damage).toBe(10); // 40 / 4 = 10
        expect(enemy.lastAttackTime).toBe(3000);
    });

    test('attackPlayer returns 0 when on cooldown', () => {
        const enemy = {
            scene: { time: { now: 1000 } },
            lastAttackTime: 500,
            attackCooldown: 1500,
            state: Enemy.STATE.ATTACKING,
            fishConfig: { size: 40 }
        };

        const attackPlayerFn = Enemy.prototype.attackPlayer;
        const damage = attackPlayerFn.call(enemy, {});

        expect(damage).toBe(0);
    });
});

describe('getExpValue', () => {
    test('returns expValue', () => {
        const enemy = { expValue: 25 };

        const getExpValueFn = Enemy.prototype.getExpValue;
        expect(getExpValueFn.call(enemy)).toBe(25);
    });
});

describe('destroy', () => {
    test('destroy calls graphics.destroy and healthBar.destroy', () => {
        const mockGraphics = { destroy: jest.fn() };
        const mockHealthBar = { destroy: jest.fn() };
        const enemy = {
            graphics: mockGraphics,
            healthBar: mockHealthBar
        };

        const destroyFn = Enemy.prototype.destroy;
        destroyFn.call(enemy);

        expect(mockGraphics.destroy).toHaveBeenCalled();
        expect(mockHealthBar.destroy).toHaveBeenCalled();
    });
});
