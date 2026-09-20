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
| `DeathSequenceSystem` | `systems/DeathSequenceSystem.js` | 死亡演出时序状态机（纯逻辑，feat-052） | `start()`, `update(delta)`, `getPhase()`, `reset()` |
| `LowHealthWarningSystem` | `systems/LowHealthWarningSystem.js` | 低血量警告强度曲线（纯逻辑，feat-053） | `update(hpRatio, delta)`, `getHeartbeatCount()`, `reset()` |

### Death Sequence (feat-052)

玩家血量归零不再硬切结算页，而是由 `DeathSequenceSystem` 驱动 1.35s 演出：

```
_triggerGameOver()            ← 唯一死亡入口（重入保护 _isDying）
   ├── _buildGameOverPayload()  结算数据在死亡瞬间快照
   ├── physics.world.pause()    冻结世界，死后不会被继续攻击
   └── deathSequence.start()

update() → _isDying ? _updateDeathSequence(delta) : <正常游戏逻辑>
   │
   ├── hitStop  (150ms)  白闪 + 震屏
   ├── impact   (700ms)  镜头推进 1.0→1.3、玩家淡出、粒子、"GAME OVER"
   └── fadeOut  (500ms)  镜头淡出至黑 → scene.start('GameOverScene', payload)
```

分层：`src/config/death_sequence.json`（数据）→ `DeathSequenceSystem`（纯逻辑，可单测）
→ `GameScene`（把 phase 映射成 Phaser 副作用）。`DeathSequenceSystem` 不引用任何 Phaser API。

> ⚠️ 相机 zoom 会影响 `scrollFactor(0)` 对象的屏幕位置。需要"贴屏"的元素
> （debug overlay、GAME OVER 文字）用世界坐标锚定：overlay 用 `camera.worldView` 左上角，
> 居中文字用 `camera.midPoint`。

### Low Health Warning (feat-053)

血量低于阈值后 UIScene 叠加红色暗角，进入 critical 后追加脉冲、`危险` 文字与心跳音：

```
LowHealthWarningSystem.update(hpRatio, delta)   ← 纯逻辑，无 Phaser 依赖
   └── 返回 { active, alpha, critical, severity, pulsePeriod,
              showText, textAlpha, text, heartbeatDue, entered, exited }

GameScene._updateLowHealthWarning(delta)        ← 每帧调用，转成副作用
   ├── entered/exited → logger.info('Low health warning')
   ├── heartbeatDue  → AudioSystem.play('heartbeat') + logger.debug('Low health heartbeat')
   └── UIScene.updateLowHealthWarning(state)    ← 只改 alpha / visible，不重建几何
```

| 血量比例 | 表现 |
|---------|------|
| `ratio >= 0.30` | 静默（vignette 隐藏、alpha 0） |
| `0.18 < ratio < 0.30` | 静态红色暗角，强度随危险度上升 |
| `ratio <= 0.18` | 追加三角波脉冲、`危险` 文字、心跳音（间隔 1200ms → 500ms 随危险度插值） |

- 强度曲线：`alpha = maxVignetteAlpha * (severity ** alphaExponent)`，`alphaExponent = 0.5`
  让「刚进入警告区」的暗角就有可感强度（纯线性在 25% 血量时 alpha 仅 0.13，实战中几乎看不见）。
- 暗角几何在 `UIScene._drawVignetteStrips()` 里**只画一次**（四条边缘渐变条，厚度 = 短边的 14%），
  运行时只 `setAlpha()`，不重建 Graphics。
- 数据分层：`src/config/low_health.json`（阈值/曲线/脉冲/心跳/文字）→ `LowHealthWarningSystem`（纯逻辑）
  → `GameScene`（副作用）→ `UIScene`（渲染）。系统本身不引用任何 Phaser API。

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

## ScrollingWorld Systems (feat-046~049)

### 新增系统

| System | 文件 | 职责 | 接口 |
|--------|------|------|------|
| `DepthColorMapper` | `systems/DepthColorMapper.js` | worldY→颜色/雾 alpha/气泡配置（纯函数） | `computeDepthColor()`, `worldYToDepthZone()`, `computeFogAlpha()` |
| `ScrollingBackground` | `systems/ScrollingBackground.js` | 深度渐变层 + 3层 TileSprite 视差 + DepthFog + ScrollEdge + BubblePool | `create()`, `update(scrollX, scrollY, delta)`, `setTheme()`, `destroy()` |
| `DecorationPool` | `systems/DecorationPool.js` | 程序化装饰对象池，chunk 管理，上限 200 个 | `create()`, `update(scrollX, scrollY, playerWorldY)`, `destroy()` |
| `Prng` | `utils/Prng.js` | mulberry32 确定性 PRNG | `create(seed)`, `chunkSeed(cx, cy)` |

### 深度区域（5 个）

| 区域 ID | worldY 范围 | 名称 | 颜色基调 |
|---------|------------|------|---------|
| `surface` | 0 ~ 2000 | 浅海 | 亮青绿 `#64c8d2` |
| `shallow` | 2000 ~ 4000 | 珊瑚礁 | 青蓝 `#1ea0b4` |
| `mid` | 4000 ~ 8000 | 中层 | 深蓝 `#0a5064` |
| `deep` | 8000 ~ 12000 | 深海 | 暗蓝 `#062b42` |
| `abyss` | 12000 ~ 20000 | 深渊 | 接近黑 `#02050f` |

### 深度实现层次

| 层次 | 类型 | scrollFactor | 备注 |
|------|------|-------------|------|
| DepthGradient | Graphics | 0 | 每帧重绘全屏底色 |
| BgLayer | TileSprite | 0.08 | 最慢视差 |
| MidLayer | TileSprite | 0.25 | 中速视差 |
| FgLayer | TileSprite | 0.50 | 快速视差 |
| DepthFog | Graphics | 0 | worldY>12000 出现 |
| ScrollEdge | Graphics[4] | 0 | 四边 120px 渐变条 |
| BubblePool | Graphics[40] | 0 | 深度参数化 |
| DecorationPool | Graphics | 0 | chunk 种子决定分布 |

### 废弃声明

- `BackgroundExpansion.js` — 已删除，功能由 ScrollingBackground 替代
- `BackgroundSystem.js` — 仅保留 `THEME_CONFIG` 静态数据，主题切换功能保留
