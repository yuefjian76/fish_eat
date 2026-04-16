// EnemySpecialBehaviors.test.js
// TDD tests for eel dash, octopus stealth, seahorse evasive, jellyfish AOE, anglerfish ranged

describe('Special fish behaviors - pure logic', () => {

    // ─── Eel Dash ─────────────────────────────────────────────────────────────

    describe('Eel: dash behavior', () => {
        test('dashCooldownMs returns positive number', () => {
            expect(getDashCooldown()).toBeGreaterThan(0);
        });

        test('isDashReady returns true when cooldown elapsed', () => {
            const lastDash = 0;
            const now = getDashCooldown() + 1;
            expect(isDashReady(lastDash, now)).toBe(true);
        });

        test('isDashReady returns false during cooldown', () => {
            const lastDash = 1000;
            const now = 1000 + getDashCooldown() - 1;
            expect(isDashReady(lastDash, now)).toBe(false);
        });

        test('dashSpeedMultiplier is at least 3x base', () => {
            expect(getDashSpeedMultiplier()).toBeGreaterThanOrEqual(3);
        });

        test('dashDurationMs is short (under 600ms)', () => {
            expect(getDashDuration()).toBeLessThan(600);
        });

        test('getDashVelocity returns components with magnitude = speed', () => {
            const vel = getDashVelocity(0, 0, 100, 0, 300);
            expect(vel.vx).toBeCloseTo(300, 1);
            expect(vel.vy).toBeCloseTo(0, 1);
        });

        test('getDashVelocity diagonal is normalised', () => {
            const vel = getDashVelocity(0, 0, 100, 100, 300);
            const mag = Math.hypot(vel.vx, vel.vy);
            expect(mag).toBeCloseTo(300, 1);
        });
    });

    // ─── Octopus Stealth ───────────────────────────────────────────────────────

    describe('Octopus: stealth behavior', () => {
        test('stealthAlpha is less than 0.4 (visually hidden)', () => {
            expect(getStealthAlpha()).toBeLessThan(0.4);
        });

        test('normalAlpha is 1.0', () => {
            expect(getNormalAlpha()).toBe(1.0);
        });

        test('stealthCooldownMs returns positive number', () => {
            expect(getStealthCooldown()).toBeGreaterThan(0);
        });

        test('stealthDurationMs is between 1s and 5s', () => {
            const dur = getStealthDuration();
            expect(dur).toBeGreaterThanOrEqual(1000);
            expect(dur).toBeLessThanOrEqual(5000);
        });

        test('stealthVisionReduction: enemy vision range halves while stealthed', () => {
            const baseRange = 200;
            const reduced = getStealthedVisionRange(baseRange);
            expect(reduced).toBeLessThanOrEqual(baseRange * 0.5);
        });

        test('isStealthed returns true when stealthTimer < stealthDuration', () => {
            const state = createOctopusState();
            state.stealthActive = true;
            state.stealthTimer = getStealthDuration() - 100;
            expect(isStealthActive(state)).toBe(true);
        });

        test('isStealthed returns false after duration', () => {
            const state = createOctopusState();
            state.stealthActive = true;
            state.stealthTimer = getStealthDuration() + 1;
            expect(isStealthActive(state)).toBe(false);
        });
    });

    // ─── Seahorse Evasive ─────────────────────────────────────────────────────

    describe('Seahorse: evasive behavior', () => {
        test('evasionTriggerRange is reasonable (100-250px)', () => {
            const range = getEvasionTriggerRange();
            expect(range).toBeGreaterThanOrEqual(100);
            expect(range).toBeLessThanOrEqual(250);
        });

        test('evasionSpeedMultiplier exceeds 1.5x', () => {
            expect(getEvasionSpeedMultiplier()).toBeGreaterThan(1.5);
        });

        test('shouldEvade returns true when threat within trigger range', () => {
            const triggerRange = getEvasionTriggerRange();
            expect(shouldEvade(0, 0, triggerRange - 10, 0)).toBe(true);
        });

        test('shouldEvade returns false when threat outside trigger range', () => {
            const triggerRange = getEvasionTriggerRange();
            expect(shouldEvade(0, 0, triggerRange + 10, 0)).toBe(false);
        });

        test('getEvasionVelocity moves directly away from threat', () => {
            // threat is to the right, evasion should move left (negative vx)
            const vel = getEvasionVelocity(100, 0, 0, 0, 200); // threat at (100,0), self at (0,0)
            expect(vel.vx).toBeLessThan(0);
        });

        test('getEvasionVelocity has correct speed magnitude', () => {
            const speed = 200;
            const vel = getEvasionVelocity(100, 0, 0, 0, speed);
            const mag = Math.hypot(vel.vx, vel.vy);
            expect(mag).toBeCloseTo(speed, 1);
        });
    });

    // ─── Jellyfish AOE ───────────────────────────────────────────────────────

    describe('Jellyfish: AOE sting behavior', () => {
        test('aoeCooldownMs returns positive number', () => {
            expect(getAoeCooldown()).toBeGreaterThan(0);
        });

        test('aoeRadius is between 60 and 200px', () => {
            const r = getAoeRadius();
            expect(r).toBeGreaterThanOrEqual(60);
            expect(r).toBeLessThanOrEqual(200);
        });

        test('getTargetsInRange returns targets within radius', () => {
            const targets = [
                { x: 50, y: 0 },
                { x: 0, y: 50 },
                { x: 500, y: 0 },   // out of range
            ];
            const radius = getAoeRadius();
            const hit = getTargetsInRange(0, 0, targets, radius);
            expect(hit.length).toBe(2);
        });

        test('getTargetsInRange returns empty when none in range', () => {
            const targets = [{ x: 1000, y: 1000 }];
            const hit = getTargetsInRange(0, 0, targets, 100);
            expect(hit.length).toBe(0);
        });

        test('aoeIsReady returns true when cooldown elapsed', () => {
            const last = 0;
            const now = getAoeCooldown() + 1;
            expect(aoeIsReady(last, now)).toBe(true);
        });

        test('aoeIsReady returns false during cooldown', () => {
            const last = 1000;
            const now = 1000 + getAoeCooldown() - 1;
            expect(aoeIsReady(last, now)).toBe(false);
        });

        test('AOE damage is non-zero positive number', () => {
            expect(getAoeDamage()).toBeGreaterThan(0);
        });
    });

    // ─── Anglerfish Ranged ───────────────────────────────────────────────────

    describe('Anglerfish: ranged lure attack', () => {
        test('rangedAttackRange is between 100 and 300px', () => {
            const r = getRangedAttackRange();
            expect(r).toBeGreaterThanOrEqual(100);
            expect(r).toBeLessThanOrEqual(300);
        });

        test('projectileSpeed is between 200 and 600', () => {
            const s = getProjectileSpeed();
            expect(s).toBeGreaterThanOrEqual(200);
            expect(s).toBeLessThanOrEqual(600);
        });

        test('rangedCooldown returns positive number', () => {
            expect(getRangedCooldown()).toBeGreaterThan(0);
        });

        test('isRangedReady returns true when cooldown elapsed', () => {
            const last = 0;
            const now = getRangedCooldown() + 1;
            expect(isRangedReady(last, now)).toBe(true);
        });

        test('isRangedReady returns false during cooldown', () => {
            const last = 1000;
            const now = 1000 + getRangedCooldown() - 1;
            expect(isRangedReady(last, now)).toBe(false);
        });

        test('getProjectileVelocity aims at target', () => {
            // Anglerfish at (0,0), player at (100,0)
            const vel = getProjectileVelocity(0, 0, 100, 0);
            expect(vel.vx).toBeGreaterThan(0); // positive x towards player
            expect(Math.abs(vel.vy)).toBeLessThan(1); // negligible y
        });

        test('getProjectileVelocity normalised magnitude equals projectileSpeed', () => {
            const spd = getProjectileSpeed();
            const vel = getProjectileVelocity(0, 0, 100, 100);
            const mag = Math.hypot(vel.vx, vel.vy);
            expect(mag).toBeCloseTo(spd, 1);
        });

        test('ranged damage is positive', () => {
            expect(getRangedDamage()).toBeGreaterThan(0);
        });
    });

    // ─── Behavior detection ───────────────────────────────────────────────────

    describe('behavior type detection', () => {
        test('eel config has dash behavior', () => {
            const cfg = { dash: true, behavior: 'dash' };
            expect(hasBehavior(cfg, 'dash')).toBe(true);
        });

        test('octopus config has stealth behavior', () => {
            const cfg = { stealth: true, behavior: 'stealth' };
            expect(hasBehavior(cfg, 'stealth')).toBe(true);
        });

        test('seahorse config has evasive behavior', () => {
            const cfg = { evasive: true, behavior: 'evasive' };
            expect(hasBehavior(cfg, 'evasive')).toBe(true);
        });

        test('jellyfish config has aoe behavior', () => {
            const cfg = { aoe: true, behavior: 'floating' };
            expect(hasBehavior(cfg, 'aoe')).toBe(true);
        });

        test('anglerfish config has ranged behavior', () => {
            const cfg = { range: 200, behavior: 'ranged' };
            expect(hasBehavior(cfg, 'ranged')).toBe(true);
        });

        test('shark config has no special behavior', () => {
            const cfg = { strongAgainst: ['clownfish'] };
            expect(hasBehavior(cfg, 'dash')).toBe(false);
            expect(hasBehavior(cfg, 'stealth')).toBe(false);
        });
    });
});

// ─── Pure helper implementations ─────────────────────────────────────────────

// Eel dash
function getDashCooldown() { return 3000; }
function getDashDuration() { return 350; }
function getDashSpeedMultiplier() { return 4; }
function isDashReady(lastDash, now) { return now - lastDash >= getDashCooldown(); }
function getDashVelocity(fx, fy, tx, ty, speed) {
    const dx = tx - fx, dy = ty - fy;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) return { vx: speed, vy: 0 };
    return { vx: (dx / dist) * speed, vy: (dy / dist) * speed };
}

// Octopus stealth
function getStealthAlpha() { return 0.2; }
function getNormalAlpha() { return 1.0; }
function getStealthCooldown() { return 5000; }
function getStealthDuration() { return 2500; }
function getStealthedVisionRange(baseRange) { return baseRange * 0.4; }
function createOctopusState() { return { stealthActive: false, stealthTimer: 0 }; }
function isStealthActive(state) {
    return state.stealthActive && state.stealthTimer < getStealthDuration();
}

// Seahorse evasive
function getEvasionTriggerRange() { return 180; }
function getEvasionSpeedMultiplier() { return 2.2; }
function shouldEvade(threatX, threatY, selfX, selfY) {
    return Math.hypot(selfX - threatX, selfY - threatY) < getEvasionTriggerRange();
}
function getEvasionVelocity(threatX, threatY, selfX, selfY, speed) {
    const dx = selfX - threatX, dy = selfY - threatY;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) return { vx: speed, vy: 0 };
    return { vx: (dx / dist) * speed, vy: (dy / dist) * speed };
}

// Jellyfish AOE
function getAoeCooldown() { return 4000; }
function getAoeRadius() { return 100; }
function getAoeDamage() { return 8; }
function getTargetsInRange(x, y, targets, radius) {
    return targets.filter(t => Math.hypot(t.x - x, t.y - y) <= radius);
}
function aoeIsReady(last, now) { return now - last >= getAoeCooldown(); }

// Anglerfish ranged
function getRangedAttackRange() { return 200; }
function getProjectileSpeed() { return 300; }
function getRangedCooldown() { return 2500; }
function isRangedReady(last, now) { return now - last >= getRangedCooldown(); }
function getRangedDamage() { return 10; }
function getProjectileVelocity(fx, fy, tx, ty) {
    const speed = getProjectileSpeed();
    const dx = tx - fx, dy = ty - fy;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) return { vx: speed, vy: 0 };
    return { vx: (dx / dist) * speed, vy: (dy / dist) * speed };
}

// Behavior detection
function hasBehavior(cfg, type) {
    if (type === 'dash') return !!cfg.dash;
    if (type === 'stealth') return !!cfg.stealth;
    if (type === 'evasive') return !!cfg.evasive;
    if (type === 'aoe') return !!cfg.aoe;
    if (type === 'ranged') return !!cfg.range;
    return false;
}
