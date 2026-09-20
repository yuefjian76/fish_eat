# feat-054 Boss 战修复与节奏调整 — 设计文档

> 日期：2026-09-20 · 来源：`docs/PHASE_3_ROADMAP.md` P0「Boss 战节奏调整」
> 方法：按 roadmap 要求，先用 `__DEBUG_API__` 实跑复现问题，再定方案

## 1. 现状（实测证据）

用 `__DEBUG_API__` + Playwright 实跑 5 级乌贼战，得到的数据：

| 观测 | 实测结果 | 结论 |
|------|---------|------|
| `boss.graphics.x/y` | spawn 后第 1 帧即 `NaN`（143 帧逐帧记录，第 0 帧已是 NaN） | **Boss 根本不可见** |
| Boss 是否伤害玩家 | 静止 15s，玩家 HP 180 → 180 | Boss 打不到玩家 |
| 战斗期间刷怪 | 15s 内 `enemies` 7 → 28 | 「1v1 Boss 战」设计失效 |
| `spawnTimer` | 恒为 `null` | 暂停刷怪是死代码 |
| LV5 乌贼 HP | 600（`100 + 5*100`） | 玩家 Q 伤害 25 / 3s → 至少 72s |

### 根因

| # | 问题 | 位置 | 说明 |
|---|------|------|------|
| B1 | Boss 配置内联硬编码且**缺 `size`** | `GameScene.spawnBoss()` | `fish.json` 里有 `size: 200/250/300`，内联副本没有 → `FishFactory.createEnemyFromSprite(..., NaN)`、`body.setCircle(NaN)` → 坐标 NaN |
| B2 | Boss 近战伤害走 `Math.log(size)` | `Enemy.attackPlayer()` | `size` 缺失时算出 **NaN 伤害**（`hp = NaN` 后血条/死亡判定全废）；即使补上 size，`bossConfig.damage`（40/50/60）也被忽略 |
| B3 | 暂停刷怪写的是 `this.spawnTimer` | `GameScene.spawnBoss()` | 该字段在 feat-027 抽成 `SpawnSystem` 后已废弃（构造函数里 `this.spawnTimer = null`），永不为真 |
| B4 | 击败后「渐进恢复」用 `setInterval` | `GameScene` | 一方面父逻辑不会执行，另一方面 `setInterval` 在场景销毁后仍会回调（泄漏） |
| B5 | `bossDefeated` 键名不一致 | `GameScene` | 写入 `shark_king`/`sea_dragon`，读取 `sharkKing`/`seaDragon` → 击败记录等于没记 |
| B6 | 海龙触发等级 15，但等级上限是 11 | `fish.json` / `levels.json` | `experienceTable` 只有 11 项（`checkLevelUp` 到 11 级封顶）→ 第三只 Boss 永远不会出现 |
| B7 | 血条名字硬编码「深海霸主」 | `GameScene.spawnBoss()` | 三只 Boss 同名 |
| B8 | `__DEBUG_API__.level(n)` / `maxExp()` 不同步 `GrowthSystem` | `GameScene` | 二者只改 `GameScene.level/exp` 字段，而 `checkBossSpawn()` 读的是 `growthSystem.getLevel()` → **Boss 无法用调试 API 复现**（roadmap 指定的验证手段失效） |

B1+B2 合起来意味着：**Boss 战从未真正跑通过**——玩家看不到 Boss、Boss 打不到玩家、玩家也打不到它。

## 2. 目标

1. Boss 可见、可被打、能打人（修复 B1/B2）。
2. Boss 战期间真正停止刷怪，击败后平滑恢复（修复 B3/B4）。
3. 三只 Boss 都能在真实升级路径中出现（修复 B6/B7/B5）。
4. `__DEBUG_API__` 能稳定复现 Boss 战，后续平衡调试都靠它（修复 B8）。
5. 节奏：一场 Boss 战 **20~40 秒**（只用 Q 约 30~40s；用 E→Q 协同约 15~20s），战斗期间玩家有明确的走位/开技能压力。

## 3. 非目标

- 不改普通敌鱼生成节奏与伤害（属另一项 P0「数值平衡实测」）。
- 不新增 Boss 技能/阶段表现（`BossEnemy` 的多阶段逻辑保持现状）。
- 不做 Boss 战专属 BGM/演出。
- 不改经验表本身（等级上限 11 是既有设计，本次只把 Boss 触发等级对齐到它）。

## 4. 玩法设计

### 4.1 数据单一来源

Boss 数据只保留 `src/config/fish.json`（补 `name` / `skills` / `attackInterval`），
`GameScene.spawnBoss()` 改为直接读 `this.fishData[type]`，删除内联副本。

| Boss | 出现等级 | size | HP（出现时） | 单次伤害 | 攻击间隔 | 技能 |
|------|---------|------|-------------|---------|---------|------|
| 大王乌贼 `boss_squid` | 5 | 200 | 240 | 18 | 1600ms | tentacle_slap → ink_blind |
| 鲨鱼之王 `boss_shark_king` | 8 | 250 | 280 | 22 | 1500ms | dash → summon → stun |
| 海龙 `boss_sea_dragon` | 11 | 300 | 320 | 26 | 1400ms | fire_breath → earthquake → summon |

- HP 公式：`baseHp + hpPerLevel * max(0, playerLevel - triggerLevel)`（`hpPerLevel` 40/50/60，只有玩家继续升级才会变厚）。
- 触发判定：`playerLevel >= triggerLevel && !bossDefeated[key]`，每次升级都检查（避免错过 5 级时的那一次判定）。
- 玩家侧参照：Q 撕咬 25 伤害 / 3s 冷却 → 8.3 DPS（E→Q 协同 2 倍 → 16.7 DPS）；
  玩家 HP 180(LV5) / 280(LV8) / 380(LV11) → 每场可承受 10~14 次 Boss 攻击。
- 设计意图：默认打法 30~40s、需要走位；会用协同技能则 15~20s。Boss 战给 3 秒预警 + 入场动画（现状保留）。

### 4.2 战斗节奏

```
升级到触发等级
   └── showBossWarning(name) → 3s 预警
          └── spawnBoss(type) → 入场动画 + triggerBossFight()
                 ├── 现有敌鱼 setState(FLEEING)
                 └── _updateSpawning 期间不再刷怪（新增守卫）
                        └── Boss 被击败 → endBossFight() → 刷怪自动恢复
```

- 不再使用 `setInterval`；恢复交给既有的 `_spawnTimer` 循环（下一个刷新间隔即恢复）。
- 击败记录 `bossDefeated` 用统一 key（`squid` / `sharkKing` / `seaDragon`）。

### 4.3 调试能力

| 方法 | 行为 |
|------|------|
| `level(n)` | 同步 `GameScene.level` 与 `GrowthSystem.currentLevel`，并按等级重算 `maxHp` |
| `maxExp()` | 把 `GrowthSystem` 的经验设到升级阈值 -1，真实触发升级链路 |
| `boss(type)` | 直接生成指定 Boss（`boss_squid`/`boss_shark_king`/`boss_sea_dragon`），返回 HP 与名字 |

## 5. 架构

沿用既有分层，不新增系统类：

```
src/config/fish.json          数据（Boss 条目补 name/skills/attackInterval）
        ↓
src/entities/BossEnemy.js     实体（伤害取自 fishConfig.damage）
src/systems/BossSystem.js     状态机（calculateBossHp 改为按触发等级基准）
        ↓
src/scenes/GameScene.js       编排（spawnBoss / checkBossSpawn / 刷怪守卫 / 击败处理）
src/scenes/UIScene.js         表现（血条用真实名字）
```

## 6. 可观测性

| 事件 | 级别 | 字段 |
|------|------|------|
| Boss 预警 | INFO | `Boss warning`, { bossType, name, playerLevel } |
| Boss 登场 | INFO | `Boss spawned`, { bossType, hp, damage, attackInterval, playerLevel } |
| Boss 阶段推进 | INFO | 既有 `Boss phase changed` |
| Boss 击败 | INFO | `Boss defeated`, { bossType, durationMs } |
| 刷怪暂停/恢复 | DEBUG | `Boss fight spawn gate`, { paused } |

## 7. 验证策略

- **单元测试**：`BossSystem.calculateBossHp` 新公式与边界；`Enemy.attackPlayer` 对 Boss 使用配置伤害（不产生 NaN）；
  `fish.json` Boss 条目完整性（name/size/skills/attackInterval/damage 必须存在）。
- **E2E**（`e2e/boss-fight.spec.js`）：
  1. `boss('boss_squid')` 后 `graphics.x/y` 是有限数且在相机视口内（回归 B1）；
  2. 战斗期间等待 ≥2 个刷新间隔，敌鱼数量不增长（回归 B3）；
  3. 用 `takeDamage` 打死 Boss 后，`inBossFight=false`、`bossDefeated.squid=true`（回归 B5）；
  4. `level(5)` 能真正把 `growthSystem.getLevel()` 变成 5 并触发 Boss（回归 B8）；
  5. 血条名字等于配置里的 `name`（回归 B7）。
- **手动**：`__DEBUG_API__` 实测三场战斗时长与玩家存活压力，截图确认 Boss 可见。
- 全量回归：`npm test`、`npx playwright test --project=chromium --repeat-each=2`、`./init.sh`。

## 8. 风险

| 风险 | 处理 |
|------|------|
| Boss 变强后对新手过难 | 伤害/间隔全部走 `fish.json`，一行可调；E2E 只锁结构不锁数值 |
| 刷怪守卫写错导致永久不刷怪 | E2E 断言「击败后敌鱼数量恢复增长」 |
| `level(n)` 改成同步 GrowthSystem 后影响既有 E2E | 既有 debug-api 用例只断言 `level`/`exp` 字段，重跑全量确认 |
| 经验表 11 级上限是历史设计，改动触发等级会影响已有存档/成就 | 仅调整 Boss 触发等级，不动经验表与成就阈值 |
