# feat-054 Boss 战修复与节奏调整 — 实施计划

> Spec: `docs/superpowers/specs/2026-09-20-feat-054-boss-fight-design.md`
> 流程：TDD（先写失败测试 → 实现 → 转绿）→ E2E → 截图/实测 → 文档与状态更新

## 1. 数据层（先做，后续都依赖它）

- [x] `src/config/fish.json`：三只 Boss 补 `name` / `skills` / `attackInterval`，`baseHp`/`hpPerLevel` 按新公式调整，海龙 `triggerLevel` → 11、鲨王 → 8
- [x] 单元测试：Boss 条目字段完整性 + `triggerLevel` 在等级上限内

## 2. 纯逻辑层

- [x] `BossSystem.calculateBossHp(config, playerLevel)`：改为 `baseHp + hpPerLevel * max(0, lv - triggerLevel)`
- [x] `BossSystem` 增加 `getBossKey(type)`（+ `BOSS_KEY_MAP`）（统一 `squid`/`sharkKing`/`seaDragon`）；`markDefeated` 由 `GameScene._handleBossDefeated()` 直接写 `bossDefeated[key]`
- [x] 单元测试：新 HP 公式（触发等级处等于 baseHp、升级后线性增长、低于触发等级不为负）+ key 映射

## 3. 实体层

- [x] `Enemy.attackPlayer()`：Boss 使用 `fishConfig.damage`（走 `boss` 标记判断），普通鱼保持 `Math.log(size)` 逻辑；避免 NaN
- [x] `BossEnemy`：攻击间隔取自 `fishConfig.attackInterval`
- [x] 单元测试：Boss 伤害 = 配置值；size 缺失时普通鱼不产生 NaN

## 4. 场景层

- [x] `GameScene.spawnBoss(type)`：读 `this.fishData[type]`，删内联配置；`showBossHealthBar(config.name, hp)`
- [x] `GameScene.checkBossSpawn()`：`level >= triggerLevel && !defeated`，每次升级检查；日志加 `Boss warning`
- [x] `GameScene._updateSpawning`：Boss 战期间不刷怪（守卫）
- [x] `GameScene` Boss 击败处理：统一 key、去掉 `setInterval` 与死代码 `spawnTimer`
- [x] `UIScene.showBossHealthBar(name, maxHp)`：显示传入名字

## 5. 调试能力

- [x] `__DEBUG_API__.level(n)` / `maxExp()` 同步 `GrowthSystem`
- [x] `__DEBUG_API__.boss(type)`（第 17 个方法）+ `help()` 更新

## 6. 验证

- [x] `npm test` 全绿
- [x] 新建 `e2e/boss-fight.spec.js`（5 用例）并通过
- [x] 全量 E2E 无回归（`--repeat-each=2`）
- [x] `__DEBUG_API__` 实测三场战斗时长 + 截图确认 Boss 可见
- [x] `./init.sh` 5 步全过

## 7. 收尾

- [x] `ARCHITECTURE.md` / `PRODUCT.md`（新增 Boss 战章节）/ `RELIABILITY.md` / `PHASE_3_ROADMAP.md`
- [x] `feature_list.json` feat-054 completed + 证据
- [x] `progress.md` / `session-handoff.md` / `AGENTS.md` / `CLAUDE.md` / `quality-document.md` 计数与 API 清单同步

---

## 实施结果（2026-09-20 完成）

**状态**：feat-054 已 completed，全部验证通过。

| 验证项 | 命令 | 结果 |
|--------|------|------|
| 单元测试 | `npm test` | 942 passed / 0 failed（55 suites，1 skipped） |
| E2E（本功能） | `npx playwright test e2e/boss-fight.spec.js --project=chromium` | 7 passed |
| E2E（全量 ×2） | `npx playwright test --project=chromium --repeat-each=2` | 112 passed，0 flaky |
| 环境 | `./init.sh` | 5/5 steps pass |
| 实测 | `__DEBUG_API__` + 截图 | 见下 |

**新增/改动文件**

| 文件 | 变更 |
|------|------|
| `src/config/fish.json` | 三只 Boss 补 `name/speed/damage/attackInterval/visionRange/attackRange/skills`；HP `baseHp 240/280/320` + `hpPerLevel 40/50/60`；`triggerLevel` 5/8/11 |
| `src/systems/BossSystem.js` | 导出 `BOSS_KEY_MAP` / `getBossKey()` / `buildBossConfig()` / `calculateBossHp()` |
| `src/entities/BossEnemy.js` | HP 取 `config.hp`（兜底 `baseHp`）、`displayName`、`attackCooldown = attackInterval`、utility 技能走 `_skillCooldownTime`；`executeSkill` 伤害转发 `scene.onEnemyAttack` |
| `src/entities/Enemy.js` | Boss 用配置伤害；`size`/`speed` 兜底；`visionRange`/`attackRange` 可被配置覆盖 |
| `src/systems/CollisionSystem.js` | `getContactDamage()` / `getContactDamageInterval()`（默认 1000ms） |
| `src/systems/BossAnimation.js` | `_anchors()` 相对玩家定位（绝对坐标在相机跟随下会出屏） |
| `src/scenes/GameScene.js` | `spawnBoss` 读 `fish.json`；`checkBossSpawn` 用 `>=` + `getBossTypes()`；`_handleBossDefeated()`；`_updateSpawning` Boss 战守卫；接触伤害节流；主题切换兼容；删死字段 `spawnTimer`；调试 API `level(n)`/`maxExp()` 同步 `GrowthSystem` + `boss(type)`（第 17 个方法） |
| `src/config/__tests__/bossConfig.test.js` | 新增（9 用例） |
| `src/entities/__tests__/EnemyDamage.test.js` | 新增（6 用例） |
| `e2e/boss-fight.spec.js` | 新增（7 用例） |

**计划外但必要的修正**（均为实测/截图阶段发现）

1. **`transitionToNewTheme` 崩溃**：升级到偶数级时 `backgroundSystem.transitionToNewTheme` 不存在（`ScrollingBackground` 只有 `setTheme()`），
   异常冒泡到 Phaser 主循环 → **整个游戏冻结**。这意味着"打 Boss 时升级"在当时必然崩游戏，属必修。
2. **`__DEBUG_API__.level(n)`/`maxExp()` 自身不同步 `GrowthSystem`**：调试工具无法复现 Boss 战，先修工具才能验证功能。
3. **接触伤害节流**：`size/4`（=50）且每帧触发，贴身瞬间掉血数百；改为按敌人独立 1000ms 节流后才形成可玩的走位窗口。

**实测证据**

| 场景 | 数据 |
|------|------|
| `level(5)` 触发 | 大王乌贼 240 HP / 18 伤害 / 1600ms 攻击间隔 |
| 走位打法（Q 范围输出 + 退到 320 躲近战） | 10 次撕咬，**27.3s 击杀**，玩家几乎不掉血，`bossDefeated.squid = true` |
| 站桩贴身 | 约 **25s 玩家阵亡**（Boss 剩 15 血） |
| 血条 | 240 → 140 实时刷新，名字「大王乌贼」 |

截图：`/tmp/boss-0-warning.png`、`/tmp/boss-1-entrance.png`、`/tmp/boss-2-fight.png`、`/tmp/boss-3-damaged.png`。

**结论**：Boss 战的"走位窗口"（`attackRange` < Q 射程）是节奏设计的核心；三只 Boss 触发等级（5/8/11）现均落在等级上限 11 内。
