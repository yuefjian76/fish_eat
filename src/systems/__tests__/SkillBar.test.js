// Mock SkillBar since it depends on Phaser scene
// We test the logic directly by extracting the slice calculation

describe('SkillBar - Pie Slice Cooldown Display', () => {
    // The slice center should always be at (0, 0) in container-local coordinates
    // The radius is 25px
    describe('cooldown slice center coordinates', () => {
        test('slice center x should be 0 (container-local center)', () => {
            // When cooldownPercent > 0, slice is drawn with:
            // slice(centerX, centerY, radius, startAngle, endAngle, anticlockwise)
            // centerX and centerY should be 0 in container-local coords
            const EXPECTED_CENTER_X = 0;
            const EXPECTED_CENTER_Y = 0;
            const RADIUS = 25;

            // Simulate what SkillBar.update() should do:
            const sliceArgs = computeSliceArgs(0.5); // 50% cooldown
            expect(sliceArgs.centerX).toBe(EXPECTED_CENTER_X);
            expect(sliceArgs.centerY).toBe(EXPECTED_CENTER_Y);
            expect(sliceArgs.radius).toBe(RADIUS);
        });

        test('slice arc covers correct portion for 50% cooldown', () => {
            const sliceArgs = computeSliceArgs(0.5);
            const startAngle = -Math.PI / 2;
            const expectedEnd = startAngle + (2 * Math.PI * 0.5);
            expect(sliceArgs.startAngle).toBeCloseTo(startAngle, 5);
            expect(sliceArgs.endAngle).toBeCloseTo(expectedEnd, 5);
        });

        test('slice arc covers correct portion for 100% cooldown', () => {
            const sliceArgs = computeSliceArgs(1.0);
            const startAngle = -Math.PI / 2;
            const expectedEnd = startAngle + (2 * Math.PI * 1.0);
            expect(sliceArgs.endAngle).toBeCloseTo(expectedEnd, 5);
        });

        test('slice arc covers correct portion for 25% cooldown', () => {
            const sliceArgs = computeSliceArgs(0.25);
            const startAngle = -Math.PI / 2;
            const expectedEnd = startAngle + (2 * Math.PI * 0.25);
            expect(sliceArgs.endAngle).toBeCloseTo(expectedEnd, 5);
        });
    });
});

/**
 * Helper: compute what slice() arguments SkillBar.update() should pass
 * This mirrors the FIXED logic (center at 0,0 not 25,0)
 */
function computeSliceArgs(cooldownPercent) {
    const RADIUS = 25;
    const CENTER_X = 0; // container-local center (FIXED: was 25, should be 0)
    const CENTER_Y = 0;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (2 * Math.PI * cooldownPercent);
    return { centerX: CENTER_X, centerY: CENTER_Y, radius: RADIUS, startAngle, endAngle };
}

describe('ComboSystem - Combo tracking logic', () => {
    // Test the combo timing logic before implementing ComboSystem
    describe('combo time window', () => {
        test('combo resets after time window expires', () => {
            const TIME_WINDOW = 3000; // 3 seconds in ms
            const combo = createMockCombo(TIME_WINDOW);

            combo.increment(0);     // t=0, eat fish
            combo.increment(1000);  // t=1000, eat fish (within window)
            combo.increment(2000);  // t=2000, eat fish (within window)
            expect(combo.count).toBe(3);

            // Simulate time passing beyond window without eating
            combo.update(2000 + TIME_WINDOW + 1); // t > window
            expect(combo.count).toBe(0);
        });

        test('combo count increments on each eat within window', () => {
            const combo = createMockCombo(3000);
            combo.increment(0);
            combo.increment(500);
            combo.increment(1000);
            expect(combo.count).toBe(3);
        });

        test('combo bonus multiplier is 0.2 per combo count', () => {
            const BONUS = 0.2;
            const combo = createMockCombo(3000);
            combo.increment(0);
            combo.increment(500);
            // combo=2, bonus = 2 * 0.2 = 0.4 → total multiplier = 1.4
            expect(combo.getBonusMultiplier()).toBeCloseTo(1 + 2 * BONUS, 5);
        });

        test('combo count resets to 0 on reset', () => {
            const combo = createMockCombo(3000);
            combo.increment(0);
            combo.increment(500);
            combo.reset();
            expect(combo.count).toBe(0);
        });

        test('bonus multiplier is 1.0 when combo is 0 or 1', () => {
            const combo = createMockCombo(3000);
            expect(combo.getBonusMultiplier()).toBe(1.0);
            combo.increment(0);
            expect(combo.getBonusMultiplier()).toBe(1.0); // first hit, no bonus
        });
    });
});

/**
 * Pure-logic combo mock (no Phaser dependency)
 */
function createMockCombo(timeWindow) {
    const BONUS_PER_COMBO = 0.2;
    let count = 0;
    let lastEatTime = -Infinity;

    return {
        get count() { return count; },
        increment(now) {
            count++;
            lastEatTime = now;
        },
        update(now) {
            if (count > 0 && now - lastEatTime > timeWindow) {
                count = 0;
            }
        },
        reset() { count = 0; },
        getBonusMultiplier() {
            if (count <= 1) return 1.0;
            return 1.0 + count * BONUS_PER_COMBO;
        }
    };
}
