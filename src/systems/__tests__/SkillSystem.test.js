import { SkillSystem } from '../SkillSystem.js';

describe('SkillSystem', () => {
    let skillSystem;
    const mockSkillsData = {
        bite: { key: 'Q', name: 'Bite', type: 'damage', cooldown: 0.5, unlockLevel: 1, damage: 10, range: 200 },
        shield: { key: 'W', name: 'Shield', type: 'defense', cooldown: 15, unlockLevel: 2, duration: 5 },
        speedUp: { key: 'E', name: 'Speed Up', type: 'buff', cooldown: 20, unlockLevel: 3, duration: 5, speedMultiplier: 1.5 },
        heal: { key: 'R', name: 'Heal', type: 'heal', cooldown: 30, unlockLevel: 5, healAmount: 20 }
    };

    beforeEach(() => {
        skillSystem = new SkillSystem(mockSkillsData);
    });

    describe('constructor', () => {
        test('initializes cooldowns for all skills', () => {
            expect(skillSystem.cooldowns.bite).toBe(0);
            expect(skillSystem.cooldowns.shield).toBe(0);
        });
    });

    describe('isOnCooldown', () => {
        test('returns false when cooldown is 0', () => {
            expect(skillSystem.isOnCooldown('bite')).toBe(false);
        });

        test('returns true when cooldown is active', () => {
            skillSystem.cooldowns.bite = 5;
            expect(skillSystem.isOnCooldown('bite')).toBe(true);
        });
    });

    describe('isSkillUnlocked', () => {
        test('returns true for unlocked skill at correct level', () => {
            expect(skillSystem.isSkillUnlocked('bite', 1)).toBe(true);
        });

        test('returns false for locked skill at low level', () => {
            expect(skillSystem.isSkillUnlocked('shield', 1)).toBe(false);
        });

        test('returns true for locked skill at high level', () => {
            expect(skillSystem.isSkillUnlocked('shield', 3)).toBe(true);
        });

        test('returns false for unknown skill', () => {
            expect(skillSystem.isSkillUnlocked('unknown', 10)).toBe(false);
        });
    });

    describe('isActive', () => {
        test('returns false when no active effect', () => {
            expect(skillSystem.isActive('shield')).toBe(false);
        });

        test('returns true when effect is active', () => {
            skillSystem.activeEffects.shield = { startTime: Date.now(), duration: 5000 };
            expect(skillSystem.isActive('shield')).toBe(true);
        });
    });

    describe('useSkill', () => {
        beforeEach(() => {
            skillSystem.player = { x: 100, y: 100 };
            skillSystem.scene = { level: 10 };
        });

        test('returns null when no player', () => {
            skillSystem.player = null;
            expect(skillSystem.useSkill('Q')).toBeNull();
        });

        test('returns success:false for locked skill', () => {
            skillSystem.scene.level = 1;
            const result = skillSystem.useSkill('W');
            expect(result.success).toBe(false);
            expect(result.reason).toBe('locked');
        });

        test('returns success:false for on cooldown skill', () => {
            skillSystem.cooldowns.bite = 5;
            const result = skillSystem.useSkill('Q');
            expect(result.success).toBe(false);
            expect(result.reason).toBe('cooldown');
        });

        test('returns success:true for valid skill', () => {
            skillSystem.scene.enemies = [{
                graphics: { x: 150, y: 100, active: true },
                fishData: { size: 20 },
                takeDamage: () => false,
                getExpValue: () => 10
            }];
            skillSystem.scene.growthSystem = { addExperience: () => ({ expGained: 10, leveledUp: false }) };
            skillSystem.scene.luckSystem = {};
            skillSystem.scene.time = { now: 0, addEvent: () => {}, delayedCall: () => {} };
            skillSystem.scene.exp = 0;
            skillSystem.scene.score = 0;
            skillSystem.scene.onLevelUp = () => {};
            skillSystem.scene.scene = { get: () => ({ updateUI: () => {} }) };
            skillSystem.scene.updatePlayerHealthBar = () => {};
            const result = skillSystem.useSkill('Q');
            expect(result.success).toBe(true);
        });

        test('starts cooldown after successful use', () => {
            skillSystem.scene.enemies = [{
                graphics: { x: 150, y: 100, active: true },
                fishData: { size: 20 },
                takeDamage: () => false,
                getExpValue: () => 10
            }];
            skillSystem.scene.growthSystem = { addExperience: () => ({ expGained: 10, leveledUp: false }) };
            skillSystem.scene.luckSystem = {};
            skillSystem.scene.time = { now: 0, addEvent: () => {}, delayedCall: () => {} };
            skillSystem.scene.exp = 0;
            skillSystem.scene.score = 0;
            skillSystem.scene.onLevelUp = () => {};
            skillSystem.scene.scene = { get: () => ({ updateUI: () => {} }) };
            skillSystem.scene.updatePlayerHealthBar = () => {};
            skillSystem.useSkill('Q');
            expect(skillSystem.cooldowns.bite).toBe(0.5);
        });
    });

    describe('getCooldownRemaining', () => {
        test('returns 0 when no cooldown', () => {
            expect(skillSystem.getCooldownRemaining('bite')).toBe(0);
        });
    });

    describe('getCooldownPercent', () => {
        test('returns 0 when ready', () => {
            expect(skillSystem.getCooldownPercent('shield')).toBe(0);
        });
    });
});
