# E2E Debug Console API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `window.__DEBUG_API__` console API for browser-based game debugging, testing, and state monitoring.

**Architecture:** Add `_createDebugAPI()` method to GameScene.js that returns a bound debug object. All methods validate input, return structured results, and only execute when `?debug=true` is set. The API attaches to `window.__DEBUG_API__` to avoid collision with Phaser's `window.game`.

**Tech Stack:** Phaser.js 3.x · Playwright (E2E) · Jest (unit)

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/scenes/GameScene.js:354-400` | Add `_createDebugAPI()` method, initialize on `?debug=true` |
| `src/systems/SkillSystem.js:560-575` | Add cooldown reset method (existing `cooldowns` is already public) |
| `e2e/debug-api.spec.js` | New E2E tests for all debug API methods |

---

## Task 1: GameScene — add _createDebugAPI() skeleton

**Files:**
- Modify: `src/scenes/GameScene.js:350-366`

### 1a. Add debug API initialization

In `create()` method, after the existing `window.__GAME_SCENE__` block (~L365), add:

```javascript
// Initialize debug console API when ?debug=true
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('debug') === 'true') {
    window.__DEBUG_API__ = this._createDebugAPI();
    console.log('%c[DEBUG] Game debug API ready — type game.debug.help() for commands', 'color: #00ff88');
}
```

### 1b. Add _createDebugAPI() method skeleton

Add this method to GameScene class (place near line 1100, after `update()` method):

```javascript
/**
 * Create debug console API for E2E testing
 * Only available when ?debug=true is set in URL
 * @returns {object} Debug API object
 */
_createDebugAPI() {
    const self = this;
    let _watchInterval = null;
    let _watchKeys = [];

    const api = {
        // === State Viewing ===
        state() {
            return {
                hp: self.hp,
                maxHp: self.maxHp,
                level: self.level,
                score: self.score,
                exp: self.exp,
                wave: self._waveState,
                enemyCount: self.enemies?.length || 0,
                skillCooldowns: {
                    Q: self.skillSystem?.getCooldownRemaining('bite') || 0,
                    W: self.skillSystem?.getCooldownRemaining('shield') || 0,
                    E: self.skillSystem?.getCooldownRemaining('speed_up') || 0,
                    R: self.skillSystem?.getCooldownRemaining('heal') || 0,
                }
            };
        },

        state: {
            detailed() {
                return {
                    enemies: (self.enemies || []).map(e => ({
                        type: e.fishType,
                        x: e.graphics?.x || 0,
                        y: e.graphics?.y || 0,
                        hp: e.hp || 0,
                        maxHp: e.maxHp || 0,
                        size: e.fishConfig?.size || 0,
                    })),
                    activeEffects: Object.entries(self.skillSystem?.activeEffects || {})
                        .filter(([, v]) => v !== null)
                        .map(([name, effect]) => ({
                            name,
                            remainingMs: effect.duration ? Math.max(0, effect.duration - (self.time?.now - effect.startTime)) : 0,
                        })),
                    player: {
                        x: self.player?.x || 0,
                        y: self.player?.y || 0,
                        size: self.player?.playerData?.size || 0,
                    },
                    combo: self.comboSystem?.getComboMultiplier?.() || 1,
                    elapsedMs: self.time?.now || 0,
                };
            }
        },

        // === Scene Control ===
        level(n) {
            const parsed = parseInt(n);
            if (isNaN(parsed)) {
                return { error: `level must be integer, got: ${n}` };
            }
            const clamped = Math.max(1, Math.min(15, parsed));
            self.level = clamped;
            self.onLevelUp();
            return { success: true, level: clamped };
        },

        restart() {
            self.scene.scene.restart('BootScene');
            return { success: true, message: 'Restarting game...' };
        },

        // === Manual Actions ===
        skill(key) {
            const keyMap = { Q: 'bite', W: 'shield', E: 'speed_up', R: 'heal' };
            const skillId = keyMap[key?.toUpperCase()];
            if (!skillId) {
                return { error: `Invalid key: ${key}. Use Q/W/E/R` };
            }
            const skillData = self.skillsData?.[skillId];
            if (!skillData) {
                return { error: `Skill ${key} not found in skillsData` };
            }
            // Check if unlocked
            const unlockLevel = skillData.unlockLevel || 1;
            if (self.level < unlockLevel) {
                return { success: false, reason: `Skill ${key} not unlocked until Level ${unlockLevel}`, currentLevel: self.level, requiredLevel: unlockLevel };
            }
            // Check cooldown
            const cooldown = self.skillSystem?.getCooldownRemaining(skillId) || 0;
            if (cooldown > 0) {
                return { success: false, reason: 'Skill on cooldown', remainingCooldown: cooldown };
            }
            // Execute
            const result = self.skillSystem?.useSkill(key);
            return { success: true, skillKey: key, action: skillData.type };
        },

        eat(fishType) {
            if (!fishType) {
                return { error: 'fishType required, e.g. eat("shark")' };
            }
            const enemies = self.enemies || [];
            // Find nearest matching fish within 1000 units
            const px = self.player?.x || 512;
            const py = self.player?.y || 384;
            let nearest = null;
            let nearestDist = Infinity;
            for (const enemy of enemies) {
                if (!enemy.graphics?.active) continue;
                if (enemy.fishType !== fishType) continue;
                const dx = (enemy.graphics.x || 0) - px;
                const dy = (enemy.graphics.y || 0) - py;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist && dist <= 1000) {
                    nearestDist = dist;
                    nearest = enemy;
                }
            }
            if (!nearest) {
                return { error: `No ${fishType} fish within range`, searchedRange: 1000 };
            }
            // Check size requirement: player.size > target.size * 1.2
            const playerSize = self.player?.playerData?.size || 30;
            const targetSize = nearest.fishConfig?.size || 30;
            if (playerSize < targetSize * 1.2) {
                return { error: `Player too small to eat ${fishType}`, playerSize, requiredSize: Math.ceil(targetSize * 1.2) };
            }
            // Trigger eat via collision result
            const result = self.collisionSystem?.checkCollision(self.player, nearest.graphics, self.player.playerData);
            if (result?.type === 'eat') {
                return { success: true, eaten: fishType, expGained: result.expGain || 0 };
            }
            return { success: false, reason: result?.type || 'eat_failed', details: result };
        },

        // === Real-time Monitoring ===
        watch(...keys) {
            // Clear any existing watch
            if (_watchInterval) {
                clearInterval(_watchInterval);
            }
            _watchKeys = keys;
            if (keys.length === 0) {
                return { error: 'Specify keys to watch, e.g. watch("hp", "score")' };
            }
            const prevValues = {};
            _watchInterval = setInterval(() => {
                const state = api.state();
                const parts = [];
                for (const key of _watchKeys) {
                    const val = state[key];
                    if (val === undefined) continue;
                    if (key === 'hp') {
                        const color = state.hp < state.maxHp * 0.3 ? '#ff3333' : '#00ff00';
                        parts.push(`hp: ${state.hp}/${state.maxHp}`);
                    } else if (key === 'score') {
                        parts.push(`score: ${state.score}`);
                    } else if (key === 'wave') {
                        parts.push(`wave: ${state.wave}`);
                    } else if (key === 'level') {
                        parts.push(`lv: ${state.level}`);
                    } else if (key === 'exp') {
                        parts.push(`exp: ${state.exp}`);
                    } else {
                        parts.push(`${key}: ${val}`);
                    }
                }
                if (parts.length > 0) {
                    const timestamp = new Date().toTimeString().split(' ')[0];
                    console.log(`%c[${timestamp}] ${parts.join(', ')}`, 'color: #88ff88');
                }
            }, 500);
            return { success: true, watching: keys, intervalId: _watchInterval };
        },

        unwatch() {
            if (_watchInterval) {
                clearInterval(_watchInterval);
                _watchInterval = null;
                _watchKeys = [];
                return { success: true, message: 'Watch stopped' };
            }
            return { success: true, message: 'Nothing to unwatch' };
        },

        // === Test Helpers ===
        spawn(type, count) {
            if (!type || count <= 0) {
                return { spawned: 0, failed: 1, reason: 'Invalid parameters: spawn(type, count)' };
            }
            const fishConfig = self.fishData?.[type];
            if (!fishConfig) {
                return { spawned: 0, failed: count, reason: `Invalid fish type: ${type}` };
            }
            // Check if SpawnSystem exists and has spawnEnemy method
            if (self.spawnSystem?.spawnEnemy) {
                for (let i = 0; i < count; i++) {
                    self.spawnSystem.spawnEnemy(type, 1);
                }
            } else {
                // Fallback: directly create enemy via Enemy factory
                for (let i = 0; i < count; i++) {
                    const enemy = new Enemy(self, Math.random() * 800, Math.random() * 600, fishConfig, 1);
                    self.enemies.push(enemy);
                }
            }
            return { spawned: count, failed: 0 };
        },

        killAll() {
            const enemies = self.enemies || [];
            let killed = 0;
            let skipped = 0;
            for (const enemy of enemies) {
                if (enemy.fishConfig?.isBoss) {
                    skipped++;
                    continue;
                }
                enemy.destroy?.();
                killed++;
            }
            // Clear dead entries
            self.enemies = self.enemies.filter(e => e.graphics?.active !== false);
            return { killed, skipped, message: `Killed ${killed}, skipped ${skipped} boss(es)` };
        },

        fullHealth() {
            self.hp = self.maxHp;
            self.scene?.get('UIScene')?.updateUI?.(self.score, self.exp, self.level, self.hp, self.maxHp, self.growthSystem?.getExpForLevel(self.level + 1) || 100);
            return { success: true, hp: self.hp, maxHp: self.maxHp };
        },

        maxExp() {
            const nextLevelExp = self.growthSystem?.getExpForLevel(self.level + 1) || 100;
            const targetExp = nextLevelExp - 1;
            const prevLevel = self.level;
            self.exp = targetExp;
            const leveledUp = self.growthSystem?.addExperience(0, self.time?.now, self.luckSystem);
            const newLevel = self.growthSystem?.getLevel() || self.level;
            return {
                success: true,
                exp: targetExp,
                nextLevelAt: nextLevelExp,
                leveledUp: newLevel > prevLevel,
                newLevel: newLevel
            };
        },

        // === Info ===
        help() {
            const lines = [
                'state() — Returns full game state snapshot',
                'state.detailed() — Returns extended state (enemies, effects, position)',
                'level(n) — Jump to level n (1-15, clamped)',
                'restart() — Full game reset (return to BootScene)',
                'skill("Q"|"W"|"E"|"R") — Trigger skill by key',
                'eat("fishType") — Auto-eat target fish type (validates size first)',
                'watch("hp", "score", ...) — Real-time monitoring (Ctrl+C to stop)',
                'unwatch() — Stop watching',
                'spawn("shark", 3) — Spawn 3 sharks',
                'killAll() — Remove all enemies (excludes bosses)',
                'fullHealth() — Restore HP to maxHp',
                'maxExp() — Set EXP to just below level-up threshold',
                'help() — Show this message',
            ];
            const msg = lines.join('\n');
            console.log(`%c[DEBUG API]\n${msg}`, 'color: #88ff88');
            return msg;
        },
    };

    return api;
}
```

### 1c. Run existing tests to confirm no regression

Run: `npm test 2>&1 | tail -10`
Expected: 855 tests still pass

- [ ] **Step 1: Add debug API initialization + `_createDebugAPI()` method to GameScene.js**
- [ ] **Step 2: Run `npm test` — Expected: 855 tests pass**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat(e2e-debug): add __DEBUG_API__ skeleton with all methods"
```

---

## Task 2: E2E Tests — debug-api.spec.js

**Files:**
- Create: `e2e/debug-api.spec.js`

- [ ] **Step 1: Write the E2E test file**

```javascript
/**
 * E2E Debug API Tests
 * Run with: npx playwright test e2e/debug-api.spec.js --project=chromium
 * Requires game server running on port 8765
 */

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

test('game.debug.state() returns structured object', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    const state = await page.evaluate(() => window.__DEBUG_API__?.state());
    expect(state).toHaveProperty('hp');
    expect(state).toHaveProperty('maxHp');
    expect(state).toHaveProperty('level');
    expect(state).toHaveProperty('score');
    expect(state).toHaveProperty('wave');
    expect(state).toHaveProperty('skillCooldowns');
    expect(typeof state.skillCooldowns).toBe('object');
});

test('game.debug.level(5) changes level', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    const result = await page.evaluate(() => window.__DEBUG_API__?.level(5));
    expect(result.success).toBe(true);
    expect(result.level).toBe(5);
    const state = await page.evaluate(() => window.__DEBUG_API__?.state());
    expect(state.level).toBe(5);
});

test('game.debug.level(20) clamps to 15', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    const result = await page.evaluate(() => window.__DEBUG_API__?.level(20));
    expect(result.success).toBe(true);
    expect(result.level).toBe(15);
});

test('game.debug.level("bad") returns error', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    const result = await page.evaluate(() => window.__DEBUG_API__?.level('bad'));
    expect(result.error).toBeDefined();
    expect(result.error).toContain('level must be integer');
});

test('game.debug.watch("hp") starts monitoring', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    const result = await page.evaluate(() => window.__DEBUG_API__?.watch('hp'));
    expect(result.success).toBe(true);
    expect(result.watching).toContain('hp');
    // Clean up
    await page.evaluate(() => window.__DEBUG_API__?.unwatch());
});

test('game.debug.unwatch() stops monitoring', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    await page.evaluate(() => window.__DEBUG_API__?.watch('hp'));
    const result = await page.evaluate(() => window.__DEBUG_API__?.unwatch());
    expect(result.success).toBe(true);
});

test('game.debug.unwatch() when not watching is safe', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    const result = await page.evaluate(() => window.__DEBUG_API__?.unwatch());
    expect(result.success).toBe(true);
    expect(result.message).toContain('Nothing');
});

test('game.debug.skill("Q") executes', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    const result = await page.evaluate(() => window.__DEBUG_API__?.skill('Q'));
    // Q is always unlocked at level 1, may be on cooldown
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('skillKey');
});

test('game.debug.spawn("shark", 2) creates enemies', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    const before = await page.evaluate(() => window.__DEBUG_API__?.state().enemyCount);
    const result = await page.evaluate(() => window.__DEBUG_API__?.spawn('shark', 2));
    expect(result.spawned).toBe(2);
    expect(result.failed).toBe(0);
    const after = await page.evaluate(() => window.__DEBUG_API__?.state().enemyCount);
    expect(after).toBeGreaterThanOrEqual(before + 2);
});

test('game.debug.spawn("invalid", 1) returns error', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    const result = await page.evaluate(() => window.__DEBUG_API__?.spawn('invalid_type', 1));
    expect(result.spawned).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.reason).toContain('Invalid fish type');
});

test('game.debug.killAll() excludes bosses', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    // Spawn some enemies first
    await page.evaluate(() => window.__DEBUG_API__?.spawn('shark', 3));
    await delay(500);
    const result = await page.evaluate(() => window.__DEBUG_API__?.killAll());
    expect(result).toHaveProperty('killed');
    expect(result).toHaveProperty('skipped');
});

test('game.debug.help() prints commands', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    const result = await page.evaluate(() => window.__DEBUG_API__?.help());
    expect(result).toContain('state()');
    expect(result).toContain('level(n)');
    expect(result).toContain('watch(');
});

test('game.debug.eat("nonexistent") returns error', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    const result = await page.evaluate(() => window.__DEBUG_API__?.eat('nonexistent_fish_type_xyz'));
    expect(result.error).toBeDefined();
});

test('game.debug.fullHealth() works', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    const result = await page.evaluate(() => window.__DEBUG_API__?.fullHealth());
    expect(result.success).toBe(true);
    expect(result.hp).toBe(result.maxHp);
});

test('game.debug.restart() is callable', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(3000);
    const result = await page.evaluate(() => window.__DEBUG_API__?.restart());
    expect(result.success).toBe(true);
});
```

- [ ] **Step 2: Run E2E tests — `npx playwright test e2e/debug-api.spec.js --project=chromium 2>&1 | tail -30`**
- [ ] **Step 3: Fix any failures and re-run until passing**
- [ ] **Step 4: Commit**

```bash
git add e2e/debug-api.spec.js
git commit -m "feat(e2e-debug): add debug API E2E tests"
```

---

## Task 3: Final verification

- [ ] **Step 1: Run `npm test` — Expected: 855 tests pass**
- [ ] **Step 2: Run `./init.sh` — Expected: All 5 steps pass**
- [ ] **Step 3: Start server and run E2E debug tests manually**
- [ ] **Step 4: Commit with evidence**

---

## Self-Review Checklist

1. **Spec coverage:** All 12 acceptance criteria from spec have tasks:
   - ✅ `window.__DEBUG_API__` exposed on `?debug=true`
   - ✅ `state()` returns hp, maxHp, level, score, wave, skillCooldowns
   - ✅ `level(n)` clamps to 1-15, changes player level
   - ✅ `watch()` outputs every 500ms, returns interval ID
   - ✅ `skill('Q')` returns structured result
   - ✅ `spawn()` returns `{ spawned, failed, reason }`
   - ✅ Existing smoke tests still pass
   - ✅ No debug code when `?debug` not set
   - ✅ Namespace `__DEBUG_API__` not `game`

2. **Placeholder scan:** No TBD/TODO — all methods have full implementation

3. **Type consistency:** Method signatures match spec — `skill('Q')`, `spawn('shark', 3)`, `watch('hp', 'score')`