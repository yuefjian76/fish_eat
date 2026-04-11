# Fish Eat Fish - Game Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 8 game enhancements (bug fixes + new features). Feature #9 (infinite scroll map) is deferred to a separate plan due to high complexity.

**Architecture:** Modify existing game files to add new mechanics. All changes are additive with backward compatibility. Use Phaser's tween system for animations, physics for collisions.

**Tech Stack:** Phaser 3.x, JavaScript ES Modules, Jest for testing

---

## Phase 1: Bug Fix + Simple Features (1-5)

### Task 1: Fix Fish Disappear After Level 5 Bug

**Files:**
- Modify: `src/systems/BossSystem.js:40-44`

- [ ] **Step 1: Read BossSystem.js to understand current endBossFight implementation**

Run: `cat src/systems/BossSystem.js`
Expected: Show current `endBossFight()` method at lines 40-44

- [ ] **Step 2: Edit endBossFight to reset FLEEING enemies**

```javascript
endBossFight() {
    // Reset all FLEEING enemies back to WANDERING
    if (this.scene.enemies) {
        this.scene.enemies.forEach(enemy => {
            if (enemy.state === Enemy.STATE.FLEEING) {
                enemy.setState(Enemy.STATE.WANDERING);
                enemy.attacker = null;
            }
        });
    }
    this.currentBoss = null;
    this.inBossFight = false;
}
```

- [ ] **Step 3: Run tests to verify no regressions**

Run: `npm test -- --testPathPattern="BossSystem" 2>&1`
Expected: All BossSystem tests pass

- [ ] **Step 4: Commit**

```bash
git add src/systems/BossSystem.js
git commit -m "fix: reset FLEEING enemies when boss fight ends"
```

---

### Task 2: Add Health Regeneration + Full Heal on Level Up

**Files:**
- Modify: `src/scenes/GameScene.js`

**Note:** This task and Task 3 both modify `onLevelUp()`. Task 2 adds the out-of-combat timer and full heal. Task 3 just changes hpPerLevel. They can be implemented independently but both touch the same method.

- [ ] **Step 1: Read GameScene.js constructor to find where to add new fields**

Run: `grep -n "this.hp" src/scenes/GameScene.js | head -10`
Expected: Show hp initialization lines

- [ ] **Step 2: Add new health regen fields to constructor (after line ~60)**

```javascript
this.outOfCombatTimer = 0;
this.outOfCombatThreshold = 3000; // 3 seconds
this.healthRegenRate = 0.02; // 2% of max HP per second
```

- [ ] **Step 3: Find takeDamage method and reset outOfCombatTimer**

Run: `grep -n "takeDamage" src/scenes/GameScene.js`
Expected: Show takeDamage method location

- [ ] **Step 4: Add outOfCombatTimer reset in takeDamage**

In `takeDamage()` method, add at the start:
```javascript
this.outOfCombatTimer = 0; // Reset on damage
```

- [ ] **Step 5: Find update() method and add health regen logic**

Run: `grep -n "update(" src/scenes/GameScene.js`
Expected: Show update method location (~line 505)

- [ ] **Step 6: Add health regen logic in update() method**

After the existing update code, add:
```javascript
// Health regeneration when out of combat
if (this.outOfCombatTimer >= this.outOfCombatThreshold && this.hp < this.maxHp) {
    const regenAmount = this.maxHp * this.healthRegenRate * (delta / 1000);
    this.hp = Math.min(this.hp + regenAmount, this.maxHp);
} else if (this.outOfCombatTimer < this.outOfCombatThreshold) {
    this.outOfCombatTimer += delta;
}
```

- [ ] **Step 7: Find onLevelUp() method and ensure full heal**

Run: `grep -n "onLevelUp" src/scenes/GameScene.js`
Expected: Show onLevelUp method location (~line 654)

- [ ] **Step 8: Ensure hp = maxHp in onLevelUp()**

In `onLevelUp()`, ensure this line exists:
```javascript
this.hp = this.maxHp; // Full heal on level up
```

- [ ] **Step 9: Run tests**

Run: `npm test 2>&1 | tail -20`
Expected: All tests pass

- [ ] **Step 10: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: add out-of-combat health regen + full heal on level up"
```

---

### Task 3: Increase HP Per Level (10 → 20)

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Find onLevelUp() and locate hpPerLevel**

Run: `grep -n "hpPerLevel" src/scenes/GameScene.js`
Expected: Show current hpPerLevel value

- [ ] **Step 2: Change hpPerLevel from 10 to 20**

In `onLevelUp()`:
```javascript
const hpPerLevel = 20;  // Changed from 10
```

- [ ] **Step 3: Run tests**

Run: `npm test 2>&1 | tail -10`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "balance: increase HP per level from 10 to 20"
```

---

### Task 4: Increase Shield and Speed Up Cooldowns

**Files:**
- Modify: `src/config/skills.json`

- [ ] **Step 1: Read skills.json to see current cooldowns**

Run: `cat src/config/skills.json`
Expected: Show shield cooldown: 15, speed_up cooldown: 8

- [ ] **Step 2: Update shield cooldown to 25**

```json
"shield": {
    "cooldown": 25
}
```

- [ ] **Step 3: Update speed_up cooldown to 15**

```json
"speed_up": {
    "cooldown": 15
}
```

- [ ] **Step 4: Run tests**

Run: `npm test 2>&1 | tail -10`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/config/skills.json
git commit -m "balance: increase shield cooldown 15s→25s, speed_up 8s→15s"
```

---

### Task 5: Adjust Enemy Level Distribution (80/12/8)

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Find calculateEnemyLevel method**

Run: `grep -n "calculateEnemyLevel" src/scenes/GameScene.js`
Expected: Show method location (~line 277)

- [ ] **Step 2: Read current implementation**

Run: `sed -n '277,286p' src/scenes/GameScene.js`
Expected: Show current distribution 70/20/10

- [ ] **Step 3: Update distribution to 80/12/8**

```javascript
calculateEnemyLevel(playerLevel) {
    const roll = Math.random();
    if (roll < 0.80) {
        return playerLevel;                    // 80% same level
    } else if (roll < 0.92) {
        return Math.max(1, playerLevel - 1);  // 12% lower level
    } else {
        return playerLevel + 1;               // 8% higher level
    }
}
```

- [ ] **Step 4: Run tests**

Run: `npm test 2>&1 | tail -10`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "balance: adjust enemy level distribution to 80/12/8"
```

---

## Phase 2: Medium Features (6-8)

### Task 6: Treasure Box Bubble Effect

**Files:**
- Modify: `src/entities/TreasureBox.js`
- Test: `src/entities/__tests__/TreasureBox.test.js`

- [ ] **Step 1: Read current TreasureBox.js**

Run: `cat src/entities/TreasureBox.js`
Expected: Show current implementation with floatTween

- [ ] **Step 2: Add STATE enum at top of class**

```javascript
static STATE = {
    RISING: 'rising',
    WANDERING: 'wandering',
    BURSTING: 'bursting'
};
```

- [ ] **Step 3: Modify constructor to add bubble properties**

Replace the floating animation section with:
```javascript
// Bubble properties
this.state = TreasureBox.STATE.RISING;
this.bubbleRadius = 30 + Math.random() * 10;
this.risingTargetY = 100; // Top threshold
this.wanderDirection = 1;
this.wanderTimer = 0;
this.wanderInterval = Phaser.Math.Between(2000, 3000);

// Create bubble graphics (drawn programmatically)
this.createBubble();

// Rising animation
this.startRising();
```

- [ ] **Step 4: Add createBubble method**

```javascript
createBubble() {
    this.bubbleGraphics = this.scene.add.graphics();
    this.bubbleGraphics.setDepth(7);
    this.bubbleGraphics.x = this.x;
    this.bubbleGraphics.y = this.y;

    // Draw bubble
    this.drawBubble();

    // Add to physics
    this.scene.physics.world.enable(this.bubbleGraphics);
    this.bubbleGraphics.body.setSize(this.bubbleRadius * 2, this.bubbleRadius * 2);
    this.bubbleGraphics.body.setOffset(-this.bubbleRadius, -this.bubbleRadius);
    this.bubbleGraphics.body.setImmovable(true);
}

drawBubble() {
    const g = this.bubbleGraphics;
    const r = this.bubbleRadius;

    // Bubble outline
    g.lineStyle(2, 0xAADDFF, 0.8);
    g.strokeCircle(0, 0, r);

    // Bubble fill (semi-transparent)
    g.fillStyle(0xAADDFF, 0.2);
    g.fillCircle(0, 0, r);

    // Highlight reflection
    g.fillStyle(0xFFFFFF, 0.4);
    g.fillCircle(-r * 0.3, -r * 0.3, r * 0.2);
}
```

- [ ] **Step 5: Add startRising method**

```javascript
startRising() {
    this.riseTween = this.scene.tweens.add({
        targets: [this.graphics, this.glowGraphics, this.bubbleGraphics],
        y: this.risingTargetY,
        duration: Phaser.Math.Between(3000, 5000),
        ease: 'Sine.easeInOut',
        onComplete: () => {
            this.state = TreasureBox.STATE.WANDERING;
            this.startWandering();
        }
    });
}
```

- [ ] **Step 6: Add startWandering method**

```javascript
startWandering() {
    this.wanderTween = this.scene.tweens.add({
        targets: [this.graphics, this.glowGraphics, this.bubbleGraphics],
        x: this.x + this.wanderDirection * Phaser.Math.Between(50, 150),
        duration: this.wanderInterval,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        onRepeat: () => {
            this.wanderDirection *= -1;
        }
    });

    // Bubble wobble animation
    this.scene.tweens.add({
        targets: this.bubbleGraphics,
        scaleX: 1.05,
        scaleY: 0.95,
        duration: 500,
        yoyo: true,
        repeat: -1
    });

    // Bubble flickering (alpha pulse) effect
    this.scene.tweens.add({
        targets: this.bubbleGraphics,
        alpha: 0.6,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
}
```

- [ ] **Step 7: Update collect method for burst effect**

```javascript
collect(player) {
    if (this.isCollected) return null;
    this.isCollected = true;
    this.state = TreasureBox.STATE.BURSTING;

    // Stop animations
    if (this.riseTween) this.riseTween.stop();
    if (this.wanderTween) this.wanderTween.stop();

    // Burst animation for bubble
    this.scene.tweens.add({
        targets: this.bubbleGraphics,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 200,
        onComplete: () => this.bubbleGraphics.destroy()
    });

    // Collection effect
    this.scene.tweens.add({
        targets: [this.graphics, this.glowGraphics, this.label],
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 300,
        onComplete: () => this.destroy()
    });

    return { type: this.rewardType, amount: this.rewardAmount };
}
```

- [ ] **Step 8: Update destroy method to clean up bubble**

```javascript
destroy() {
    if (this.riseTween) this.riseTween.stop();
    if (this.wanderTween) this.wanderTween.stop();
    if (this.bubbleGraphics) this.bubbleGraphics.destroy();
    if (this.graphics) this.graphics.destroy();
    if (this.glowGraphics) this.glowGraphics.destroy();
    if (this.label) this.label.destroy();
}
```

- [ ] **Step 9: Run tests**

Run: `npm test 2>&1 | tail -15`
Expected: All tests pass

- [ ] **Step 10: Commit**

```bash
git add src/entities/TreasureBox.js
git commit -m "feat: add bubble wrapper effect to treasure boxes"
```

---

### Task 6b: Add Bubble Proximity Detection (GameScene)

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Find collectTreasureBox method**

Run: `grep -n "collectTreasureBox" src/scenes/GameScene.js`
Expected: Show method location

- [ ] **Step 2: Read current implementation**

Run: `sed -n '864,890p' src/scenes/GameScene.js`
Expected: Show current overlap check logic

- [ ] **Step 3: Update to check bubbleGraphics instead of graphics**

The treasure box now has `bubbleGraphics` that wraps it. Update the overlap check to use bubbleGraphics:

```javascript
// Check collision with bubble (not the treasure box itself)
const bubbleGraphics = treasureBox.treasureBoxData?.bubbleGraphics;
if (bubbleGraphics && Phaser.Geom.Intersects.RectangleToRectangle(
    this.player.getBounds(),
    bubbleGraphics.getBounds()
)) {
    // Player touched the bubble - trigger burst
    const reward = treasureBox.treasureBoxData.collect(this.player);
    // ... handle reward
}
```

- [ ] **Step 4: Run tests**

Run: `npm test 2>&1 | tail -15`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: add bubble proximity detection for treasure collection"
```

---

### Task 7: Enhanced Bubble Particle Effect

**Files:**
- Modify: `src/systems/BackgroundSystem.js`
- Test: `src/systems/BackgroundSystem.test.js`

- [ ] **Step 1: Read current BackgroundSystem.js bubble implementation**

Run: `grep -n "_createBubbleAnimation" src/systems/BackgroundSystem.js`
Expected: Show method location

- [ ] **Step 2: Read full _createBubbleAnimation method**

Run: `sed -n '76,109p' src/systems/BackgroundSystem.js`
Expected: Show current implementation with 20 bubbles

- [ ] **Step 3: Replace with enhanced particle-style bubbles**

Replace `_createBubbleAnimation()` and add helper methods:

```javascript
_createBubbleAnimation() {
    const bubbleCount = 70;
    for (let i = 0; i < bubbleCount; i++) {
        this.createBubble();
    }
}

createBubble() {
    const rand = Math.random();
    const size = 3 + Math.pow(rand, 0.7) * 22; // 3-25 pixels
    const x = Math.random() * this.screenWidth;
    const y = Math.random() * this.screenHeight + 50;
    const baseAlpha = 0.2 + rand * 0.5; // 0.2-0.7
    const speed = 2000 + Math.random() * 6000; // 2-8 seconds

    // Create bubble with procedural drawing
    const bubble = this.scene.add.graphics();
    bubble.fillStyle(0xAADDFF, baseAlpha);
    bubble.fillCircle(size/2, size/2, size/2);
    bubble.lineStyle(1, 0xCCEEFF, baseAlpha * 0.8);
    bubble.strokeCircle(size/2, size/2, size/2);
    bubble.fillStyle(0xFFFFFF, 0.5);
    bubble.fillCircle(size * 0.3, size * 0.3, size * 0.15);

    bubble.x = x;
    bubble.y = y;
    bubble.setDepth(6);

    const targetY = -50;
    const wobbleAmount = 30 + Math.random() * 50;
    const wobbleSpeed = 500 + Math.random() * 1000;
    const horizontalDrift = (25 - size) * 0.5;

    // Rising animation
    this.scene.tweens.add({
        targets: bubble,
        y: targetY,
        x: x + horizontalDrift * (Math.random() > 0.5 ? 1 : -1),
        alpha: { from: baseAlpha, to: 0 },
        duration: speed,
        ease: 'Sine.easeOut',
        onRepeat: () => {
            bubble.x = Math.random() * this.screenWidth;
            bubble.y = this.screenHeight + 20;
            bubble.alpha = baseAlpha;
            bubble.setScale(1);
            if (Math.random() < 0.05) {
                this.createRipple(bubble.x, 50);
            }
        },
        repeat: -1
    });

    // Sine wave wobble
    this.scene.tweens.add({
        targets: bubble,
        x: `+=${wobbleAmount}`,
        duration: wobbleSpeed,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    this.bubbles.push(bubble);
}

createRipple(x, y) {
    const ripple = this.scene.add.graphics();
    ripple.x = x;
    ripple.y = y;
    ripple.setDepth(6);
    ripple.lineStyle(2, 0xAADDFF, 0.6);
    ripple.strokeCircle(0, 0, 5);

    this.scene.tweens.add({
        targets: ripple,
        scaleX: 4,
        scaleY: 0.3,
        alpha: 0,
        duration: 800,
        ease: 'Quad.easeOut',
        onComplete: () => ripple.destroy()
    });
}
```

- [ ] **Step 4: Run tests**

Run: `npm test 2>&1 | tail -15`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/systems/BackgroundSystem.js
git commit -m "feat: enhance bubble effect with particle system style"
```

---

### Task 8: Random Background Themes

**Files:**
- Modify: `src/scenes/GameScene.js`
- Modify: `src/systems/BackgroundSystem.js`
- Note: Requires background image assets with theme suffixes

**Prerequisite:** Verify asset files exist before implementing. Required assets:
- `assets/images/bg_tropical.png`
- `assets/images/far_tropical.png`
- `assets/images/midground_tropical.png`
- `assets/images/sand_tropical.png`
- `assets/images/foreground_tropical.png`
- Same for `polar` theme

If assets don't exist, this task should be skipped or assets created first.

- [ ] **Step 0: Check if theme assets exist**

Run: `ls assets/images/ | grep -E "(tropical|polar)"`
Expected: List of theme assets or empty if none exist

If assets don't exist, skip to Step 6 to commit the code structure only (feature won't work without assets).

- [ ] **Step 1: Read current createBackground method**

Run: `grep -n "createBackground" src/scenes/GameScene.js`
Expected: Show method location

- [ ] **Step 2: Find BackgroundSystem usage in GameScene**

Run: `grep -n "backgroundSystem\|BackgroundSystem" src/scenes/GameScene.js`
Expected: Show where background system is used

- [ ] **Step 3: Update createBackground to select random theme**

Currently BackgroundSystem loads fixed background images. We need to pass a theme to it or modify BackgroundSystem to accept a theme parameter.

**Option A:** Modify BackgroundSystem constructor to accept theme parameter

In `BackgroundSystem.js`:
```javascript
constructor(scene, screenWidth = 1024, screenHeight = 768, theme = 'undersea') {
    // ...
    this.theme = theme;
}

_loadBackgroundImages() {
    // Use this.theme prefix for all image loads
    this.bgImages.background = this.scene.add.image(512, 384, `bg_${this.theme}`);
    // ... same for other layers
}
```

In `GameScene.js`:
```javascript
// Random theme selection
const themes = ['undersea', 'tropical', 'polar'];
const selectedTheme = themes[Phaser.Math.Between(0, themes.length - 1)];

// Pass theme to BackgroundSystem
this.backgroundSystem = new BackgroundSystem(this, 1024, 768, selectedTheme);
```

- [ ] **Step 4: Run tests**

Run: `npm test 2>&1 | tail -15`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.js src/systems/BackgroundSystem.js
git commit -m "feat: add random background theme selection"
```

**Note:** This feature requires corresponding image assets (`bg_tropical.png`, `far_tropical.png`, etc.) to be added to the assets folder. Without them, the game will show missing texture errors.

---

## Summary

| Task | Feature | Files | Status |
|------|---------|-------|--------|
| 1 | Bug fix: fish disappear | BossSystem.js | - [ ] |
| 2 | Health regen + full heal | GameScene.js | - [ ] |
| 3 | HP per level increase | GameScene.js | - [ ] |
| 4 | Shield/Speed cooldown | skills.json | - [ ] |
| 5 | Enemy level distribution | GameScene.js | - [ ] |
| 6 | Treasure box bubble | TreasureBox.js | - [ ] |
| 6b | Bubble collision | GameScene.js | - [ ] |
| 7 | Enhanced bubbles | BackgroundSystem.js | - [ ] |
| 8 | Random backgrounds | GameScene.js, BackgroundSystem.js | - [ ] |

---

## Deferred: Feature 9 - Infinite Scroll Map

This is a high-complexity architectural change that requires:
- Restructuring how entities are positioned relative to world coordinates
- Implementing chunk-based loading/unloading
- Modifying Enemy spawning to use chunk system
- Handling world-to-screen coordinate transformations

**Recommended approach:** Create a separate plan for this feature after the current 8 features are complete.

---

## Verification

After implementing all tasks, run:

```bash
npm test -- --coverage
```

Expected: All tests pass, coverage for modified files should not decrease.
