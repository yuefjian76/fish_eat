// MouseControl.test.js
// Tests for mouse control logic - smooth chasing without jitter

describe('Mouse control - smooth chasing logic', () => {
    // Dead zone: stop moving when close enough to mouse
    describe('dead zone threshold', () => {
        const DEAD_ZONE = 8; // px - stop moving when within 8px of mouse

        test('player stops when within dead zone of target', () => {
            const player = { x: 100, y: 100 };
            const target = { x: 105, y: 103 }; // distance ~5.8px < 8
            const dist = Math.hypot(target.x - player.x, target.y - player.y);
            expect(dist).toBeLessThan(DEAD_ZONE);
            // At this distance, velocity should be zero
            const velocity = computeMouseVelocity(player, target, 200, DEAD_ZONE);
            expect(velocity.vx).toBe(0);
            expect(velocity.vy).toBe(0);
        });

        test('player moves when outside dead zone', () => {
            const player = { x: 100, y: 100 };
            const target = { x: 200, y: 100 }; // distance 100px >> 8
            const velocity = computeMouseVelocity(player, target, 200, DEAD_ZONE);
            expect(velocity.vx).toBeGreaterThan(0);
        });

        test('velocity is exactly 0 when on dead zone boundary (edge case)', () => {
            const player = { x: 100, y: 100 };
            const target = { x: 100 + DEAD_ZONE, y: 100 }; // exactly at boundary
            const velocity = computeMouseVelocity(player, target, 200, DEAD_ZONE);
            // At exact boundary, should stop (<=)
            expect(velocity.vx).toBe(0);
            expect(velocity.vy).toBe(0);
        });
    });

    describe('velocity direction', () => {
        const DEAD_ZONE = 8;

        test('velocity points toward target', () => {
            const player = { x: 0, y: 0 };
            const target = { x: 100, y: 0 };
            const velocity = computeMouseVelocity(player, target, 200, DEAD_ZONE);
            expect(velocity.vx).toBeCloseTo(200, 0);
            expect(velocity.vy).toBeCloseTo(0, 1);
        });

        test('velocity normalized to speed when far away', () => {
            const player = { x: 0, y: 0 };
            const target = { x: 300, y: 400 }; // distance 500
            const speed = 200;
            const velocity = computeMouseVelocity(player, target, speed, DEAD_ZONE);
            const resultSpeed = Math.hypot(velocity.vx, velocity.vy);
            expect(resultSpeed).toBeCloseTo(speed, 1);
        });

        test('velocity scales down proportionally when close (easing)', () => {
            const player = { x: 0, y: 0 };
            const EASE_ZONE = 60;
            const target = { x: 30, y: 0 }; // inside ease zone (30/60 = 50%)
            const velocity = computeMouseVelocityWithEasing(player, target, 200, DEAD_ZONE, EASE_ZONE);
            // Speed should be less than max when inside ease zone
            expect(Math.abs(velocity.vx)).toBeLessThan(200);
            expect(Math.abs(velocity.vx)).toBeGreaterThan(0);
        });
    });

    describe('keyboard priority over mouse', () => {
        test('keyboard mode flag should disable mouse velocity', () => {
            // When any arrow key is held, mouse control should not set velocity
            const isKeyboardActive = true;
            const result = shouldApplyMouseControl(isKeyboardActive);
            expect(result).toBe(false);
        });

        test('mouse mode active when no keyboard key held', () => {
            const isKeyboardActive = false;
            const result = shouldApplyMouseControl(isKeyboardActive);
            expect(result).toBe(true);
        });
    });
});

/**
 * Pure velocity computation for mouse chasing (no jitter)
 * Dead zone: if dist <= deadZone, return {vx:0, vy:0}
 */
function computeMouseVelocity(player, target, speed, deadZone) {
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= deadZone) return { vx: 0, vy: 0 };
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    return { vx, vy };
}

/**
 * Velocity with easing: slow down as player approaches target
 */
function computeMouseVelocityWithEasing(player, target, speed, deadZone, easeZone) {
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= deadZone) return { vx: 0, vy: 0 };
    // Scale speed by distance ratio within ease zone
    const scale = dist < easeZone ? dist / easeZone : 1.0;
    const effectiveSpeed = speed * scale;
    const vx = (dx / dist) * effectiveSpeed;
    const vy = (dy / dist) * effectiveSpeed;
    return { vx, vy };
}

/**
 * Determine if mouse control should apply
 */
function shouldApplyMouseControl(isKeyboardActive) {
    return !isKeyboardActive;
}
