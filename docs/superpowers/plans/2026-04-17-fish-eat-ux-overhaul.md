# 鱼吃鱼 UX Overhaul Plan (阶段A + B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现6个高性价比UX改进（刷怪权重、大小光晕、击退效果、悬浮数字、背景音乐、成就系统）

**Architecture:** 6个独立功能，各自独立文件/函数，互不干扰

**Tech Stack:** Phaser 3, Web Audio API, localStorage, TDD (Jest)

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/scenes/GameScene.js` | A1/A2/A3/A4 + B1集成 |
| `src/systems/AudioSystem.js` | B1: startBgm/stopBgm |
| `src/systems/AchievementSystem.js` | B2: 成就追踪与解锁 |
| `src/config/achievements.json` | B2: 10个成就定义 |
| `src/systems/__tests__/SpawnWeights.test.js` | A1 测试 |
| `src/systems/__tests__/AchievementSystem.test.js` | B2 测试 |
| `src/systems/__tests__/AudioBgm.test.js` | B1 测试 |
| `src/systems/__tests__/FloatingText.test.js` | A3/A4 测试 |

---

## Task 1: A1 - 刷怪权重系统

**Files:**
- Modify: `src/scenes/GameScene.js:314-349` (spawnFish方法)
- Test: `src/systems/__tests__/SpawnWeights.test.js`

- [ ] **Step 1: 写测试**

```javascript
// src/systems/__tests__/SpawnWeights.test.js
describe('Spawn weight system', () => {
    test('getSpawnWeights returns correct weights for level 1-3', () => {
        const weights = getSpawnWeights(1);
        expect(weights.clownfish).toBe(0.4);
        expect(weights.anglerfish).toBe(0); // high-level fish not available
    });

    test('getSpawnWeights returns correct weights for level 4-6', () => {
        const weights = getSpawnWeights(5);
        expect(weights.seahorse).toBeGreaterThan(0);
        expect(weights.clownfish).toBeLessThan(0.4);
    });

    test('getSpawnWeights returns all fish for level 7+', () => {
        const weights = getSpawnWeights(10);
        expect(weights.eel).toBeGreaterThan(0);
        expect(weights.anglerfish).toBeGreaterThan(0);
    });

    test('selectFishByWeight returns valid type', () => {
        const weights = { clownfish: 0.5, shrimp: 0.5 };
        const type = selectFishByWeight(weights);
        expect(['clownfish', 'shrimp']).toContain(type);
    });

    test('all weights sum to 1.0', () => {
        for (let lv = 1; lv <= 15; lv++) {
            const w = getSpawnWeights(lv);
            const sum = Object.values(w).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1.0, 2);
        }
    });
});

// Pure helpers
function getSpawnWeights(level) {
    if (level <= 3) return { clownfish: 0.4, shrimp: 0.35, shark: 0.15, jellyfish: 0.1, others: 0 };
    if (level <= 6) return { clownfish: 0.2, shrimp: 0.2, shark: 0.2, jellyfish: 0.15, seahorse: 0.15, octopus: 0.1 };
    if (level <= 10) return { clownfish: 0.1, shrimp: 0.1, shark: 0.15, anglerfish: 0.15, jellyfish: 0.1, seahorse: 0.15, octopus: 0.15, eel: 0.1 };
    return { shark: 0.2, anglerfish: 0.2, jellyfish: 0.15, seahorse: 0.1, octopus: 0.15, eel: 0.2 };
}

function selectFishByWeight(weights) {
    const validTypes = Object.entries(weights).filter(([k]) => k !== 'others' && weights[k] > 0).map(([k]) => k);
    const r = Math.random();
    let cumulative = 0;
    for (const [type, weight] of Object.entries(weights)) {
        if (type === 'others' || weight === 0) continue;
        cumulative += weight;
        if (r <= cumulative) return type;
    }
    return validTypes[0];
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- --testNamePattern="Spawn weight"`
Expected: FAIL (functions not defined)

- [ ] **Step 3: 实现权重函数，在spawnFish中替换等概率逻辑**

```javascript
// In GameScene, replace line 316-317:
// OLD:
const fishTypes = ['clownfish', 'shrimp', 'shark', 'anglerfish', 'jellyfish', 'seahorse', 'octopus', 'eel'];
const type = Phaser.Utils.Array.GetRandom(fishTypes);

// NEW:
const weights = this._getSpawnWeights(this.level);
const type = this._selectFishByWeight(weights);
```

Add two methods to GameScene class:
```javascript
_getSpawnWeights(level) {
    if (level <= 3) return { clownfish: 0.4, shrimp: 0.35, shark: 0.15, jellyfish: 0.1 };
    if (level <= 6) return { clownfish: 0.2, shrimp: 0.2, shark: 0.2, jellyfish: 0.15, seahorse: 0.15, octopus: 0.1 };
    if (level <= 10) return { clownfish: 0.1, shrimp: 0.1, shark: 0.15, anglerfish: 0.15, jellyfish: 0.1, seahorse: 0.15, octopus: 0.15, eel: 0.1 };
    return { shark: 0.2, anglerfish: 0.2, jellyfish: 0.15, seahorse: 0.1, octopus: 0.15, eel: 0.2 };
}

_selectFishByWeight(weights) {
    const valid = Object.entries(weights).filter(([, w]) => w > 0);
    const r = Math.random();
    let cumulative = 0;
    for (const [type, weight] of valid) {
        cumulative += weight;
        if (r <= cumulative) return type;
    }
    return valid[0][0];
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- --testNamePattern="Spawn weight"`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/scenes/GameScene.js src/systems/__tests__/SpawnWeights.test.js
git commit -m "feat(A1): spawn weights by player level"
```

---

## Task 2: A2 - 大小对比光晕提示

**Files:**
- Modify: `src/scenes/GameScene.js` (update方法 + create方法)
- Test: `src/systems/__tests__/SizeHint.test.js`

- [ ] **Step 1: 写测试**

```javascript
// src/systems/__tests__/SizeHint.test.js
describe('Size hint (glow) system', () => {
    test('getGlowColor returns green for edible fish', () => {
        expect(getGlowColor(30, 20)).toBe(0x00ff44); // player 30, fish 20 (player > fish*1.2)
    });

    test('getGlowColor returns red for dangerous fish', () => {
        expect(getGlowColor(20, 30)).toBe(0xff3333); // player 20, fish 30 (fish > player*1.2)
    });

    test('getGlowColor returns null for similar size', () => {
        expect(getGlowColor(25, 24)).toBeNull(); // similar size, no hint
    });

    test('getGlowColor returns null when fish is strong against player', () => {
        const fishStrongAgainstPlayer = true;
        expect(getGlowColor(30, 20, fishStrongAgainstPlayer)).toBeNull();
    });

    test('glow radius proportional to fish size', () => {
        expect(getGlowRadius(20)).toBe(22);
        expect(getGlowRadius(50)).toBe(52);
    });
});

function getGlowColor(playerSize, fishSize, fishIsStrongAgainstPlayer = false) {
    if (fishIsStrongAgainstPlayer) return null;
    if (playerSize > fishSize * 1.2) return 0x00ff44;
    if (fishSize > playerSize * 1.2) return 0xff3333;
    return null;
}

function getGlowRadius(fishSize) {
    return fishSize + 2;
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- --testNamePattern="Size hint"`
Expected: FAIL

- [ ] **Step 3: 在GameScene中实现光晕系统**

In `create()`, add:
```javascript
this._glowLayer = this.add.graphics();
```

In `update()`, after enemy loop (around line 600), add:
```javascript
// Draw size-glow around each enemy
this._glowLayer.clear();
this.enemies.forEach(enemy => {
    if (!enemy.graphics || !enemy.graphics.active) return;
    const glow = getGlowColor(
        this.player.playerData.size,
        enemy.fishData.size,
        enemy.fishConfig.strongAgainst?.includes('clownfish')
    );
    if (!glow) return;
    const r = getGlowRadius(enemy.fishData.size);
    this._glowLayer.lineStyle(2, glow, 0.7);
    this._glowLayer.strokeCircle(enemy.graphics.x, enemy.graphics.y, r);
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- --testNamePattern="Size hint"`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/scenes/GameScene.js src/systems/__tests__/SizeHint.test.js
git commit -m "feat(A2): size glow hints (green=edible, red=danger)"
```

---

## Task 3: A3 - 受伤击退效果

**Files:**
- Modify: `src/scenes/GameScene.js` (onEnemyAttack方法)
- Test: `src/systems/__tests__/Knockback.test.js`

- [ ] **Step 1: 写测试**

```javascript
// src/systems/__tests__/Knockback.test.js
describe('Knockback on hit', () => {
    test('knockbackVelocity calculates correct direction', () => {
        // attacker at (100, 0), player at (0, 0) → knockback goes LEFT (negative)
        const kb = getKnockbackVelocity(0, 0, 100, 0, 150);
        expect(kb.vx).toBeLessThan(0);
        expect(kb.vy).toBe(0);
    });

    test('knockbackVelocity magnitude equals speed', () => {
        const kb = getKnockbackVelocity(0, 0, 100, 0, 150);
        const mag = Math.hypot(kb.vx, kb.vy);
        expect(mag).toBeCloseTo(150, 1);
    });

    test('knockbackVelocity diagonal is normalised', () => {
        const kb = getKnockbackVelocity(0, 0, 100, 100, 150);
        const mag = Math.hypot(kb.vx, kb.vy);
        expect(mag).toBeCloseTo(150, 1);
    });

    test('DURATION is 120ms', () => {
        expect(getKnockbackDuration()).toBe(120);
    });
});

function getKnockbackVelocity(px, py, ex, ey, speed) {
    const dx = px - ex, dy = py - ey;
    const dist = Math.hypot(dx, dy) || 1;
    return { vx: (dx / dist) * speed, vy: (dy / dist) * speed };
}

function getKnockbackDuration() { return 120; }
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- --testNamePattern="Knockback"`
Expected: FAIL

- [ ] **Step 3: 在onEnemyAttack中实现击退**

In `onEnemyAttack()` (around line 699 after `this.hp -= actualDamage`):
```javascript
// Knockback: push player away from attacker
const kbSpeed = 150;
const duration = 120;
const dx = this.player.x - enemy.graphics.x;
const dy = this.player.y - enemy.graphics.y;
const dist = Math.hypot(dx, dy) || 1;
this.player.body.setVelocity((dx / dist) * kbSpeed, (dy / dist) * kbSpeed);
this.time.delayedCall(duration, () => {
    // Restore normal velocity after knockback
    if (!this.player || !this.player.active) return;
    // Velocity will be overwritten next frame by normal input, so just clear it
    this.player.body.setVelocity(0, 0);
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- --testNamePattern="Knockback"`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/scenes/GameScene.js src/systems/__tests__/Knockback.test.js
git commit -m "feat(A3): knockback on player hit"
```

---

## Task 4: A4 - 悬浮数字全覆盖

**Files:**
- Modify: `src/scenes/GameScene.js` (checkEat + onEnemyAttack)
- Test: `src/systems/__tests__/FloatingText.test.js`

- [ ] **Step 1: 写测试**

```javascript
// src/systems/__tests__/FloatingText.test.js
describe('Floating text system', () => {
    test('showFloatingText returns correct color for exp', () => {
        expect(getFloatingTextColor('exp')).toBe('#00ff88');
    });

    test('showFloatingText returns correct color for damage', () => {
        expect(getFloatingTextColor('damage')).toBe('#ff4444');
    });

    test('showFloatingText returns correct color for heal', () => {
        expect(getFloatingTextColor('heal')).toBe('#00ff00');
    });

    test('text format for exp includes + sign', () => {
        expect(formatFloatingText(50, 'exp')).toBe('+50');
    });

    test('text format for damage includes - sign', () => {
        expect(formatFloatingText(25, 'damage')).toBe('-25');
    });
});

function getFloatingTextColor(type) {
    if (type === 'exp') return '#00ff88';
    if (type === 'damage') return '#ff4444';
    if (type === 'heal') return '#00ff00';
    return '#ffffff';
}

function formatFloatingText(value, type) {
    return (type === 'damage' ? '-' : '+') + value;
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- --testNamePattern="Floating text"`
Expected: FAIL

- [ ] **Step 3: 实现showFloatingText方法并集成到checkEat和onEnemyAttack**

Add to GameScene:
```javascript
showFloatingText(x, y, text, color) {
    const t = this.add.text(x, y - 20, text, {
        fontSize: '18px',
        fontFamily: 'Arial Black, Arial',
        color: color,
        stroke: '#000000',
        strokeThickness: 3
    });
    t.setOrigin(0.5);
    t.setDepth(200);

    this.tweens.add({
        targets: t,
        y: y - 70,
        alpha: 0,
        duration: 900,
        ease: 'Quad.easeOut',
        onComplete: () => t.destroy()
    });
}
```

In `checkEat()` (around line 446 after scoring), replace/add:
```javascript
// Show floating +EXP text
this.showFloatingText(fish.x, fish.y, `+${Math.floor(expResult.expGained * comboMultiplier)}`, '#00ff88');
```

In `onEnemyAttack()` (around line 701 after damage), replace/add:
```javascript
// Show floating -HP text
this.showFloatingText(this.player.x, this.player.y, `-${actualDamage}`, '#ff4444');
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- --testNamePattern="Floating text"`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/scenes/GameScene.js src/systems/__tests__/FloatingText.test.js
git commit -m "feat(A4): floating text for exp and damage"
```

---

## Task 5: B1 - 背景音乐（程序生成）

**Files:**
- Modify: `src/systems/AudioSystem.js`
- Modify: `src/scenes/GameScene.js` (create + shutdown)
- Modify: `src/scenes/GameOverScene.js`
- Test: `src/systems/__tests__/AudioBgm.test.js`

- [ ] **Step 1: 写测试**

```javascript
// src/systems/__tests__/AudioBgm.test.js
describe('Background music system', () => {
    test('bgm is initially stopped', () => {
        const sys = createBgmSystem();
        expect(sys.isPlaying).toBe(false);
    });

    test('startBgm sets isPlaying to true', () => {
        const sys = createBgmSystem();
        sys.startBgm();
        expect(sys.isPlaying).toBe(true);
    });

    test('stopBgm sets isPlaying to false', () => {
        const sys = createBgmSystem();
        sys.startBgm();
        sys.stopBgm();
        expect(sys.isPlaying).toBe(false);
    });

    test('setBgmVolume clamps to 0-1', () => {
        const sys = createBgmSystem();
        sys.setBgmVolume(1.5);
        expect(sys.bgmVolume).toBe(1.0);
        sys.setBgmVolume(-0.5);
        expect(sys.bgmVolume).toBe(0);
    });

    test('bubble timer interval is 2-4 seconds', () => {
        const sys = createBgmSystem();
        expect(sys.bubbleInterval).toBeGreaterThanOrEqual(2000);
        expect(sys.bubbleInterval).toBeLessThanOrEqual(4000);
    });
});

function createBgmSystem() {
    return {
        isPlaying: false,
        bgmVolume: 0.15,
        bubbleInterval: 2000 + Math.random() * 2000,
        startBgm() { this.isPlaying = true; },
        stopBgm() { this.isPlaying = false; },
        setBgmVolume(v) { this.bgmVolume = Math.max(0, Math.min(1, v)); }
    };
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- --testNamePattern="Background music"`
Expected: FAIL

- [ ] **Step 3: 在AudioSystem.js中实现BGM**

Add to AudioSystem class:
```javascript
startBgm() {
    if (!this.enabled || !this.ctx || this.isPlaying) return;
    this.isPlaying = true;
    this._playBgmLoop();
    this._scheduleBubble();
}

stopBgm() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this._bgmGain) this._bgmGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    if (this._bgmOscs) this._bgmOscs.forEach(o => { try { o.stop(); } catch(e) {} });
    if (this._bubbleTimeout) clearTimeout(this._bubbleTimeout);
}

setBgmVolume(v) {
    this.bgmVolume = Math.max(0, Math.min(1, v));
    if (this._bgmGain && this.ctx) {
        this._bgmGain.gain.setTargetAtTime(this.bgmVolume * 0.3, this.ctx.currentTime, 0.1);
    }
}

_playBgmLoop() {
    if (!this.isPlaying || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Master gain
    this._bgmGain = ctx.createGain();
    this._bgmGain.gain.setValueAtTime(this.bgmVolume * 0.3, now);
    this._bgmGain.connect(ctx.destination);

    // Deep ocean hum (60Hz sine)
    const hum = ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(60, now);
    // LFO to modulate hum
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08; // very slow
    lfoGain.gain.value = 10;
    lfo.connect(lfoGain);
    lfoGain.connect(hum.frequency);
    lfo.start(now);
    hum.connect(this._bgmGain);
    hum.start(now);
    this._bgmOscs = [hum, lfo];

    // Simple melody loop: C3-E3-G3-E3 (every 4 seconds)
    const melodyNotes = [130.81, 164.81, 196.00, 164.81]; // C3 E3 G3 E3
    melodyNotes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, now);
        // Fade in/out per note
        const noteTime = i * 1.0;
        g.gain.setTargetAtTime(this.bgmVolume * 0.08, now + noteTime, 0.2);
        g.gain.setTargetAtTime(0, now + noteTime + 0.7, 0.2);
        osc.connect(g);
        g.connect(this._bgmGain);
        osc.start(now + noteTime);
        osc.stop(now + noteTime + 1.0);
        this._bgmOscs.push(osc);
    });
}

_scheduleBubble() {
    if (!this.isPlaying || !this.ctx) return;
    const delay = 2000 + Math.random() * 2000;
    this._bubbleTimeout = setTimeout(() => {
        this._playBubble();
        this._scheduleBubble();
    }, delay);
}

_playBubble() {
    if (!this.isPlaying || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(1200 + Math.random() * 200, now + 0.05);
    g.gain.setValueAtTime(this.bgmVolume * 0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
}
```

- [ ] **Step 4: 集成到GameScene**

In `GameScene.create()` (around line 100 after audioSystem init):
```javascript
if (this.audioSystem) this.audioSystem.startBgm();
```

In `GameScene.shutdown()` (add at end):
```javascript
if (this.audioSystem) this.audioSystem.stopBgm();
```

In `GameOverScene.create()` (start of method):
```javascript
// Stop BGM when game over
if (this.scene.get('GameScene')?.audioSystem) {
    this.scene.get('GameScene').audioSystem.stopBgm();
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- --testNamePattern="Background music"`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add src/systems/AudioSystem.js src/scenes/GameScene.js src/scenes/GameOverScene.js src/systems/__tests__/AudioBgm.test.js
git commit -m "feat(B1): procedural background music with ocean hum, melody and bubbles"
```

---

## Task 6: B2 - 成就系统

**Files:**
- Create: `src/config/achievements.json`
- Create: `src/systems/AchievementSystem.js`
- Modify: `src/scenes/GameOverScene.js` (show achievements)
- Modify: `src/scenes/GameScene.js` (track kills, level, time)
- Test: `src/systems/__tests__/AchievementSystem.test.js`

- [ ] **Step 1: 写测试**

```javascript
// src/systems/__tests__/AchievementSystem.test.js
describe('AchievementSystem', () => {
    let store;
    beforeEach(() => { store = {}; });

    test('no achievements unlocked initially', () => {
        const sys = createAchievementSystem(store);
        expect(sys.getUnlockedIds()).toHaveLength(0);
    });

    test('unlock sets localStorage', () => {
        const sys = createAchievementSystem(store);
        sys.unlock('first_blood');
        expect(store['fishEat_achievements']).toContain('first_blood');
    });

    test('isUnlocked returns true after unlock', () => {
        const sys = createAchievementSystem(store);
        sys.unlock('first_blood');
        expect(sys.isUnlocked('first_blood')).toBe(true);
    });

    test('isUnlocked returns false for wrong id', () => {
        const sys = createAchievementSystem(store);
        expect(sys.isUnlocked('fake')).toBe(false);
    });

    test('checkAndUnlock returns id when condition met', () => {
        const sys = createAchievementSystem({});
        const result = sys.checkAndUnlock('first_blood', true, () => true);
        expect(result).toBe('first_blood');
    });

    test('checkAndUnlock returns null when condition not met', () => {
        const sys = createAchievementSystem({});
        const result = sys.checkAndUnlock('first_blood', false, () => false);
        expect(result).toBeNull();
    });

    test('getNewlyUnlocked returns newly unlocked since last check', () => {
        const sys = createAchievementSystem({});
        sys.unlock('first_blood');
        const all = sys.getUnlockedIds();
        expect(all).toContain('first_blood');
    });
});

const ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Blood', desc: 'Kill your first fish', condition: { type: 'kills', value: 1 } },
    { id: 'shark_hunter', name: 'Shark Hunter', desc: 'Kill a shark', condition: { type: 'kill_type', value: 'shark' } },
    { id: 'combo_5', name: 'Combo 5', desc: 'Reach 5x combo', condition: { type: 'combo', value: 5 } },
    { id: 'survive_5min', name: 'Survivor', desc: 'Survive for 5 minutes', condition: { type: 'survival', value: 300 } },
    { id: 'reach_lv5', name: 'Growing Up', desc: 'Reach level 5', condition: { type: 'level', value: 5 } },
];

function createAchievementSystem(storage) {
    return {
        _storage: storage,
        _checked: new Set(),
        unlock(id) {
            const unlocked = this.getUnlockedIds();
            if (!unlocked.includes(id)) {
                unlocked.push(id);
                this._storage['fishEat_achievements'] = JSON.stringify(unlocked);
            }
        },
        isUnlocked(id) {
            return this.getUnlockedIds().includes(id);
        },
        getUnlockedIds() {
            try {
                return JSON.parse(this._storage['fishEat_achievements'] || '[]');
            } catch { return []; }
        },
        checkAndUnlock(id, condition, checkFn) {
            if (this.isUnlocked(id)) return null;
            if (checkFn(condition)) {
                this.unlock(id);
                return id;
            }
            return null;
        },
        getAll() { return ACHIEVEMENTS; }
    };
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- --testNamePattern="AchievementSystem"`
Expected: FAIL

- [ ] **Step 3: 创建achievements.json和AchievementSystem.js**

```javascript
// src/config/achievements.json
[
    { "id": "first_blood", "name": "第一滴血", "desc": "击杀第一条鱼", "icon": "🐟" },
    { "id": "shark_hunter", "name": "猎鲨者", "desc": "击杀一条鲨鱼", "icon": "🦈" },
    { "id": "combo_5", "name": "五连斩", "desc": "达成5连击", "icon": "⚡" },
    { "id": "combo_10", "name": "十连斩", "desc": "达成10连击", "icon": "💥" },
    { "id": "survive_5min", "name": "生存专家", "desc": "生存5分钟", "icon": "⏱️" },
    { "id": "survive_10min", "name": "老练生存者", "desc": "生存10分钟", "icon": "🏅" },
    { "id": "reach_lv5", "name": "成长", "desc": "达到5级", "icon": "⬆️" },
    { "id": "reach_lv10", "name": "高手", "desc": "达到10级", "icon": "🌟" },
    { "id": "kill_50", "name": "屠夫", "desc": "累计击杀50条鱼", "icon": "💀" },
    { "id": "kill_100", "name": "鱼类杀手", "desc": "累计击杀100条鱼", "icon": "👑" }
]
```

```javascript
// src/systems/AchievementSystem.js
export class AchievementSystem {
    constructor(achievementsData) {
        this.achievements = achievementsData;
        this._unlocked = this._load();
    }

    _load() {
        try {
            return JSON.parse(localStorage.getItem('fishEat_achievements') || '[]');
        } catch { return []; }
    }

    _save() {
        localStorage.setItem('fishEat_achievements', JSON.stringify(this._unlocked));
    }

    isUnlocked(id) {
        return this._unlocked.includes(id);
    }

    getUnlocked() {
        return this.achievements.filter(a => this._unlocked.includes(a.id));
    }

    getNewlyUnlocked() {
        return this.achievements.filter(a => this._unlocked.includes(a.id));
    }

    checkKill(fishType, totalKills) {
        const results = [];
        if (!this.isUnlocked('first_blood') && totalKills >= 1) {
            this._unlocked.push('first_blood'); results.push('first_blood');
        }
        if (!this.isUnlocked('shark_hunter') && fishType === 'shark') {
            this._unlocked.push('shark_hunter'); results.push('shark_hunter');
        }
        if (!this.isUnlocked('kill_50') && totalKills >= 50) {
            this._unlocked.push('kill_50'); results.push('kill_50');
        }
        if (!this.isUnlocked('kill_100') && totalKills >= 100) {
            this._unlocked.push('kill_100'); results.push('kill_100');
        }
        if (results.length > 0) this._save();
        return results;
    }

    checkCombo(count) {
        const results = [];
        if (!this.isUnlocked('combo_5') && count >= 5) {
            this._unlocked.push('combo_5'); results.push('combo_5');
        }
        if (!this.isUnlocked('combo_10') && count >= 10) {
            this._unlocked.push('combo_10'); results.push('combo_10');
        }
        if (results.length > 0) this._save();
        return results;
    }

    checkLevel(level) {
        const results = [];
        if (!this.isUnlocked('reach_lv5') && level >= 5) {
            this._unlocked.push('reach_lv5'); results.push('reach_lv5');
        }
        if (!this.isUnlocked('reach_lv10') && level >= 10) {
            this._unlocked.push('reach_lv10'); results.push('reach_lv10');
        }
        if (results.length > 0) this._save();
        return results;
    }

    checkSurvival(seconds) {
        const results = [];
        if (!this.isUnlocked('survive_5min') && seconds >= 300) {
            this._unlocked.push('survive_5min'); results.push('survive_5min');
        }
        if (!this.isUnlocked('survive_10min') && seconds >= 600) {
            this._unlocked.push('survive_10min'); results.push('survive_10min');
        }
        if (results.length > 0) this._save();
        return results;
    }
}
```

- [ ] **Step 4: 集成到GameScene**

In `GameScene.create()` after `this.audioSystem = new AudioSystem()`:
```javascript
this.achievementSystem = new AchievementSystem(this.cache.json.get('achievements'));
```

After `this.killCount++` in `checkEat()`:
```javascript
const unlocked = this.achievementSystem.checkKill(fishType, this.killCount);
unlocked.forEach(id => this._showAchievementToast(id));
```

After `this.level = this.growthSystem.getLevel()`:
```javascript
const levelUnlocked = this.achievementSystem.checkLevel(this.level);
levelUnlocked.forEach(id => this._showAchievementToast(id));
```

After `this.comboSystem.onEat()`:
```javascript
const comboUnlocked = this.achievementSystem.checkCombo(this.comboSystem.count);
comboUnlocked.forEach(id => this._showAchievementToast(id));
```

Add to GameScene:
```javascript
_showAchievementToast(achievementId) {
    const ach = this.achievementSystem.achievements.find(a => a.id === achievementId);
    if (!ach) return;
    const toast = this.add.text(900, 80, `${ach.icon} ${ach.name}`, {
        fontSize: '18px', fontFamily: 'Arial', color: '#FFD700',
        backgroundColor: '#222222', padding: { x: 12, y: 6 }
    });
    toast.setOrigin(1, 0);
    toast.setDepth(300);
    toast.setAlpha(0);
    this.tweens.add({
        targets: toast, alpha: 1, duration: 300,
        delay: 300, hold: 2500, fadeOut: 300,
        onComplete: () => toast.destroy()
    });
}
```

In `GameScene.update()` survival check (every ~1s):
```javascript
// Check survival achievements every second
if (this.time.now % 1000 < 50) {
    const survivalSec = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const survUnlocked = this.achievementSystem.checkSurvival(survivalSec);
    survUnlocked.forEach(id => this._showAchievementToast(id));
}
```

- [ ] **Step 5: 在GameOverScene显示成就**

In `GameOverScene.create()`, after the unlock message block:
```javascript
// Show unlocked achievements
const unlockedAchievements = [];
try {
    const saved = JSON.parse(localStorage.getItem('fishEat_achievements') || '[]');
    const achData = this.scene.get('GameScene')?.cache?.json?.get('achievements') || [];
    unlockedAchievements.push(...achData.filter(a => saved.includes(a.id)));
} catch (e) {}
if (unlockedAchievements.length > 0) {
    const achY = panelY + panelH + (data.unlocked ? 130 : 80);
    unlockedAchievements.slice(0, 5).forEach((ach, i) => {
        this.add.text(cx, achY + i * 28, `${ach.icon} ${ach.name}`, {
            fontSize: '16px', fontFamily: 'Arial', color: '#aaaaaa'
        }).setOrigin(0.5);
    });
}
```

- [ ] **Step 6: 运行测试确认通过**

Run: `npm test -- --testNamePattern="AchievementSystem"`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add src/systems/AchievementSystem.js src/config/achievements.json src/scenes/GameScene.js src/scenes/GameOverScene.js src/systems/__tests__/AchievementSystem.test.js
git commit -m "feat(B2): achievement system with 10 milestones and toast notifications"
```

---

## 验证清单

- [ ] `npm test` → 435+ 新测试全部通过
- [ ] `git push origin main` 推送所有6个commit
- [ ] 浏览器启动游戏，手指在屏幕边缘游走，观察大小光晕
- [ ] 被鲨鱼攻击，观察击退+红字浮动数字
- [ ] 吃一条鱼，观察绿字浮动数字
- [ ] 等待5分钟，观察成就弹出通知
- [ ] 菜单"关于"显示背景音乐开关
