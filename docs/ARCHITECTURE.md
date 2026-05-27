# Architecture -- 鱼吃鱼 (Fish Eat Fish)

## System Overview

鱼吃鱼是一款 Phaser.js 3.x HTML5 游戏，使用 arcage 物理引擎（无重力，俯视角移动）。

### Layer Diagram

```
+-----------------------------------------------------------+
|                     Scene Layer                           |
|  BootScene → MenuScene → GameScene + UIScene → GameOver  |
+-----------------------------------------------------------+
         |  Scene events + callbacks
+-----------------------------------------------------------+
|                     System Layer                          |
|  Battle | Skill | Growth | Combo | Audio | Achievement   |
|  Wave | Spawn | Collision | Treasure | RangedAttack       |
|  PlayerControl | HealthRegen | Impact | Background       |
+-----------------------------------------------------------+
         |  DI + callback interfaces
+-----------------------------------------------------------+
|                     Entity Layer                          |
|  Player | Enemy | BossEnemy | TreasureBox | FishFactory  |
+-----------------------------------------------------------+
         |  Physics + rendering
+-----------------------------------------------------------+
|                     Config Layer                          |
|  fish.json | skills.json | levels.json | maps.json       |
```

## Scene Architecture

### Scene Flow

```
BootScene → MenuScene → GameScene + UIScene → GameOverScene
                              ↑___________|
```

| Scene | 职责 | 关键状态 |
|-------|------|---------|
| `BootScene` | 资源加载，带进度条 | loading progress |
| `MenuScene` | 标题画面，难度选择 | difficulty |
| `GameScene` | 核心游戏循环 | playing/paused/gameOver |
| `UIScene` | HUD 覆盖层（并行运行） | HP/EXP/Score display |
| `GameOverScene` | 结果统计面板 | final score, stats |

### Scene Communication

- GameScene 和 UIScene 并行运行，通过 scene events 通信
- GameOverScene 通过 `scene.start()` 接收参数：`{ score, level, difficulty, kills, survivalTime }`

## System Architecture

### Core Systems

| System | 文件 | 职责 | 接口 |
|--------|------|------|------|
| `BattleSystem` | `systems/BattleSystem.js` | 伤害计算，属性克制 | `canAttack()`, `calculateDamage()` |
| `SkillSystem` | `systems/SkillSystem.js` | Q/W/E/R 技能冷却 | `useSkill()`, `getCooldown()` |
| `GrowthSystem` | `systems/GrowthSystem.js` | EXP/升级/连击 | `addExp()`, `getLevel()`, `getCombo()` |
| `ComboSystem` | `systems/ComboSystem.js` | 连击倍率时间窗口 | `increment()`, `getMultiplier()` |
| `AudioSystem` | `systems/AudioSystem.js` | Web Audio 合成音效 | `play()` |
| `AchievementSystem` | `systems/AchievementSystem.js` | 15 里程碑成就 | `checkScore()`, `checkFishEaten()` |

### Extracted Systems (GameScene refactoring)

| System | 文件 | 职责 | 回调 |
|--------|------|------|------|
| `WaveSystem` | `systems/WaveSystem.js` | 波次状态机 | - |
| `SpawnSystem` | `systems/SpawnSystem.js` | 敌鱼生成 | `onEnemyCreated(enemy)` |
| `FloatingTextSystem` | `systems/FloatingTextSystem.js` | 伤害/EXP 飘字 | - |
| `CollisionSystem` | `systems/CollisionSystem.js` | 吃鱼碰撞检测 | `onCollisionResult(result)` |
| `TreasureSystem` | `systems/TreasureSystem.js` | 宝箱碰撞 | `onCollect(box)` |
| `RangedAttackSystem` | `systems/RangedAttackSystem.js` | 炮弹碰撞 | `onHit(enemy, damage)` |
| `PlayerControlSystem` | `systems/PlayerControlSystem.js` | 键盘/鼠标输入 | - |
| `HealthRegenSystem` | `systems/HealthRegenSystem.js` | 脱战回血 | - |

### System Communication Pattern

```javascript
// GameScene 中系统初始化
this.spawnSystem = new SpawnSystem({
    waveSystem: this.waveSystem,  // DI
    fishData: this.fishData,
    onEnemyCreated: (enemy) => {
        // 处理敌鱼创建副作用
        this.enemies.push(enemy);
        logger.debug(`Enemy created: ${enemy.fishType}`);
    }
});

this.collisionSystem = new CollisionSystem({
    scene: this,
    player: this.player,
    enemies: this.enemies,
    onCollisionResult: (result) => {
        // 处理碰撞结果副作用
        if (result.type === 'eat') {
            this._handleEat(result);
        } else if (result.type === 'damaged') {
            this._handleDamage(result);
        }
    }
});
```

### reset() Pattern

每个系统实现 `reset(config)` 方法支持 scene restart：

```javascript
class WaveSystem {
    reset(config) {
        this._state = 'calm';
        this._stateTimer = 0;
        this._phaseTimer = 0;
    }
}
```

## Entity Architecture

### Entity Classes

| Entity | 文件 | 描述 |
|--------|------|------|
| `Player` | `entities/Player.js` | 玩家鱼（供未来扩展） |
| `Enemy` | `entities/Enemy.js` | AI 鱼，4 状态机 |
| `BossEnemy` | `entities/BossEnemy.js` | Boss 鱼，特殊能力 |
| `TreasureBox` | `entities/TreasureBox.js` | 可收集宝箱 |
| `FishFactory` | `entities/FishFactory.js` | 鱼精灵工厂 |

### Enemy AI State Machine

```
WANDERING → CHASING → ATTACKING
    ↑__________|         |
    |          ↓         ↓
    └────── FLEEING ←────┘
```

- **WANDERING** — 随机方向移动，周期性改变
- **CHASING** — 检测到玩家，进入追逐模式
- **ATTACKING** — 进入攻击范围，执行攻击
- **FLEEING** — HP 低于阈值，逃离玩家

## Data Flow

### Game Loop Flow

```
1. Player Movement (input)
   ↓
2. Enemy AI (state machine)
   ↓
3. Spawn System (wave-based spawning)
   ↓
4. Collision Detection
   ├── Player vs Enemies (eat/damaged)
   ├── Player vs TreasureBox
   └── Enemy projectiles vs Player
   ↓
5. Battle Resolution (type effectiveness)
   ↓
6. Growth System (EXP → Level up)
   ↓
7. Audio/Visual Feedback
   ↓
8. UI Update (HP/EXP/Score)
```

### Experience Flow

```
Enemy eaten → expGain = enemy.fishData.exp
    ↓
score += expGain * 10 * comboMultiplier
    ↓
growthSystem.addExp(expGain)
    ↓
if (growthSystem.isLevelUp()) → trigger wave animation
    ↓
if (Math.random() < driftBottleChance) → DriftBottle effect
```

## Config Layer

### JSON Configuration Files

| File | 描述 | 关键数据 |
|------|------|---------|
| `fish.json` | 鱼的种类属性 | HP, speed, size, exp, type, behavior |
| `skills.json` | 技能定义 | cooldown, damage, duration, effects |
| `levels.json` | 经验值表 | expThresholds, skill unlocks |
| `maps.json` | 主题背景 | themes, parallax layers, levelMapping |
| `difficulty.json` | 难度参数 | enemy count, AI aggression |
| `drops.json` | 宝箱掉落 | drop rates, rewards |
| `driftBottle.json` | 漂流瓶效果 | effects, weights |
| `upgrades.json` | 商店升级 | upgrade types, costs, effects |
| `achievements.json` | 成就定义 | conditions, rewards |

## Architecture Rules

1. **Scene 层** — 场景控制流和用户交互，不含游戏逻辑
2. **System 层** — 游戏逻辑系统，通过 DI + 回调通信
3. **Entity 层** — 渲染和物理，不含游戏逻辑
4. **Config 层** — JSON 数据，运行时加载

### Constraints

- System 不直接引用 Phaser Scene
- Entity 不含游戏逻辑判断
- Scene 通过回调处理系统副作用
- 所有系统有 `reset(config)` 方法