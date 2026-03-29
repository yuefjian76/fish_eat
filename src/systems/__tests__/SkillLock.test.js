// src/systems/__tests__/SkillLock.test.js
import { SkillSystem } from '../SkillSystem.js';

describe('SkillLockSystem', () => {
    let skillSystem;
    let mockSkillsData;

    beforeEach(() => {
        mockSkillsData = {
            bite: { key: 'Q', type: 'damage', cooldown: 3, damage: 20, unlockLevel: 1 },
            shield: { key: 'W', type: 'defense', cooldown: 15, unlockLevel: 2 },
            speedUp: { key: 'E', type: 'buff', cooldown: 10, speedMultiplier: 1.2, unlockLevel: 4 },
            heal: { key: 'R', type: 'heal', cooldown: 20, healAmount: 50, unlockLevel: 6 }
        };
        skillSystem = new SkillSystem(mockSkillsData);
    });

    describe('isSkillUnlocked', () => {
        test('level 1 can use bite (unlockLevel 1)', () => {
            expect(skillSystem.isSkillUnlocked('bite', 1)).toBe(true);
        });

        test('level 1 cannot use shield (unlockLevel 2)', () => {
            expect(skillSystem.isSkillUnlocked('shield', 1)).toBe(false);
        });

        test('level 6 can use all skills', () => {
            expect(skillSystem.isSkillUnlocked('heal', 6)).toBe(true);
        });
    });

    describe('useSkill - locked skill', () => {
        test('returns locked error for level 1 player using speedUp', () => {
            // Set a mock player so the lock check can be reached
            skillSystem.player = { x: 0, y: 0 };
            skillSystem.scene = { level: 1 };
            const result = skillSystem.useSkill('E', 1);
            expect(result.success).toBe(false);
            expect(result.reason).toBe('locked');
        });
    });
});
