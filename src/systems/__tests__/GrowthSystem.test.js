import { GrowthSystem } from '../GrowthSystem.js';

describe('GrowthSystem', () => {
    let growthSystem;
    const mockLevelsData = {
        experienceTable: [0, 100, 250, 500, 1000],
        skillUnlocks: { bite: 1, shield: 2, speedUp: 3, heal: 5 },
        combo: { timeWindow: 5, bonusMultiplier: 0.1 }
    };

    beforeEach(() => {
        growthSystem = new GrowthSystem(mockLevelsData);
    });

    describe('constructor', () => {
        test('initializes with level 1', () => {
            expect(growthSystem.getLevel()).toBe(1);
        });

        test('initializes with 0 exp', () => {
            expect(growthSystem.getExp()).toBe(0);
        });

        test('initializes with 0 combo', () => {
            expect(growthSystem.getComboCount()).toBe(0);
        });

        test('unlocks level 1 skills', () => {
            expect(growthSystem.isSkillUnlocked('bite')).toBe(true);
        });
    });

    describe('getExpForLevel', () => {
        test('returns exp for level 1', () => {
            expect(growthSystem.getExpForLevel(1)).toBe(0);
        });

        test('returns exp for level 2', () => {
            expect(growthSystem.getExpForLevel(2)).toBe(100);
        });

        test('returns last exp for out of bounds level', () => {
            expect(growthSystem.getExpForLevel(100)).toBe(1000);
        });
    });

    describe('getMaxLevel', () => {
        test('returns experience table length', () => {
            expect(growthSystem.getMaxLevel()).toBe(5);
        });
    });

    describe('addExperience', () => {
        test('adds base exp', () => {
            growthSystem.addExperience(50, 1000, null);
            expect(growthSystem.getExp()).toBe(50);
        });

        test('does not trigger combo on first kill', () => {
            const result = growthSystem.addExperience(50, 1000, null);
            expect(result.comboCount).toBe(0);
        });

        test('increases combo on rapid kills', () => {
            growthSystem.addExperience(50, 1000, null);
            const result = growthSystem.addExperience(50, 2000, null);
            expect(result.comboCount).toBe(1);
        });

        test('resets combo if time window exceeded', () => {
            growthSystem.addExperience(50, 1000, null);
            growthSystem.addExperience(50, 7000, null);
            const result = growthSystem.addExperience(50, 13000, null);
            expect(result.comboCount).toBe(0);
        });

        test('returns combo multiplier', () => {
            growthSystem.addExperience(50, 1000, null);
            const result = growthSystem.addExperience(50, 2000, null);
            expect(result.comboMultiplier).toBeCloseTo(1.1);
        });
    });

    describe('checkLevelUp', () => {
        test('returns false when not enough exp', () => {
            growthSystem.addExperience(50, 1000, null);
            expect(growthSystem.checkLevelUp()).toBe(false);
        });

        test('levels up when enough exp', () => {
            growthSystem.currentExp = 100;
            growthSystem.checkLevelUp();
            expect(growthSystem.getLevel()).toBe(2);
        });

        test('returns true when leveling up', () => {
            growthSystem.currentExp = 100;
            expect(growthSystem.checkLevelUp()).toBe(true);
        });
    });

    describe('isSkillUnlocked', () => {
        test('returns true for unlocked skill', () => {
            expect(growthSystem.isSkillUnlocked('bite')).toBe(true);
        });

        test('returns false for locked skill', () => {
            expect(growthSystem.isSkillUnlocked('heal')).toBe(false);
        });
    });

    describe('getUnlockedSkills', () => {
        test('returns array of unlocked skills', () => {
            const skills = growthSystem.getUnlockedSkills();
            expect(skills).toContain('bite');
            expect(skills).not.toContain('heal');
        });
    });

    describe('getLevelProgress', () => {
        test('returns 0 at start of level', () => {
            expect(growthSystem.getLevelProgress()).toBe(0);
        });

        test('returns progress between 0 and 1', () => {
            growthSystem.currentExp = 50;
            expect(growthSystem.getLevelProgress()).toBe(0.5);
        });
    });

    describe('getExpToNextLevel', () => {
        test('returns exp needed for next level', () => {
            growthSystem.currentExp = 50;
            expect(growthSystem.getExpToNextLevel()).toBe(50);
        });
    });

    describe('reset', () => {
        test('resets all values', () => {
            growthSystem.currentExp = 500;
            growthSystem.currentLevel = 3;
            growthSystem.reset();
            expect(growthSystem.getExp()).toBe(0);
            expect(growthSystem.getLevel()).toBe(1);
        });
    });
});