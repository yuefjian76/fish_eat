# Fish Eat Fish - Game Enhancements Design

> **Date:** 2026-04-11
> **Feature:** 9 game enhancements (bug fixes + new features)

---

## 1. Bug Fix: Fish Disappear After Level 5

### Problem
When player reaches level 5, boss spawns and all enemies enter FLEEING state attacking the boss. After boss is defeated, these enemies remain in FLEEING state with invalid attacker references to destroyed boss object, causing them to behave incorrectly or disappear.

### Solution
Reset all FLEEING enemies to WANDERING state when boss fight ends.

**File:** `src/systems/BossSystem.js`

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

---

## 2. Health Regeneration + Full Heal on Level Up

### Features
- **Out of combat regeneration:** After 3 seconds without taking damage, HP regenerates at 2% of max HP per second
- **Full heal on level up:** HP resets to max HP when leveling up

### Implementation

**File:** `src/scenes/GameScene.js`

New fields in constructor:
```javascript
this.outOfCombatTimer = 0;
this.outOfCombatThreshold = 3000; // 3 seconds
this.healthRegenRate = 0.02; // 2% of max HP per second
```

In `takeDamage()` method:
```javascript
this.outOfCombatTimer = 0; // Reset on damage
```

In `update()` method:
```javascript
// Health regeneration when out of combat
if (this.outOfCombatTimer >= this.outOfCombatThreshold && this.hp < this.maxHp) {
    const regenAmount = this.maxHp * this.healthRegenRate * (delta / 1000);
    this.hp = Math.min(this.hp + regenAmount, this.maxHp);
} else if (this.outOfCombatTimer < this.outOfCombatThreshold) {
    this.outOfCombatTimer += delta;
}
```

In `onLevelUp()` method:
```javascript
this.hp = this.maxHp; // Full heal on level up
```

---

## 3. Increase HP Per Level

### Change
HP gained per level: 10 → 20

**File:** `src/scenes/GameScene.js`

```javascript
// In onLevelUp()
const hpPerLevel = 20;  // Changed from 10
this.maxHp = Math.floor(this.maxHp) + hpPerLevel;
this.hp = this.maxHp; // Full heal on level up
```

---

## 4. Increase Shield and Speed Up Cooldowns

### Changes
- Shield cooldown: 15s → 25s
- Speed Up cooldown: 8s → 15s

**File:** `src/config/skills.json`

```json
"shield": {
    "cooldown": 25   // Changed from 15
},
"speed_up": {
    "cooldown": 15   // Changed from 8
}
```

---

## 5. Enemy Level Distribution Adjustment

### Change
Distribution: 70/20/10 → 80/12/8

**File:** `src/scenes/GameScene.js`

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

---

## 6. Treasure Box Bubble Effect

### Visual Design
- Treasure box is wrapped inside a large bubble (bubble ~30% larger than box)
- Bubble has subtle transparent flickering effect
- Rising: Bubble carries treasure box from bottom to top
- Wandering: After reaching top, bubble moves horizontally with sine wave trajectory
- When player gets close, bubble bursts and treasure is collected

### States
1. `RISING` - Bubble carries treasure box upward
2. `WANDERING` - At top, random horizontal movement
3. `BURSTING` - When collected, burst animation

### Parameters
```javascript
bubbleRadius: 30-40 pixels (~30% larger than treasure box)
riseSpeed: 3-5 seconds to reach top
topYThreshold: 100 pixels from top
horizontalWanderSpeed: 2-3 seconds per direction change
```

### Implementation

**File:** `src/entities/TreasureBox.js`

```javascript
export class TreasureBox {
    static STATE = {
        RISING: 'rising',
        WANDERING: 'wandering',
        BURSTING: 'bursting'
    };

    constructor(scene, x, y, rewardType, rewardAmount) {
        // ... existing initialization ...

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
    }

    createBubble() {
        this.bubbleGraphics = this.scene.add.graphics();
        this.bubbleGraphics.setDepth(7);
        this.bubbleGraphics.x = this.x;
        this.bubbleGraphics.y = this.y;

        // Draw bubble with gradient effect
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
    }

    collect(player) {
        if (this.isCollected) return null;
        this.isCollected = true;
        this.state = TreasureBox.STATE.BURSTING;

        // Stop animations
        if (this.riseTween) this.riseTween.stop();
        if (this.wanderTween) this.wanderTween.stop();

        // Burst animation
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
}
```

---

## 7. Random Background Themes

### Feature
Game randomly selects a background theme each time it starts.

### Implementation

**File:** `src/scenes/GameScene.js`

In `createBackground()`:
```javascript
createBackground() {
    // Random theme selection
    const themes = ['undersea', 'tropical', 'polar'];
    const selectedTheme = themes[Phaser.Math.Between(0, themes.length - 1)];

    // Load background with selected theme
    this.bg = this.add.image(512, 384, `bg_${selectedTheme}`);
    this.bg.setDepth(0);
    this.bg.setScale(1.6);

    // Other layers with same theme
    this.bgImages.far = this.add.image(512, 384, `far_${selectedTheme}`);
    this.bgImages.midground = this.add.image(512, 450, `midground_${selectedTheme}`);
    this.bgImages.sand = this.add.image(512, 760, `sand_${selectedTheme}`);
    this.bgImages.foreground = this.add.image(512, 700, `foreground_${selectedTheme}`);
}
```

**Note:** Requires corresponding image assets with theme suffixes in `assets/` folder.

---

## 8. Bubble Effect - Particle System Style

### Features
- **Count:** 70 bubbles
- **Size:** 3-25 pixels (continuous distribution, more middle values)
- **Speed:** 2-8 seconds to rise
- **Trajectory:** Sine wave wobble + random acceleration
- **Transparency:** 0.2-0.7
- **Horizontal drift:** Inverse to size (small = fast, large = slow)
- **Special:** 5% chance to create ripple effect at top

### Implementation

**File:** `src/systems/BackgroundSystem.js`

```javascript
_createBubbleAnimation() {
    // Bubble count: 70
    const bubbleCount = 70;

    for (let i = 0; i < bubbleCount; i++) {
        this.createBubble(i);
    }
}

createBubble(index) {
    // Size distribution: more middle-sized, fewer very small/large
    // Using quadratic distribution
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
    // Highlight
    bubble.fillStyle(0xFFFFFF, 0.5);
    bubble.fillCircle(size * 0.3, size * 0.3, size * 0.15);

    bubble.x = x;
    bubble.y = y;
    bubble.setDepth(6);

    // Animation parameters
    const targetY = -50;
    const wobbleAmount = 30 + Math.random() * 50;
    const wobbleSpeed = 500 + Math.random() * 1000;
    const horizontalDrift = (25 - size) * 0.5; // Smaller = more drift

    // Rising animation with sine wave
    const tween = this.scene.tweens.add({
        targets: bubble,
        y: targetY,
        x: x + horizontalDrift * (Math.random() > 0.5 ? 1 : -1),
        alpha: { from: baseAlpha, to: 0 },
        duration: speed,
        ease: 'Sine.easeOut',
        onRepeat: () => {
            // Reset position with new random
            bubble.x = Math.random() * this.screenWidth;
            bubble.y = this.screenHeight + 20;
            bubble.alpha = baseAlpha;
            bubble.setScale(1);

            // Random chance for ripple at top
            if (Math.random() < 0.05) {
                this.createRipple(bubble.x, 50);
            }
        },
        repeat: -1
    });

    // Sine wave wobble (separate tween for smooth oscillation)
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
        scaleY: 0.3, // Flatten to simulate surface
        alpha: 0,
        duration: 800,
        ease: 'Quad.easeOut',
        onComplete: () => ripple.destroy()
    });
}
```

---

## 9. Infinite Scroll Map (Endless World)

### Architecture
- Player always stays at screen center
- Background/enemies/map elements render relative to player position
- When player moves beyond threshold, trigger chunk loading
- Use 3x3 chunk grid system with player at center

### Implementation

**File:** `src/scenes/GameScene.js`

New fields:
```javascript
this.worldOffsetX = 0;
this.worldOffsetY = 0;
this.chunkSize = 1024; // Size of each chunk
this.loadedChunks = new Set();
this.chunkLoadThreshold = 512; // Load adjacent chunks when within this distance
```

In `create()`:
```javascript
// Set initial world position at center of starting area
this.worldOffsetX = 0;
this.worldOffsetY = 0;

// Initialize first chunk
this.loadChunk(0, 0);
```

New methods:
```javascript
loadChunk(chunkX, chunkY) {
    const chunkKey = `${chunkX},${chunkY}`;
    if (this.loadedChunks.has(chunkKey)) return;

    this.loadedChunks.add(chunkKey);

    // Calculate world position of chunk
    const chunkWorldX = chunkX * this.chunkSize;
    const chunkWorldY = chunkY * this.chunkSize;

    // Spawn enemies in this chunk
    this.spawnEnemiesInChunk(chunkWorldX, chunkWorldY);

    // Load background tiles for chunk
    this.loadBackgroundChunk(chunkX, chunkY);
}

spawnEnemiesInChunk(worldX, worldY) {
    // Calculate number of enemies per chunk
    const enemyCount = Phaser.Math.Between(this.enemyCountMin, this.enemyCountMax);

    for (let i = 0; i < enemyCount; i++) {
        // Spawn at random position within chunk
        const localX = Phaser.Math.Between(50, this.chunkSize - 50);
        const localY = Phaser.Math.Between(50, this.chunkSize - 50);
        const worldX = worldX + localX;
        const worldY = worldY + localY;

        // Spawn enemy (position relative to world)
        const enemy = new Enemy(this, worldX, worldY, fishConfig, type, this.aiLevel);
        this.enemies.push(enemy);
    }
}

updateChunks() {
    // Determine current chunk from player world position
    const playerChunkX = Math.floor(this.player.x / this.chunkSize);
    const playerChunkY = Math.floor(this.player.y / this.chunkSize);

    // Load 3x3 grid of chunks around player
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            this.loadChunk(playerChunkX + dx, playerChunkY + dy);
        }
    }

    // Unload chunks too far from player
    this.unloadDistantChunks(playerChunkX, playerChunkY);
}

unloadDistantChunks(playerChunkX, playerChunkY) {
    const maxDistance = 2; // Unload chunks beyond this distance

    for (const chunkKey of this.loadedChunks) {
        const [cx, cy] = chunkKey.split(',').map(Number);
        if (Math.abs(cx - playerChunkX) > maxDistance ||
            Math.abs(cy - playerChunkY) > maxDistance) {
            // Remove enemies in this chunk
            this.removeEnemiesInChunk(cx, cy);
            this.loadedChunks.delete(chunkKey);
        }
    }
}
```

In `update()`:
```javascript
// Update world offset based on player movement from center
const screenCenterX = this.scale.width / 2;
const screenCenterY = this.scale.height / 2;

if (this.player) {
    // Calculate world offset
    this.worldOffsetX = this.player.x - screenCenterX;
    this.worldOffsetY = this.player.y - screenCenterY;

    // Update all entity render positions
    this.updateEntityPositions();

    // Check chunk loading
    this.updateChunks();
}
```

**Note:** This is a significant architectural change. Full implementation may require multiple tasks.

---

## Summary of Changes

| # | Feature | Files to Modify | Complexity |
|---|---------|-----------------|------------|
| 1 | Bug fix: fish disappear | BossSystem.js | Low |
| 2 | Health regen + full heal | GameScene.js | Low |
| 3 | HP per level increase | GameScene.js | Low |
| 4 | Shield/Speed cooldown | skills.json | Low |
| 5 | Enemy level distribution | GameScene.js | Low |
| 6 | Treasure box bubble | TreasureBox.js | Medium |
| 7 | Random backgrounds | GameScene.js, assets | Medium |
| 8 | Enhanced bubbles | BackgroundSystem.js | Medium |
| 9 | Infinite scroll map | GameScene.js, Enemy.js | High |
