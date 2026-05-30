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

### Console API: `window.game.debug`

When game URL includes `?debug=true`, expose `game.debug` object on `window`:

```javascript
window.game = {
  debug: {
    // State viewing
    state()           // → Full game state snapshot
    state.detailed()  // → Extended state (cooldowns, enemy list, etc.)

    // Scene control
    level(n)          // Jump to specific level (1-15)
    restart()         // Restart game

    // Manual actions
    skill('Q')        // Trigger skill by key
    eat('fishType')   // Auto-eat target fish type (finds suitable prey)

    // Real-time monitoring
    watch(...keys)    // Continuous output of state changes
    unwatch()         // Stop watching

    // Test helpers
    spawn(type, count) // Spawn enemies via SpawnSystem
    killAll()          // Remove all enemies
    fullHealth()       // Restore HP to maxHp
    maxExp()           // Set EXP to level-up threshold

    // Info
    help()            // Print available commands
  }
}
```

---

## 3. API Details

### 3.1 State Viewing

**`game.debug.state()`**
- Returns: `{ hp, maxHp, level, score, exp, wave, enemyCount, skillCooldowns }`
- Example: `game.debug.state()` → `{ hp: 80, maxHp: 100, level: 3, score: 1500, wave: 'surge', enemyCount: 5, skillCooldowns: { Q: 0, W: 2.3, E: 0, R: 15 } }`

**`game.debug.state.detailed()`**
- Returns: Extended state including:
  - All enemy positions and types
  - Active effects (shield, speed buff)
  - Player position
  - Combo multiplier
  - Time elapsed

### 3.2 Scene Control

**`game.debug.level(n)`**
- Sets `this.level = n` and triggers level-up sequence
- Automatically sets player size, HP, unlocks skills
- Use case: Jump directly to Level 5 to test Boss

**`game.debug.restart()`**
- Calls `this.scene.restart()` to reset game state

### 3.3 Manual Actions

**`game.debug.skill('Q'|'W'|'E'|'R')`**
- Directly calls `this.skillSystem.useSkill(key)`
- Bypasses cooldown check for testing (optional: add `force: true` param)
- Returns: skill execution result

**`game.debug.eat('fishType')`**
- Finds nearest fish matching `fishType` and triggers eat logic
- If no matching fish, logs warning and returns null
- Use case: `game.debug.eat('shark')` to test eating a specific type

### 3.4 Real-time Monitoring

**`game.debug.watch('hp', 'score', ...)`**
- Continuously outputs state changes to Console
- Format: `[HH:MM:SS] hp: 80/100, score: 1500, wave: surge`
- Updates every 500ms
- Color-coded output: hp (red when low), score (green), wave (yellow)
- Persists until `game.debug.unwatch()` called or page refresh

**`game.debug.unwatch()`**
- Stops all active watch intervals
- Returns: Confirmation message

### 3.5 Test Helpers

**`game.debug.spawn('shark', 3)`**
- Calls `this.spawnSystem.spawnEnemy('shark', count)` (or similar)
- Enemies spawn at system-determined positions (not necessarily near player)
- Returns: Number of enemies spawned

**`game.debug.killAll()`**
- Iterates `this.enemies` and calls `enemy.destroy()` on each
- Use case: Reset battlefield for specific test scenarios

**`game.debug.fullHealth()`**
- Sets `this.hp = this.maxHp`
- Updates UI via `this.scene.get('UIScene').updateUI(...)`

**`game.debug.maxExp()`**
- Sets EXP to threshold for next level-up
- Triggers level-up sequence if boundary crossed

### 3.6 Info

**`game.debug.help()`**
- Prints formatted list of all available commands with descriptions

---

## 4. Implementation

### 4.1 File: `src/scenes/GameScene.js`

Add in `create()` method, after debug overlay setup (~L352):

```javascript
// Initialize debug API when ?debug=true
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('debug') === 'true') {
    window.game = window.game || {};
    window.game.debug = this._createDebugAPI();
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
- Invalid parameters: Show expected type/format
- Watch on inactive scene: Graceful no-op

---

## 5. E2E Test Coverage

New test file: `e2e/debug-api.spec.js`

| Test | Description |
|------|-------------|
| `game.debug.state()` returns object | Verify state structure |
| `game.debug.level(N)` changes level | Set level 5, verify via state |
| `game.debug.watch('hp')` outputs continuously | Monitor for 2 seconds |
| `game.debug.skill('Q')` executes | Verify cooldown starts |
| `game.debug.spawn('shark', 2)` creates enemies | Count enemies before/after |
| `game.debug.help()` prints commands | Verify non-empty output |

---

## 6. Out of Scope

- Non-debug mode exposure (security)
- Remote/network debugging
- Mobile/touch support for debug UI

---

## 7. Acceptance Criteria

1. `?debug=true` exposes `window.game.debug` with all methods in Console
2. `game.debug.state()` returns current hp, maxHp, level, score, wave
3. `game.debug.level(5)` actually changes player level to 5
4. `game.debug.watch('hp')` outputs hp every 500ms until `unwatch()`
5. `game.debug.skill('Q')` triggers bite skill
6. `game.debug.spawn('shark', 3)` adds 3 sharks to the game
7. All existing E2E smoke tests still pass
8. No debug code runs when `?debug` is not set