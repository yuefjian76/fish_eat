# feat-045 Skill Synergy System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a synergy combo layer to SkillSystem where certain skill sequences trigger powerful bonus effects.

**Architecture:** Data-driven synergy definitions in `skills.json`. `SkillSystem` maintains a `recentSkillQueue` (last 3s of skills used). `_checkSynergy()` detects matching patterns and executes their effects. Visual feedback via `FloatingTextSystem`.

**Tech Stack:** Phaser.js 3.x · Jest

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/config/skills.json` | Add synergies block with rush_bite and storm_slash definitions |
| `src/systems/SkillSystem.js` | `recentSkillQueue`, `_checkSynergy()`, synergy execution |
| `src/systems/__tests__/SkillSystem.test.js` | Add synergy detection and execution tests |
| `src/systems/FloatingTextSystem.js` | Show synergy name on activation (if not already) |

---

## Task 1: Extend skills.json with synergy definitions

**Files:**
- Modify: `src/config/skills.json`
- Test: `src/systems/__tests__/SkillSystem.test.js`

### Add synergies block to skills.json

Add at root level (after the `skills` array or as part of it):

```json
"synergies": {
  "rush_bite": {
    "name": "Rush Bite",
    "description": "E active + Q = 2x damage + knockback",
    "pattern": ["speedUp", "bite"],
    "windowMs": 3000,
    "effects": {
      "damageMultiplier": 2.0,
      "knockback": true
    }
  },
  "storm_slash": {
    "name": "Storm Slash",
    "description": "E->Q->E within 3s = Q cooldown reset, 3 consecutive bites",
    "pattern": ["speedUp", "bite", "speedUp"],
    "windowMs": 3000,
    "effects": {
      "cooldownReset": "bite",
      "bonusBites": 3
    }
  }
}
```

**Rules:**
- `pattern` array order matters — must match exactly in sequence
- `pattern` values must match the `id` field of skills in the skills array
- `windowMs` is the time window for the entire sequence (3 seconds)
- Each skill used within the window stays in `recentSkillQueue`
- When a new skill is used, `_checkSynergy()` is called
- If a synergy matches, it's consumed and effects are applied

- [ ] **Step 1: Add synergies block to skills.json (rush_bite and storm_slash)**
- [ ] **Step 2: Verify JSON is valid** — `node -e "JSON.parse(require('fs').readFileSync('src/config/skills.json'))"`
- [ ] **Step 3: Commit**

---

## Task 2: SkillSystem — add recentSkillQueue and _checkSynergy

**Files:**
- Modify: `src/systems/SkillSystem.js:1-150`
- Modify: `src/systems/__tests__/SkillSystem.test.js`

### 2a. Add recentSkillQueue to SkillSystem constructor

```js
// In constructor, after this.skills = ...
this.synergies = this._loadSynergies();
// Recent skill queue for synergy detection: { skillId, timestamp }
this.recentSkillQueue = [];
// Max age for skills in queue (3 seconds)
this._synergyWindowMs = 3000;
```

Add `_loadSynergies()` method:
```js
/**
 * Load synergy definitions from skills.json
 * @returns {object} Synergy definitions keyed by synergy id
 */
_loadSynergies() {
    // Assumes skillsConfig has synergies at root or merged in
    return this.skillsConfig?.synergies || {};
}
```

Add `_cleanSkillQueue()` helper:
```js
/**
 * Remove skills older than _synergyWindowMs from recentSkillQueue
 */
_cleanSkillQueue() {
    const now = this.scene?.time?.now || Date.now();
    this.recentSkillQueue = this.recentSkillQueue.filter(
        entry => now - entry.timestamp < this._synergyWindowMs
    );
}
```

- [ ] **Step 1: Write failing test — recentSkillQueue exists and is populated on skill use**

```js
test('recentSkillQueue is populated when skill is used', () => {
    const ss = new SkillSystem(mockScene, mockSkillsConfig, mockPlayer);
    ss.useSkill('bite');
    expect(ss.recentSkillQueue).toContainEqual(expect.objectContaining({ skillId: 'bite' }));
});
```

- [ ] **Step 2: Run test — Expected: FAIL (recentSkillQueue doesn't exist)**
- [ ] **Step 3: Implement recentSkillQueue + _cleanSkillQueue + _loadSynergies**
- [ ] **Step 4: Run test — Expected: PASS**
- [ ] **Step 5: Commit**

### 2b. Add _checkSynergy method

```js
/**
 * Check if the most recent skill completes any synergy pattern
 * @param {string} latestSkillId - The skill just used
 * @returns {object|null} The synergy object if matched, null otherwise
 */
_checkSynergy(latestSkillId) {
    this._cleanSkillQueue();

    const now = this.scene?.time?.now || Date.now();
    this.recentSkillQueue.push({ skillId: latestSkillId, timestamp: now });

    // Build current pattern from queue (only last N entries within window)
    const currentPattern = this.recentSkillQueue.map(e => e.skillId);

    // Check each synergy for pattern match (ends with latestSkillId)
    for (const [synergyId, synergy] of Object.entries(this.synergies)) {
        const pattern = synergy.pattern;
        // Must have at least as many entries as pattern length
        if (currentPattern.length < pattern.length) continue;

        // Check if the last `pattern.length` entries match the pattern
        const recentEntries = this.recentSkillQueue.slice(-pattern.length);
        const recentPattern = recentEntries.map(e => e.skillId);

        if (JSON.stringify(recentPattern) === JSON.stringify(pattern)) {
            // Synergy matched! Clear the queue to prevent re-trigger
            this.recentSkillQueue = [];
            return synergy;
        }
    }

    return null;
}
```

- [ ] **Step 1: Write failing test — _checkSynergy detects rush_bite pattern**

```js
test('_checkSynergy detects rush_bite (E + Q)', () => {
    const ss = new SkillSystem(mockScene, mockSkillsConfig, mockPlayer);
    ss.recentSkillQueue = [
        { skillId: 'speedUp', timestamp: Date.now() - 1000 },
    ];
    const result = ss._checkSynergy('bite');
    expect(result).not.toBeNull();
    expect(result.name).toBe('Rush Bite');
});

test('_checkSynergy returns null for no match', () => {
    const ss = new SkillSystem(mockScene, mockSkillsConfig, mockPlayer);
    ss.recentSkillQueue = [
        { skillId: 'bite', timestamp: Date.now() - 1000 },
    ];
    const result = ss._checkSynergy('shield'); // shield doesn't complete any pattern
    expect(result).toBeNull();
});
```

- [ ] **Step 2: Run tests — Expected: FAIL (_checkSynergy doesn't exist)**
- [ ] **Step 3: Implement _checkSynergy**
- [ ] **Step 4: Run tests — Expected: PASS**
- [ ] **Step 5: Commit**

### 2c. Modify useSkill to call _checkSynergy after execution

In `useSkill(skillId)`, after the skill effect is executed (after line ~L108), add:

```js
// Check for synergy activation
const synergy = this._checkSynergy(skillId);
if (synergy) {
    this._executeSynergy(synergy);
}
```

Add `_executeSynergy(synergy)`:

```js
/**
 * Execute synergy effects
 * @param {object} synergy - The synergy object to execute
 */
_executeSynergy(synergy) {
    // Log synergy activation
    this.scene?.debugLogger?.info?.(`Synergy activated: ${synergy.name}`);

    // Show floating text
    this.scene?.floatingTextSystem?.showSynergyName?.(synergy.name);

    const effects = synergy.effects;

    // rush_bite: damage x2 + knockback
    if (synergy.name === 'Rush Bite') {
        // Apply 2x damage multiplier to last bite if enemy was hit
        if (this.lastDamageHit?.enemy) {
            const extraDamage = this.lastDamageHit.damage; // Extra equal to original
            this.lastDamageHit.enemy.takeDamage(extraDamage);
        }
        // Knockback via ImpactSystem
        this.scene?.impactSystem?.applyKnockback?.(this.lastDamageHit?.enemy, this.player);
    }

    // storm_slash: cooldown reset + bonus bites
    if (synergy.name === 'Storm Slash') {
        // Reset Q (bite) cooldown
        const biteSkill = this.skills.find(s => s.id === 'bite');
        if (biteSkill) {
            biteSkill.currentCooldown = 0;
        }
        // Trigger 2 additional bites (bonusBites - 1 = 2 extra)
        for (let i = 0; i < (effects.bonusBites - 1); i++) {
            this._queueBonusBite?.();
        }
    }
}
```

**Note:** `lastDamageHit` stores info about the last damage skill hit. You'll need to track this.

- [ ] **Step 1: Write failing test — useSkill triggers _checkSynergy and returns synergy**

```js
test('useSkill triggers synergy check and activates rush_bite', () => {
    // Setup: speedUp used first, then bite completes rush_bite
    const ss = new SkillSystem(mockScene, mockSkillsConfig, mockPlayer);
    ss.useSkill('speedUp');
    // Mock the scene.time.now for controlled testing
    const result = ss._checkSynergy('bite');
    expect(result).not.toBeNull();
    expect(result.name).toBe('Rush Bite');
});
```

- [ ] **Step 2: Run test — Expected: FAIL (no _checkSynergy integration)**
- [ ] **Step 3: Integrate _checkSynergy into useSkill, implement _executeSynergy**
- [ ] **Step 4: Run test — Expected: PASS**
- [ ] **Step 5: Commit**

### 2d. Add bonus bite mechanism for storm_slash

For storm_slash, we need to queue bonus bites. Add a `_queueBonusBite` method:

```js
/**
 * Queue a bonus bite to be executed after current skill resolution
 */
_queueBonusBite() {
    // Schedule a bonus bite after short delay
    this.scene?.time?.delayedCall?.(100, () => {
        const biteSkill = this.skills.find(s => s.id === 'bite');
        if (biteSkill && this.player) {
            // Execute bite without cooldown check (cooldown already reset)
            const nearestEnemy = this._findNearestEnemy();
            if (nearestEnemy) {
                nearestEnemy.takeDamage(biteSkill.damage);
            }
        }
    });
}
```

- [ ] **Step 1: Write test — storm_slash resets bite cooldown and queues 2 bonus bites**

```js
test('storm_slash resets bite cooldown to 0', () => {
    const ss = new SkillSystem(mockScene, mockSkillsConfig, mockPlayer);
    ss.recentSkillQueue = [
        { skillId: 'speedUp', timestamp: Date.now() - 1000 },
        { skillId: 'bite', timestamp: Date.now() - 500 },
    ];
    const biteSkill = { id: 'bite', currentCooldown: 10 }; // In cooldown
    ss._executeSynergy({ name: 'Storm Slash', effects: { bonusBites: 3 } });
    expect(biteSkill.currentCooldown).toBe(0);
});
```

- [ ] **Step 2: Run test — Expected: FAIL (no storm_slash execution)**
- [ ] **Step 3: Implement storm_slash cooldown reset in _executeSynergy**
- [ ] **Step 4: Run test — Expected: PASS**
- [ ] **Step 5: Commit**

---

## Task 3: FloatingTextSystem — add synergy name display

**Files:**
- Modify: `src/systems/FloatingTextSystem.js`
- Test: `src/systems/__tests__/FloatingTextSystem.test.js` (or manual E2E)

The FloatingTextSystem likely already has `showDamage` or similar. Check if `showSynergyName` exists.

### 3a. Check existing FloatingTextSystem API

```bash
grep -n "show.*text\|showFloatingText\|showText" src/systems/FloatingTextSystem.js | head -20
```

### 3b. Add showSynergyName if not exists

```js
/**
 * Show synergy activation text
 * @param {string} synergyName - Name of the synergy to display
 */
showSynergyName(synergyName) {
    if (!this.scene) return;

    const x = this.player?.x || this.scene.cameras?.main?.centerX || 400;
    const y = (this.player?.y || this.scene.cameras?.main?.centerY || 300) - 50;

    // Create floating text with synergy color (gold/yellow)
    const text = this.scene.add.text(x, y, synergyName, {
        fontSize: '18px',
        color: '#FFD700', // Gold
        stroke: '#000000',
        strokeThickness: 3,
    });
    text.setOrigin(0.5);
    text.setDepth(1000);

    // Float upward and fade out
    this.scene.tweens.add({
        targets: text,
        y: y - 60,
        alpha: 0,
        duration: 1200,
        ease: 'Cubic.easeOut',
        onComplete: () => text.destroy(),
    });
}
```

- [ ] **Step 1: Check if showSynergyName already exists**
- [ ] **Step 2: If not, add showSynergyName method to FloatingTextSystem**
- [ ] **Step 3: Run tests — Expected: PASS**
- [ ] **Step 4: Commit**

---

## Task 4: E2E Verification

**Files:** Manual browser test

- [ ] **Step 1: Start server — `python3 -m http.server 8765 &`**
- [ ] **Step 2: Open Playwright browser, navigate to `http://localhost:8765/index.html`**
- [ ] **Step 3: Click 游客模式 → confirm game loads**
- [ ] **Step 4: Verify skill activation works — press E then Q quickly (rush_bite)**
- [ ] **Step 5: Look for gold "Rush Bite" floating text**
- [ ] **Step 6: Press E then Q then E quickly (storm_slash)**
- [ ] **Step 7: Look for "Storm Slash" floating text**
- [ ] **Step 8: Console no JS Error — Expected: only favicon.ico 404**
- [ ] **Step 9: Commit with E2E evidence in message**

---

## Task 5: Final regression + clean state

- [ ] **Step 1: `./init.sh` — Expected: 855+ tests pass**
- [ ] **Step 2: Update `feature_list.json` — set feat-045 status: "completed", evidence field filled**
- [ ] **Step 3: Update `progress.md` — add feat-045 session log**
- [ ] **Step 4: Commit**