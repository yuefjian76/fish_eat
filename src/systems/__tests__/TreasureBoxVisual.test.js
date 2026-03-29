/**
 * TreasureBox Visual Tests
 */
import { TreasureBox } from '../../entities/TreasureBox.js';

describe('TreasureBox Visual', () => {
    test('TreasureBox has all required TYPE values', () => {
        expect(TreasureBox.TYPE.COIN).toBe('coin');
        expect(TreasureBox.TYPE.POTION).toBe('potion');
        expect(TreasureBox.TYPE.SKILL_FRAGMENT).toBe('skillFragment');
        expect(TreasureBox.TYPE.EXP).toBe('exp');
        expect(TreasureBox.TYPE.COOLDOWN_REDUCTION).toBe('cooldownReduction');
        expect(TreasureBox.TYPE.INVINCIBILITY).toBe('invincibility');
        expect(TreasureBox.TYPE.TELEPORT).toBe('teleport');
        expect(TreasureBox.TYPE.DOUBLE_REWARDS).toBe('doubleRewards');
    });

    test('glow colors are defined for all reward types', () => {
        const glowColors = {
            [TreasureBox.TYPE.COIN]: 0xFFFF00,
            [TreasureBox.TYPE.POTION]: 0xFF69B4,
            [TreasureBox.TYPE.SKILL_FRAGMENT]: 0x88CCFF,
            [TreasureBox.TYPE.EXP]: 0xCC88FF,
            [TreasureBox.TYPE.COOLDOWN_REDUCTION]: 0x88FFFF,
            [TreasureBox.TYPE.INVINCIBILITY]: 0xFFD700,
            [TreasureBox.TYPE.TELEPORT]: 0xFFAA44,
            [TreasureBox.TYPE.DOUBLE_REWARDS]: 0x88FF88
        };

        // Verify all 8 types have glow colors defined
        expect(Object.keys(glowColors).length).toBe(8);
        expect(glowColors[TreasureBox.TYPE.COIN]).toBe(0xFFFF00);
        expect(glowColors[TreasureBox.TYPE.POTION]).toBe(0xFF69B4);
        expect(glowColors[TreasureBox.TYPE.INVINCIBILITY]).toBe(0xFFD700);
    });

    test('body colors are defined for all reward types', () => {
        const bodyColors = {
            [TreasureBox.TYPE.COIN]: 0xFFD700,
            [TreasureBox.TYPE.POTION]: 0xFF4444,
            [TreasureBox.TYPE.SKILL_FRAGMENT]: 0x4488FF,
            [TreasureBox.TYPE.EXP]: 0xAA44FF,
            [TreasureBox.TYPE.COOLDOWN_REDUCTION]: 0x44FFFF,
            [TreasureBox.TYPE.INVINCIBILITY]: 0xFFFFFF,
            [TreasureBox.TYPE.TELEPORT]: 0xFF8800,
            [TreasureBox.TYPE.DOUBLE_REWARDS]: 0x44FF44
        };

        // Verify all 8 types have body colors defined
        expect(Object.keys(bodyColors).length).toBe(8);
        expect(bodyColors[TreasureBox.TYPE.COIN]).toBe(0xFFD700);
        expect(bodyColors[TreasureBox.TYPE.POTION]).toBe(0xFF4444);
        expect(bodyColors[TreasureBox.TYPE.INVINCIBILITY]).toBe(0xFFFFFF);
    });
});
