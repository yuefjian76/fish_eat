# E2E Debug & Testing Enhancement — Design Spec

## 1. Overview

**Goal:** Enhance E2E testing capability by exposing a `game.debug` console API that allows developers to:
- View game state in real-time
- Jump to specific levels/scenarios
- Manually trigger actions (skills, eating)
- Monitor state changes continuously
- Use test helpers (spawn enemies, full health, etc.)

**Context:** All 49 features completed (855 tests pass), but E2E testing is limited to smoke tests. This enhancement enables comprehensive in-game testing via browser console.

---

## 2. Architecture

### Console API: `window.__DEBUG_API__`

When game URL includes `?debug=true`, expose debug API on `window`:

```javascript
window.__DEBUG_API__ = {
  // State viewing
  state()           // → Full game state snapshot
  state.detailed()  // → Extended state (enemies, active effects, etc.)

  // Scene control
  level(n)          // Jump to specific level (1-15, clamped)
  restart()         // Full game reset (return to MenuScene)

  // Manual actions
  skill('Q')        // Trigger skill by key
  eat('fishType')   // Auto-eat target fish type (validates size first)

  // Real-time monitoring
  watch(...keys)    // Continuous output of state changes (replaces any active watch)
  unwatch()         // Stop watching (no-op if not watching, returns confirmation)

  // Test helpers
  spawn(type, count) // Spawn enemies via SpawnSystem
  killAll()          // Remove all enemies (excludes bosses)
  fullHealth()       // Restore HP to maxHp
  maxExp()           // Set EXP to level-up threshold

  // Info
  help()            // Print available commands
}
```

**Security:** API only exposed when `?debug=true` is set. No debug code runs otherwise.

**Namespace choice:** `window.__DEBUG_API__` avoids collision with Phaser's `window.game` (the Game instance).

---

## 3. API Details

### 3.1 State Viewing

**`game.debug.state()`**
- Returns: `{ hp, maxHp, level, score, exp, wave, enemyCount, skillCooldowns }`
- Example: `game.debug.state()` → `{ hp: 80, maxHp: 100, level: 3, score: 1500, exp: 150, wave: 'surge', enemyCount: 5, skillCooldowns: { Q: 0, W: 2.3, E: 0, R: 15 } }`
- Returns structured object — never null. Missing fields default to 0 or 'unknown'.

**`game.debug.state.detailed()`**
- Returns schema:
```javascript
{
  enemies: [
    { type: 'shark', x: 100, y: 200, hp: 30, maxHp: 50, size: 40 }
  ],
  activeEffects: [
    { name: 'shield', remainingMs: 2500 },
    { name: 'speedUp', remainingMs: 1500 }
  ],
  player: { x: 512, y: 384, size: 45 },
  combo: 1.2,
  elapsedMs: 45000
}
```
- Returns `{ enemies: [], activeEffects: [], player: {}, combo: 1, elapsedMs: 0 }` on error.

### 3.2 Scene Control

**`game.debug.level(n)`**
- Input validation: clamps to range `[1, 15]`. Non-integer input returns `{ error: 'level must be integer', provided: n }`.
- Sets `this.level = n`, triggers `this.onLevelUp()` sequence
- Automatically adjusts player size, HP, unlocks skills
- Use case: Jump directly to Level 5 to test Boss

**`game.debug.restart()`**
- Full game reset: calls `this.scene.scene.restart('BootScene')` to return to title
- Use case: Clean slate between test scenarios

### 3.3 Manual Actions

**`game.debug.skill('Q'|'W'|'E'|'R')`**
- Returns structured object:
  - Success: `{ success: true, skillKey: 'Q', action: 'damage' }`
  - Locked: `{ success: false, reason: 'Skill R not unlocked until Level 6', currentLevel: 3, requiredLevel: 6 }`
  - Cooldown: `{ success: false, reason: 'Skill on cooldown', remainingCooldown: 2.3 }`
- Note: Does NOT bypass cooldown in normal mode — debug mode still respects cooldown (use `skillSystem.cooldowns['bite'] = 0` to override manually if needed)

**`game.debug.eat('fishType')`**
- Finds nearest fish matching `fishType` within 1000 units
- **Size validation:** If player is too small to eat the target (player.size < target.size * 1.2), returns `{ error: 'Player too small to eat {fishType}', playerSize: n, requiredSize: m }`
- If no fish found: `{ error: 'No {fishType} fish within range', searchedRange: 1000 }`
- On success: triggers eat logic and returns `{ success: true, eaten: 'shark', expGained: 50 }`

### 3.4 Real-time Monitoring

**`game.debug.watch('hp', 'score', ...)`**
- Replaces any active watch session (single interval only — calling twice replaces first)
- Returns the interval ID (number) so tests can track it
- Outputs every 500ms in format: `[HH:MM:SS] hp: 80/100, score: 1500, wave: surge`
- Color-coded: hp < 30% → red, score → green, wave → yellow
- Only outputs when value changes (reduces noise)

**`game.debug.unwatch()`**
- No-op if not watching (returns `'Nothing to unwatch'` in this case)
- Otherwise stops interval and returns `'Watch stopped'`

### 3.5 Test Helpers

**`game.debug.spawn('shark', 3)`**
- Returns: `{ spawned: 3, failed: 0 }` on success
- Returns: `{ spawned: 0, failed: 1, reason: 'Invalid fish type: invalid_type' }` on failure
- Invalid type logs warning, returns descriptive error

**`game.debug.killAll()`**
- Excludes boss enemies (skips any enemy where `enemy.fishConfig?.isBoss === true`)
- Returns: `{ killed: 12, skipped: 1, reason: 'Boss enemies excluded' }`
- Use case: Reset battlefield for specific test scenarios

**`game.debug.fullHealth()`**
- Sets `this.hp = this.maxHp`
- Updates UI via `this.scene.get('UIScene').updateUI(...)`
- Returns: `{ success: true, hp: 100, maxHp: 100 }`

**`game.debug.maxExp()`**
- Sets EXP to `getExpForLevel(level + 1) - 1` (just below threshold)
- Triggers level-up if crossing boundary
- Returns: `{ success: true, exp: 199, nextLevelAt: 200 }` or `{ exp: 200, leveledUp: true, newLevel: 4 }`

### 3.6 Info

**`game.debug.help()`**
- Returns a string (printable to console), format: `NAME — DESCRIPTION` per line
- Example:
```
state() — Returns full game state snapshot
level(n) — Jump to level n (1-15)
skill('Q') — Trigger skill by key
...
```

---

## 4. Implementation

### 4.1 File: `src/scenes/GameScene.js`

Add in `create()` method, after debug overlay setup (~L352):

```javascript
// Initialize debug API when ?debug=true
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('debug') === 'true') {
    window.__DEBUG_API__ = this._createDebugAPI();
}
```

New method `_createDebugAPI()` returns the debug object with all methods bound to `this`.

### 4.2 Console Output Format

For `watch()` output, use styled console:
```javascript
console.log(
    `%c[${timestamp}] hp: ${hp}/${maxHp}, score: ${score}, wave: ${wave}`,
    `color: ${hp < maxHp * 0.3 ? '#ff3333' : '#00ff00'}`
);
```

### 4.3 Error Handling

- Invalid commands: Log error with suggestion
- Invalid parameters: Return structured error object
- Watch on inactive scene: Graceful no-op (watch returns null, unwatch returns 'Nothing to unwatch')

---

## 5. E2E Test Coverage

New test file: `e2e/debug-api.spec.js`

| Test | Description |
|------|-------------|
| `game.debug.state()` returns object with hp, maxHp, level, score, wave | Verify state structure |
| `game.debug.level(5)` changes level | Set level 5, verify via state |
| `game.debug.level(20)` clamps to 15 | Verify out-of-bounds handling |
| `game.debug.level('bad')` returns error | Verify invalid input handling |
| `game.debug.watch('hp')` outputs continuously | Monitor for 2 seconds |
| `game.debug.unwatch()` stops watching | Verify unwatch works |
| `game.debug.unwatch()` when not watching is safe | No-op returns message |
| `game.debug.skill('Q')` executes | Verify cooldown starts |
| `game.debug.skill('R')` when locked returns error | Verify lock check works |
| `game.debug.spawn('shark', 2)` creates enemies | Count enemies before/after |
| `game.debug.spawn('invalid', 1)` returns error | Verify invalid type handling |
| `game.debug.killAll()` excludes bosses | Verify boss protection |
| `game.debug.help()` prints commands | Verify non-empty output |
| `game.debug.eat('nonexistent')` returns error | Verify no-match handling |

---

## 6. Out of Scope

- Non-debug mode exposure (security)
- Remote/network debugging
- Mobile/touch support for debug UI
- Bypassing cooldown in normal gameplay

---

## 7. Acceptance Criteria

1. `?debug=true` exposes `window.__DEBUG_API__` with all methods in Console
2. `game.debug.state()` returns current hp, maxHp, level, score, wave, skillCooldowns
3. `game.debug.level(5)` actually changes player level to 5 (clamps to 1-15)
4. `game.debug.watch('hp')` outputs hp every 500ms when value changes until `unwatch()`
5. `game.debug.skill('Q')` triggers bite skill, returns structured result
6. `game.debug.spawn('shark', 3)` adds 3 sharks (returns count)
7. All existing E2E smoke tests still pass
8. No debug code runs when `?debug` is not set
9. `window.__DEBUG_API__` namespace does not collide with Phaser `window.game`