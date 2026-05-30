# feat-044 Type Effectiveness Activation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `strongAgainst`/`weakTo` in `fish.json` actively affect combat: eat thresholds change by type, damage multipliers apply on both attack directions, enemy AI breaks ties using type, and dead `BattleSystem.canAttack` is deleted.

**Architecture:** Read explicit `damageMultiplierVsStrong/VsWeak` and `sizeThresholdVsStrong/VsWeak` from fish.json. Compute multiplier at runtime using bidirectional type check. Delete dead `BattleSystem.canAttack`.

**Tech Stack:** Phaser.js 3.x · Jest

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/config/fish.json` | Add 4 new fields per fish entry |
| `src/systems/CollisionSystem.js` | Dynamic `playerType`, variable eat threshold |
| `src/systems/BattleSystem.js` | Delete dead `canAttack`, add `getTypeMultiplier()` |
| `src/entities/Enemy.js` | `attackPlayer` reads `player.fishType`, tie-breaking |
| `src/scenes/GameScene.js` | Pass actual `playerType` to CollisionSystem, glow reads dynamic type |
| `src/systems/__tests__/CollisionSystem.test.js` | Add type multiplier + variable threshold tests |
| `src/entities/__tests__/Enemy.test.js` | Add type multiplier tests for `attackPlayer` |

---

## Task 1: Extend fish.json with type effectiveness fields

**Files:**
- Modify: `src/config/fish.json` (all non-boss fish entries)
- Test: `src/systems/__tests__/CollisionSystem.test.js`

### Damage multiplier fields (per fish)
For every non-boss fish entry that has `strongAgainst` or `weakTo`, add:

```json
"damageMultiplierVsStrong": 2.0,
"damageMultiplierVsWeak": 0.5,
"sizeThresholdVsStrong": 1.5,
"sizeThresholdVsWeak": 1.2
```

**Rules:**
- `damageMultiplierVsStrong` = 进攻方克制我时，我对进攻方的伤害倍率（进攻方打我更痛，所以我要减少伤害输出？）
- Wait — confirmed direction: attacker strongAgainst defender → attacker deals **2.0x** damage. So if the **enemy** is strong against the **player**, the enemy deals **2.0x** damage to the player. If the **player** is strong against the enemy, the player deals **2.0x** damage to the enemy.

| Field | When to apply | Value |
|-------|--------------|-------|
| `damageMultiplierVsStrong` | attacker strongAgainst defender | **2.0** |
| `damageMultiplierVsWeak` | attacker weakTo defender | **0.5** |
| `sizeThresholdVsStrong` | defender strongAgainst attacker, attacker tries to eat | **1.5** (must be 50% bigger) |
| `sizeThresholdVsWeak` | defender weakTo attacker, attacker tries to eat | **1.2** (standard) |

For **neutral** (neither strongAgainst/weakTo): `damageMultiplier = 1.0`, `sizeThreshold = 1.2`.

### fish.json entries to update (examples)
```json
"shark": {
  "strongAgainst": ["clownfish"],
  "weakTo": [],
  "damageMultiplierVsStrong": 2.0,
  "damageMultiplierVsWeak": 0.5,
  "sizeThresholdVsStrong": 1.5,
  "sizeThresholdVsWeak": 1.2,
  ...
}
```

- [ ] **Step 1: Add fields to shark, clownfish, shrimp, anglerfish, jellyfish, seahorse, octopus, eel, mutant_shark, giant_jellyfish**
- [ ] **Step 2: Run existing tests to confirm no regression** — `npm test`

---

## Task 2: CollisionSystem — dynamic playerType + variable eat threshold

**Files:**
- Modify: `src/systems/CollisionSystem.js:59-118`
- Modify: `src/systems/__tests__/CollisionSystem.test.js`

The collision check currently hardcodes `playerType = 'clownfish'`. Need to make it accept `playerType` dynamically and apply variable size thresholds.

### 2a. Change CollisionSystem constructor to accept playerType

```js
// Current (hardcoded):
checkCollision(player, fish, playerData) {
  const playerType = 'clownfish'; // HARDCODED

// New:
checkCollision(player, fish, playerData, playerType) {
  const pt = playerType || player?.fishType || player?.playerData?.fishType || 'clownfish';
```

- [ ] **Step 1: Write failing test — checkCollision uses dynamic playerType**

```js
test('checkCollision uses actual playerType from player object', () => {
  const player = { fishType: 'shark', playerData: { size: 50 } };
  const fish = createMockFish(30, 'clownfish'); // clownfish weakTo shark
  const result = cs.checkCollision(player, fish, player.playerData);
  // clownfish weakTo shark → player strongAgainst clownfish → eat threshold = 1.2 (not 1.5)
  expect(result.canEat).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails** — Expected: `canEat` is wrong because hardcoded `'clownfish'` ignores shark's `weakTo`
- [ ] **Step 3: Change CollisionSystem to read `playerType` from `player.fishType` or `player.playerData?.fishType`**
- [ ] **Step 4: Run test to verify it passes** — Expected: PASS
- [ ] **Step 5: Commit**

### 2b. Add variable eat threshold tests

- [ ] **Step 1: Write failing test — strongAgainst target requires 1.5x threshold**

```js
test('eat blocked when player size < fishSize * 1.5 even if player strongAgainst fish', () => {
  // shark strongAgainst clownfish, player is shark (size=30), fish is clownfish (size=30)
  // 30 > 30 * 1.5? 30 > 45? false → blocked
  const cs = new CollisionSystem({ scene: {}, player, fishData: FISH_DATA });
  const result = cs.checkCollision(playerShark(30), fishClownfish(30));
  expect(result.type).toBe('blocked');
});

test('eat allowed when player size >= fishSize * 1.5 and fish strongAgainst player', () => {
  // same but player size=50, fish size=30: 50 > 45 → allowed
  const result = cs.checkCollision(playerShark(50), fishClownfish(30));
  expect(result.type).toBe('eat');
});
```

- [ ] **Step 2: Run tests — Expected: FAIL (current code has no 1.5x threshold)
- [ ] **Step 3: Implement threshold logic:**
  - If fish `strongAgainst` player → use `sizeThresholdVsStrong` (1.5)
  - If player `strongAgainst` fish → use `sizeThresholdVsWeak` (1.2)
  - Neutral → use 1.2
- [ ] **Step 4: Run tests — Expected: PASS
- [ ] **Step 5: Commit

### 2c. Add damage multiplier application (for player eating fish → exp/score bonus)

The `expGain` in the eat result should reflect type advantage.

- [ ] **Step 1: Write test — expGain × damageMultiplier when type effective**

```js
test('eat result expGain is multiplied by damageMultiplierVsStrong', () => {
  // Player is shark (strongAgainst clownfish), clownfish weakTo shark → multiplier=2.0
  // Base exp=10 → multiplied exp=20
  const result = cs.checkCollision(playerShark(50), fishClownfish(30));
  expect(result.expGain).toBe(20); // 10 * 2.0
});
```

- [ ] **Step 2: Run test — Expected: FAIL (current expGain doesn't multiply)
- [ ] **Step 3: Implement — after eat is confirmed, compute multiplier and multiply expGain
- [ ] **Step 4: Run test — Expected: PASS
- [ ] **Step 5: Commit**

---

## Task 3: BattleSystem — add getTypeMultiplier + delete canAttack

**Files:**
- Modify: `src/systems/BattleSystem.js`
- Modify: `src/systems/__tests__/BattleSystem.test.js` (extend existing)

### 3a. Add getTypeMultiplier(attackerType, defenderType)

```js
/**
 * Get type effectiveness multiplier for attacker vs defender
 * @param {string} attackerType
 * @param {string} defenderType
 * @returns {number} 2.0 | 0.5 | 1.0
 */
getTypeMultiplier(attackerType, defenderType) {
    const attackerData = this.fishData[attackerType];
    const defenderData = this.fishData[defenderType];
    if (!attackerData || !defenderData) return 1.0;

    // Attacker strong against defender → 2.0x
    if (attackerData.strongAgainst?.includes(defenderType)) return 2.0;
    // Attacker weak to defender → 0.5x
    if (attackerData.weakTo?.includes(defenderType)) return 0.5;
    return 1.0;
}
```

- [ ] **Step 1: Write failing test — getTypeMultiplier returns 2.0 when attacker strongAgainst defender**

```js
test('getTypeMultiplier returns 2.0 when attacker strongAgainst defender', () => {
    const bs = new BattleSystem({ fishData: FISH_DATA });
    expect(bs.getTypeMultiplier('shark', 'clownfish')).toBe(2.0);
});

test('getTypeMultiplier returns 0.5 when attacker weakTo defender', () => {
    expect(bs.getTypeMultiplier('clownfish', 'shark')).toBe(0.5);
});

test('getTypeMultiplier returns 1.0 when neutral', () => {
    expect(bs.getTypeMultiplier('shark', 'anglerfish')).toBe(1.0);
});
```

- [ ] **Step 2: Run tests — Expected: FAIL (method doesn't exist)
- [ ] **Step 3: Implement getTypeMultiplier
- [ ] **Step 4: Run tests — Expected: PASS
- [ ] **Step 5: Commit**

### 3b. Delete canAttack (dead code)

- [ ] **Step 1: Confirm no callers of BattleSystem.canAttack in codebase** — `grep -r "canAttack" src/`
- [ ] **Step 2: Delete the canAttack method from BattleSystem.js
- [ ] **Step 3: Run tests — Expected: PASS (no callers to break)
- [ ] **Step 4: Commit** "refactor: remove dead canAttack method"

---

## Task 4: Enemy.attackPlayer — dynamic playerType + type multiplier

**Files:**
- Modify: `src/entities/Enemy.js:276-290`
- Modify: `src/entities/__tests__/Enemy.test.js`

Currently hardcodes `'clownfish'`:
```js
if (this.fishConfig.strongAgainst?.includes('clownfish')) { typeMultiplier = 1.5; }
```

Change to read `player.fishType` dynamically:
```js
const playerFishType = player?.fishType;
if (playerFishType) {
    const multiplier = this.scene.battleSystem?.getTypeMultiplier(this.fishType, playerFishType);
    typeMultiplier = multiplier ?? 1.0;
}
```

- [ ] **Step 1: Write failing test — attackPlayer uses actual player fishType, returns 2.0x when player weakTo enemy**

```js
test('attackPlayer deals 2.0x damage when player weakTo enemy type', () => {
    // Player is clownfish (weakTo anglerfish), anglerfish strongAgainst clownfish
    const enemy = createEnemy('anglerfish', { size: 40 });
    const player = { fishType: 'clownfish', playerData: { size: 30 } };
    const damage = enemy.attackPlayer(player);
    // anglerfish strongAgainst clownfish → 2.0x multiplier
    // Base damage for size=40 → ~17 → 2.0x → ~34
    expect(damage).toBeGreaterThan(30);
});

test('attackPlayer deals 0.5x damage when player strongAgainst enemy type', () => {
    // Player is shark (strongAgainst clownfish), clownfish weakTo shark
    const enemy = createEnemy('clownfish', { size: 40 });
    const player = { fishType: 'shark', playerData: { size: 30 } };
    const damage = enemy.attackPlayer(player);
    expect(damage).toBeLessThan(15); // ~17 * 0.5 < ~9
});
```

- [ ] **Step 2: Run tests — Expected: FAIL (hardcoded 'clownfish' + no dynamic type)
- [ ] **Step 3: Implement — read `player.fishType`, call `scene.battleSystem.getTypeMultiplier()` (or inline lookup using fishData)
- [ ] **Step 4: Run tests — Expected: PASS
- [ ] **Step 5: Commit**

---

## Task 5: Enemy.updateFishing — tie-breaking by type preference

**Files:**
- Modify: `src/entities/Enemy.js:427-500`
- Test: `src/entities/__tests__/Enemy.test.js`

When two candidate prey are within `±10%` of each other in size, prefer the one the enemy is strongAgainst (is predator to).

- [ ] **Step 1: Write failing test — updateFishing breaks tie using type**

```js
test('updateFishing prefers prey enemy is strongAgainst when size tie within ±10%', () => {
    // Enemy is anglerfish (strongAgainst clownfish, weakTo shark)
    // Candidates: clownfish(size=30) and shark(size=32) — within 10%
    // Should pick clownfish
    const enemy = createEnemy('anglerfish', { size: 35 });
    const candidates = [
        createMockFishSprite('clownfish', 30),
        createMockFishSprite('shark', 32),
    ];
    enemy.updateFishing(candidates);
    expect(enemy.fishingTarget?.fishType).toBe('clownfish');
});

test('updateFishing falls back to larger size when no type advantage', () => {
    // shark vs shrimp (no relationship) — should pick larger
    const enemy = createEnemy('shark', { size: 35 });
    const candidates = [
        createMockFishSprite('shrimp', 25),
        createMockFishSprite('jellyfish', 40), // jellyfish bigger
    ];
    enemy.updateFishing(candidates);
    expect(enemy.fishingTarget?.fishType).toBe('jellyfish');
});
```

- [ ] **Step 2: Run tests — Expected: FAIL (current code only checks size)
- [ ] **Step 3: Implement tie-breaking: filter candidates within `±10%` of each other, prefer one enemy is strongAgainst, otherwise pick larger
- [ ] **Step 4: Run tests — Expected: PASS
- [ ] **Step 5: Commit**

---

## Task 6: GameScene — pass dynamic playerType to CollisionSystem, fix glow hint

**Files:**
- Modify: `src/scenes/GameScene.js`
- Test: manual E2E verification

### 6a. Pass playerType to CollisionSystem

CollisionSystem needs the actual player fishType. GameScene stores it at `this.fishType`.

```js
// In _handleCollisionResult or wherever CollisionSystem is instantiated:
this.collisionSystem = new CollisionSystem({
    scene: this,
    player: this.player,
    playerType: this.fishType, // ADD THIS
    // ...
});
```

- [ ] **Step 1: Find where CollisionSystem is instantiated in GameScene
- [ ] **Step 2: Add `playerType: this.fishType` to constructor options
- [ ] **Step 3: Run tests — Expected: PASS
- [ ] **Step 4: Commit**

### 6b. Fix glow hint (currently hardcodes 'clownfish')

Line ~L987 in GameScene:
```js
enemy.fishConfig.strongAgainst?.includes('clownfish')  // HARDCODED
```

Change to:
```js
enemy.fishConfig.strongAgainst?.includes(this.fishType)
```

- [ ] **Step 1: Find and fix the hardcoded 'clownfish' reference
- [ ] **Step 2: Run tests — Expected: PASS
- [ ] **Step 3: Commit**

---

## Task 7: E2E Verification

**Files:** Manual browser test

- [ ] **Step 1: Start server — `python3 -m http.server 8765 &`
- [ ] **Step 2: Open Playwright browser, navigate to `http://localhost:8765/index.html`**
- [ ] **Step 3: Click 游客模式 → 确认游戏加载正常，wave state 正常**
- [ ] **Step 4: 验证 eat damage multiplier — 吃克制鱼时经验值×2（Console log 或视觉确认）
- [ ] **Step 5: 验证吃强敌需要更大体型 — 尝试用小体型吃大鱼被 block**
- [ ] **Step 6: Console 无 JS Error — Expected: 只有 favicon.ico 404**
- [ ] **Step 7: Commit with E2E evidence in message

---

## Task 8: Final regression + clean state

- [ ] **Step 1: `./init.sh` — Expected: 850+ tests pass
- [ ] **Step 2: Update `feature_list.json` — set feat-044 status: "completed", evidence field filled
- [ ] **Step 3: Update `progress.md` — add feat-044 session log
- [ ] **Step 4: Commit
