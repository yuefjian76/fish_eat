// HUD.test.js - Tests for progress bar HUD calculations

describe('HUD progress bar calculations', () => {

    describe('HP bar fill ratio', () => {
        test('full HP gives ratio 1.0', () => {
            expect(hpRatio(100, 100)).toBe(1.0);
        });

        test('half HP gives ratio 0.5', () => {
            expect(hpRatio(50, 100)).toBeCloseTo(0.5, 5);
        });

        test('0 HP gives ratio 0', () => {
            expect(hpRatio(0, 100)).toBe(0);
        });

        test('ratio never exceeds 1.0', () => {
            expect(hpRatio(150, 100)).toBe(1.0);
        });

        test('ratio never goes below 0', () => {
            expect(hpRatio(-10, 100)).toBe(0);
        });
    });

    describe('EXP bar fill ratio', () => {
        test('0 exp gives ratio 0', () => {
            expect(expRatio(0, 100)).toBe(0);
        });

        test('full exp gives ratio 1.0', () => {
            expect(expRatio(100, 100)).toBe(1.0);
        });

        test('partial exp correct', () => {
            expect(expRatio(30, 100)).toBeCloseTo(0.3, 5);
        });

        test('handles 0 maxExp gracefully', () => {
            expect(expRatio(50, 0)).toBe(1.0); // fully filled when no target
        });
    });

    describe('HP bar color', () => {
        test('green when HP > 60%', () => {
            expect(hpColor(0.7)).toBe(0x00dd44); // green
        });

        test('yellow when HP 30-60%', () => {
            expect(hpColor(0.45)).toBe(0xffcc00); // yellow
        });

        test('red when HP < 30%', () => {
            expect(hpColor(0.2)).toBe(0xff2222); // red
        });

        test('boundary 60% is green', () => {
            expect(hpColor(0.6)).toBe(0x00dd44);
        });

        test('boundary 30% is yellow', () => {
            expect(hpColor(0.3)).toBe(0xffcc00);
        });
    });

    describe('low HP danger threshold', () => {
        test('is danger when HP < 30%', () => {
            expect(isDanger(0.29)).toBe(true);
        });

        test('is not danger when HP >= 30%', () => {
            expect(isDanger(0.30)).toBe(false);
        });

        test('is not danger at full HP', () => {
            expect(isDanger(1.0)).toBe(false);
        });
    });

    describe('vignette intensity', () => {
        test('no vignette above 30% HP', () => {
            expect(vignetteAlpha(0.5)).toBe(0);
        });

        test('max vignette at 0% HP', () => {
            expect(vignetteAlpha(0)).toBeCloseTo(0.8, 1);
        });

        test('half vignette at 15% HP (midpoint of 0-30%)', () => {
            const alpha = vignetteAlpha(0.15);
            expect(alpha).toBeGreaterThan(0);
            expect(alpha).toBeLessThan(0.8);
        });

        test('vignette intensity increases as HP decreases', () => {
            expect(vignetteAlpha(0.1)).toBeGreaterThan(vignetteAlpha(0.2));
        });
    });
});

// Pure calculation functions (will be used in UIScene)
function hpRatio(hp, maxHp) {
    if (maxHp <= 0) return 1.0;
    return Math.max(0, Math.min(1, hp / maxHp));
}

function expRatio(exp, maxExp) {
    if (maxExp <= 0) return 1.0;
    return Math.max(0, Math.min(1, exp / maxExp));
}

function hpColor(ratio) {
    if (ratio >= 0.6) return 0x00dd44;  // green
    if (ratio >= 0.3) return 0xffcc00;  // yellow
    return 0xff2222;                     // red
}

function isDanger(ratio) {
    return ratio < 0.3;
}

function vignetteAlpha(hpRatio) {
    const DANGER_THRESHOLD = 0.3;
    if (hpRatio >= DANGER_THRESHOLD) return 0;
    // Scale 0→0.8 as hp goes from 30%→0%
    return 0.8 * (1 - hpRatio / DANGER_THRESHOLD);
}
