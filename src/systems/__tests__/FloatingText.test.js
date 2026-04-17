// src/systems/__tests__/FloatingText.test.js
describe('Floating text system', () => {
    test('formatDamage returns integer string', () => {
        expect(formatDamage(10)).toBe('10');
        expect(formatDamage(0)).toBe('0');
        expect(formatDamage(999)).toBe('999');
    });

    test('getFloatingTextColor returns red for player damage', () => {
        expect(getFloatingTextColor('player_damage')).toBe(0xff3333);
    });

    test('getFloatingTextColor returns green for enemy damage', () => {
        expect(getFloatingTextColor('enemy_damage')).toBe(0x00ff44);
    });

    test('getFloatingTextColor returns gold for critical hit', () => {
        expect(getFloatingTextColor('critical')).toBe(0xffd700);
    });

    test('getFloatingTextColor returns blue for heal', () => {
        expect(getFloatingTextColor('heal')).toBe(0x44aaff);
    });

    test('getFloatingTextColor returns white for other types', () => {
        expect(getFloatingTextColor('unknown')).toBe(0xffffff);
    });

    test('floating text tween config has rise and fade', () => {
        const config = createFloatingTextTweenConfig(100, 200, 10, 0xff3333);
        // Should rise upward (negative Y delta)
        expect(config.y).toBeLessThan(200);
        // Duration should be reasonable
        expect(config.duration).toBeGreaterThan(500);
        expect(config.alpha).toBe(0); // Fade to invisible
    });
});

const FLOATING_TEXT_RISE_DISTANCE = 40;
const FLOATING_TEXT_DURATION = 800;

function formatDamage(damage) {
    return Math.round(damage).toString();
}

function getFloatingTextColor(type) {
    switch (type) {
        case 'player_damage': return 0xff3333;
        case 'enemy_damage': return 0x00ff44;
        case 'critical': return 0xffd700;
        case 'heal': return 0x44aaff;
        default: return 0xffffff;
    }
}

function createFloatingTextTweenConfig(x, y, damage, color) {
    return {
        x,
        y: y - FLOATING_TEXT_RISE_DISTANCE,
        alpha: 0,
        duration: FLOATING_TEXT_DURATION,
        color,
        text: formatDamage(damage)
    };
}
