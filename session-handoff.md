# Session Handoff

> **Harness Subsystem**: State — persists context across agent sessions
> Next agent: read this file FIRST, then run `./init.sh` before touching any code.

---

## Current State Snapshot

| Dimension | Status |
|-----------|--------|
| Features | ✅ feat-001 ~ feat-054 completed (54/54) |
| Unit tests | ✅ 942 passing, 0 failed (1 skipped), 55 suites |
| E2E tests | ✅ 56 passing, 11 spec 文件（`npx playwright test --project=chromium`，webServer 自动拉起） |
| `./init.sh` | ✅ All 5 steps pass |
| E2E | ✅ 56/56 全绿；`--repeat-each=2` → 112/112 无 flaky |
| Harness files | ✅ All present (AGENTS/CLAUDE/feature_list/progress/session-handoff/quality/evaluator-rubric/clean-state-checklist/init.sh) |
| Docs | ✅ ARCHITECTURE.md / PRODUCT.md / RELIABILITY.md / PHASE_3_ROADMAP.md all current |
| Active feature | None — Phase 3 剩余 P0：仅「数值平衡实测」；P1 候选：群体 AI（flocking） |
| Blocking issues | None |
| Repo hygiene | ✅ `node_modules`/`coverage`/`.playwright-mcp`/`test-results` 已从索引移除（5466 文件，768 tracked），`.gitignore` 已补全；⚠️ `.git` 仍 142MB（历史重写 `git filter-repo` 待决策，见下） |

---

## What Was Accomplished (2026-05-30)

### feat-054 Boss 战修复与节奏调整（2026-09-20 最新）

按 roadmap 要求用 `__DEBUG_API__` **实跑** Boss 战，结论是 **Boss 战从未真正跑通过**（此前只验证了「触发了预警」）。
本轮定位并修掉 12 个根因，Boss 战现在可稳定打完。

**改动文件**

| 文件 | 变更 |
|------|------|
| `src/config/fish.json` | 三只 Boss 补 `name/speed/damage/attackInterval/visionRange/attackRange/skills`；HP 改 `baseHp 240/280/320` + `hpPerLevel 40/50/60`；`triggerLevel` 5/8/11 |
| `src/systems/BossSystem.js` | 新增 `buildBossConfig()` / `calculateBossHp()` / `getBossKey()` / `BOSS_KEY_MAP` |
| `src/entities/BossEnemy.js` | HP/名字/攻击节奏取自配置；`executeSkill` 伤害转发到 `scene.onEnemyAttack` |
| `src/entities/Enemy.js` | Boss 用 `fishConfig.damage`；`size`/`speed` 兜底；`visionRange`/`attackRange` 支持覆盖 |
| `src/systems/CollisionSystem.js` | `getContactDamage()`（Boss 用配置值）/`getContactDamageInterval()`（默认 1000ms） |
| `src/systems/BossAnimation.js` | `_anchors()` 改相对玩家定位（绝对坐标会被相机跟随甩出屏幕） |
| `src/scenes/GameScene.js` | `spawnBoss` 读 `fish.json`；`checkBossSpawn` 用 `>=`+`getBossTypes()`；新增 `_handleBossDefeated()`；`_updateSpawning` Boss 战守卫；接触伤害节流；主题切换 `setTheme`/`transitionToNewTheme` 兼容；删死字段 `spawnTimer`；调试 API `level(n)`/`maxExp()` 同步 `GrowthSystem` + 新增 `boss(type)` |
| `e2e/boss-fight.spec.js`（新） | 7 用例：可见性 / 1v1 不刷怪 / 击败恢复刷怪 / level(5) 触发 / 偶数级不崩 / 血条名字 / Boss 会伤害玩家 |

**12 个根因（按危害排序）**

1. `spawnBoss` 内联配置缺 `size`/`speed` → `body.setCircle(NaN)` → **Boss 完全不可见、不可交互**（"Boss 战跑通"的第一因）
2. 升级到**偶数级**抛 `transitionToNewTheme is not a function` → 整个游戏循环冻结（`ScrollingBackground` 只有 `setTheme()`）——意味着"打 Boss 时升级"必然崩游戏
3. `BossEnemy.executeSkill` 的伤害返回值无人接收 → Boss 技能打不到玩家
4. `Enemy.attackPlayer` 用 `Math.log(size)`（size 缺失即 NaN）且忽略 `fishConfig.damage`
5. 接触伤害固定 `size/4` 且**无节流**（overlap 每帧触发）→ 一次贴身瞬间掉几百血
6. 「1v1 暂停刷怪」依赖自 feat-027 起就失效的死字段 `spawnTimer`；恢复刷怪用 `setInterval`（泄漏）
7. `bossDefeated` 写入 `shark_king`/`sea_dragon`、读取 `sharkKing`/`seaDragon` → 记录等于没记
8. 海龙 `triggerLevel: 15` 而等级上限 11 → 第三只 Boss 永不可达
9. `__DEBUG_API__.level(n)`/`maxExp()` 不同步 `GrowthSystem` → 无法复现 Boss 战（调试工具自身有 bug）
10. Boss 入场动画用绝对坐标，跟随相机后跑到屏幕外（feat-052 同款坑）
11. 击败后血条残留
12. `fish.json` 三只 Boss 缺 `name` → 血条无名

**实测节奏数据**

- `level(5)` → 大王乌贼 240 HP / 18 伤害 / 1600ms 间隔
- 走位打法（Q 范围 95 输出、退到 320 躲近战）：10 次撕咬、**27.3s 击杀**，玩家几乎不掉血
- 站桩贴身：约 **25s 玩家阵亡**（Boss 剩 15 血）→ 走位窗口是节奏设计的核心（`attackRange` < Q 射程）
- 截图：`/tmp/boss-0-warning.png`、`/tmp/boss-1-entrance.png`、`/tmp/boss-2-fight.png`、`/tmp/boss-3-damaged.png`

**给下一个 agent 的坑位提醒**

> 实体/战斗类改动必须先 `__DEBUG_API__` 实跑到运行时。本轮 9/12 个根因是「配置缺字段 → NaN」，
> 静态审查看不出来。最快探针：`Number.isFinite(boss.x)` + `boss.body.radius`。
> 另外 E2E 断言"Boss 存在"过了，但 Boss 肉眼不可见 —— **可见性仍要人工看截图**（延续 feat-053 的教训）。

---

### feat-052 死亡演出系统（2026-09-19）

血量归零不再硬切结算页：`hitStop`(150ms 冻结+白闪+震屏) → `impact`(700ms 镜头推进 1.0→1.3、
玩家淡出、粒子、"GAME OVER") → `fadeOut`(500ms) → `GameOverScene`。

**新增文件**

| 文件 | 说明 |
|------|------|
| `src/systems/DeathSequenceSystem.js` | 纯状态机（无 Phaser 依赖），15 单测 |
| `src/config/death_sequence.json` | 时序/视觉参数 |
| `e2e/death-sequence.spec.js` | 5 个 E2E 用例 |

**关键设计决策**

- 死亡入口统一为 `GameScene._triggerGameOver()`（原先两处重复 `scene.start('GameOverScene')` 已替换），`_isDying` 提供重入保护。
- 结算 payload 在**死亡瞬间** `_buildGameOverPayload()` 快照，演出 1.35s 不计入 `survivalTime`（有 E2E 断言）。
- 死亡后 `physics.world.pause()` 冻结世界；`onEnemyAttack` / `_handleCollisionResult` 加 `_isDying` 守卫。
- **不做物理变速慢动作**：`world.timeScale` 语义易踩坑，改用"全场冻结 + 镜头推进"达到同等戏剧感，行为完全确定。
- `__DEBUG_API__.kill()`（第 15 个方法）用于稳定触发死亡。

**给下一个 agent 的坑位提醒**

> 相机 zoom 会改变 `scrollFactor(0)` 对象的屏幕位置。需要"贴屏"的元素必须用世界坐标锚定：
> overlay 用 `camera.worldView` 左上角，屏幕居中文字用 `camera.midPoint`。
> 本会话就是靠人工看截图才抓到 "GAME OVER" 文字完全不可见的 bug（E2E 没覆盖到）。

---

### feat-053 低血量警告强化（2026-09-19 第三轮）

血量低于 30% 起给出渐进式警告：静态红色暗角 → critical（≤18%）追加脉冲 + `危险` 文字 + 心跳音。

**新增文件**

| 文件 | 说明 |
|------|------|
| `src/systems/LowHealthWarningSystem.js` | 纯逻辑状态机（无 Phaser 依赖），25 单测 |
| `src/config/low_health.json` | 阈值 / 强度曲线 / 脉冲 / 心跳 / 文字参数 |
| `e2e/low-health.spec.js` | 7 个 E2E 用例 |

**关键设计决策**

- 分层：`low_health.json` → `LowHealthWarningSystem`（纯逻辑）→ `GameScene._updateLowHealthWarning(delta)`（副作用）→ `UIScene.updateLowHealthWarning(state)`（渲染）。
- **强度曲线用 `severity ** 0.5` 而不是线性**：线性曲线在 25% 血量时 alpha 只有 0.13，实战中几乎看不见（截图对比才发现的）；开方后在 25% 血量即可感知。
- 暗角几何在 `_drawVignetteStrips()` 中**只画一次**（四条边缘渐变条，厚度 = 短边 14%），运行时只 `setAlpha()`；先写死 60px 时边缘出现明显"色带硬边"，改为按屏幕比例后过渡自然。
- critical 的脉冲是**三角波**（非 sin 的缓入缓出），配合 `minFactor=0.45` 保证"呼吸"节奏清晰。
- `__DEBUG_API__.damage(n)`（第 16 个方法）直接扣血；扣到 0 会走正常死亡流程（与 `kill()` 语义一致，E2E 有断言）。
- 死亡演出前 `_clearLowHealthWarning()`，避免结算页残留红光。

**给下一个 agent 的坑位提醒**

> 视觉类功能**务必人工看截图**。本功能的两个关键问题（25% 血量时看不见、
> 暗角边缘色带生硬）都是像素采样 + 截图才发现的，E2E 断言（alpha > 0.05）全部通过。
> 采样方法：`redness = r - (g+b)/2`，对比左边缘像素与画面中心像素。

---

### E2E 验证系统修复（feat-051, 2026-09-19）

会话开始时 E2E 实测为 **30 passed / 7 failed**（此前文档声称全过）。根因两类：

1. `smoke.spec.js` 未处理登录页 → 拿不到 `__GAME_SCENE__`；HP 断言 `undefined === undefined` **假通过**。
2. 其余 spec 硬编码 `page.mouse.click(640, 520)`；默认视口 canvas 居中导致该点落在「开始游戏」热区边缘 → 首个用例随机失败。

修复：新增 `e2e/helpers/game.js`（统一 bootstrap，坐标按 canvas bounding box × 设计比例换算，`waitFor({state:'visible'})` 替代不等待的 `isVisible()`），6 个 spec 删除本地副本，smoke 重写为 8 用例，`playwright.config.mjs` 加 `webServer`。

**验证**：37 passed；`--repeat-each=2` → 74 passed，0 flaky（删除 1 个无断言诊断 spec 前为 38）。

**给下一个 agent 的提醒**：E2E 引导一律用 `e2e/helpers/game.js`，不要再硬编码页面坐标；新 spec 必须处理「游客模式」登录浮层。

---

## Repo Hygiene（2026-09-19 已执行）

已从 git 索引移除 **5466 个文件**，`.gitignore` 补齐规则：

| 项目 | 处理 | 结果 |
|------|------|------|
| `node_modules/` | `git rm -r --cached` + `.gitignore` | 5378 文件移出索引（磁盘保留，`npm install` 照常） |
| `coverage/` | 同上 | 34 文件移出（jest 生成物） |
| `.playwright-mcp/` | 同上 | 47 个 console 日志移出 |
| `test-results/` | 同上 | `.last-run.json` 移出，不再每次跑测变脏 |
| `.DS_Store` ×4 | `git rm --cached` + 删除 | 已清理 |
| `src/scenes/BootScene.js.bak` | 删除（全仓库无引用） | 已清理 |
| `test_boot.txt` | 删除（10 字节临时文件） | 已清理 |
| `docs/.SCROLLING_WORLD_DESIGN.md.swp` | 删除（vim 残留） | 已清理 |
| `e2e/diagnose-scrolling.spec.js` | 删除（无断言，已被 scrolling-bg/scrolling-visual 覆盖） | E2E 由 38 → 37 用例 |

⚠️ **`.git` 仍有 142MB**：`git rm --cached` 只停止追踪，历史对象仍在 pack 里。若要真正瘦身需重写历史（`git filter-repo`）并强推，属于破坏性操作，**未执行**，需另行决策。

| 剩余问题 | 现状 | 建议 |
|------|------|------|
| `GameScene.js` 体量 | 2470 行 | 后续新功能按需继续提取系统 |
| 未跟踪设计文档 | `docs/superpowers/{specs,plans}/2026-06-0*.md` 共 4 个（feat-050/051 设计+计划） | 按仓库惯例应入库 |

### ScrollingWorld Implementation (feat-046 ~ feat-049)

| feat | 内容 | Tests |
|------|------|-------|
| feat-046 | DepthColorMapper 纯函数 + ScrollingBackground 基础层 | 850 total |
| feat-047 | 视差层(0.08/0.25/0.50) + DepthFog + ScrollEdge + BubblePool | 850 total |
| feat-048 | Prng(mulberry32) + DecorationPool(chunk管理,200上限) | 850 total |
| feat-049 | 删除BackgroundExpansion, GameScene→ScrollingBackground, 文档更新 | 850 total |

**新增文件:**
- `src/systems/DepthColorMapper.js` — worldY→颜色/雾/bubble（纯函数）
- `src/systems/ScrollingBackground.js` — 深度渐变+3层视差+DepthFog+ScrollEdge+BubblePool
- `src/systems/DecorationPool.js` — 程序化装饰对象池
- `src/utils/Prng.js` — mulberry32 PRNG
- `src/config/depth_gradient.json` — 深度颜色配置
- `scripts/preprocess_textures.py` — 纹理预处理脚本
- 对应测试文件 × 4

**删除文件:**
- `src/systems/BackgroundExpansion.js`

**关键设计:**
- 世界尺寸: 20000×20000，出生点 (10000, 14000)
- 5 个深度区域: surface/shallow/mid/deep/abyss
- 深度雾: worldY>12000 时 alpha 0→0.65

**Bug 修复:**
- `themeConfig?.name` 空指针 → 添加可选链
- `survivalSeconds` 缩进错误 → 已修复
- `_createTileLayers` Graphics 占位符 → 改为 `add.image` 加载真实纹理

**CLAUDE.md 更新:**
- 新增"交付标准"章节，禁止占位符实现
- 工作规则新增第3条：禁止占位符交付

### feat-044/045 + E2E Debug API (2026-05-30 ~ 2026-05-31)

| feat | 内容 | Tests |
|------|------|-------|
| feat-044 | Type Effectiveness Activation(2.0x 强 / 0.5x 弱,可变 sizeThreshold) | 855 total |
| feat-045 | Skill Synergy System(rush_bite / storm_slash,3s 队列窗口) | 855 total |
| E2E-debug | `window.__DEBUG_API__` 14 methods + 16 E2E tests | 855 unit + 16 E2E |

---

## Feature Completion Summary

| Range | Category | Count | Status |
|-------|----------|-------|--------|
| feat-001 ~ feat-024 | 核心游戏功能 | 24 | ✅ All completed |
| feat-025 ~ feat-033 | 架构重构（8个系统提取） | 9 | ✅ All completed |
| feat-034 ~ feat-040 | 增强功能 | 7 | ✅ All completed |
| feat-041 | 无限地图系统 | 1 | ✅ completed |
| feat-042 | Background Bug Fix | 1 | ✅ completed |
| feat-043 | 技能数值平衡 | 1 | ✅ completed |
| feat-044 | 属性相克激活 | 1 | ✅ completed |
| feat-045 | 技能协同系统 | 1 | ✅ completed |
| feat-046 ~ feat-049 | ScrollingWorld | 4 | ✅ All completed |
| feat-050 | 战斗反馈动画 | 1 | ✅ completed |
| feat-051 | E2E 验证系统修复 | 1 | ✅ completed |
| feat-052 | 死亡演出系统 | 1 | ✅ completed |
| feat-053 | 低血量警告强化 | 1 | ✅ completed |
| feat-054 | Boss 战修复与节奏调整 | 1 | ✅ completed |
| **Total** | | **54** | **54 ✅ / 0 ⏳** |

---

## Next Phase Direction

54/54 features complete。Next phase candidates in [`docs/PHASE_3_ROADMAP.md`](docs/PHASE_3_ROADMAP.md)(P0 体验打磨 / P1 动作演出 / P1 群体 AI / P2 极限计时 / P2 无障碍)。

P0 已完成 feat-050(反馈动画)、feat-052(死亡演出)、feat-053(低血量警告)、feat-054(Boss 战修复与节奏)。
**P0 仅剩「数值平衡实测」**——注意它与 feat-054 已产出的量化数据高度重叠（乌贼 27.3s 走位击杀 vs 25s 站桩阵亡），
下一轮很可能只需：把同一套 `__DEBUG_API__` 实测法跑遍三只 Boss + 各技能，产出平衡表并微调 `fish.json`/`skills.json`。
若不满足于收尾，P1 群体 AI(flocking) 是下一个独立特性，走 brainstorming → spec → plan。

---

## Architecture Decisions (updated)

| Module | Decision |
|--------|----------|
| ScrollingBackground | 使用 `add.image` + `setPosition` 实现视差，而非 TileSprite |
| DepthColorMapper | 纯静态函数，委托给 ScrollingBackground 内部 `_compute*` 方法 |
| DecorationPool | chunk 种子决定装饰分布，同位置可复现 |
| Prng | mulberry32，相同种子相同序列 |

---

## Verification Evidence

| Check | Command | Result |
|-------|---------|--------|
| All unit tests | `npm test` / `./init.sh` | 942 passed, 0 failed (55 suites) |
| E2E 全量 | `npx playwright test --project=chromium` | 56 passed, 0 failed |
| E2E 稳定性 | `npx playwright test --project=chromium --repeat-each=2` | 112 passed, 0 flaky |
| Boss 战可见性 | `__DEBUG_API__.boss('squid')` + 坐标探针 + 截图 | Boss 坐标有限、落在视口内，乌贼肉眼可见，血条名字「大王乌贼」 |
| Boss 战节奏 | `__DEBUG_API__` 实测 | 乌贼 240 HP：走位 10 次撕咬 27.3s 击杀；站桩约 25s 阵亡 |
| Boss 击败记录 | `__DEBUG_API__.state()` | `bossDefeated.squid = true`（此前 key 不一致恒为 false） |
| 死亡演出视觉 | 人工截图 | 镜头推进 + 文字居中 + 玩家淡出 + 结算页正常，Console 无 Error |
| 低血量警告视觉 | 人工截图 | 25% 红光可见不挡视野、critical 脉冲 + 危险文字，Console 无 Error |
| Syntax check | `node --check src/scenes/GameScene.js` | Pass |

---

## Next Session Startup

```bash
# Step 1: Orient
./init.sh              # must pass before ANY code changes
cat feature_list.json  # check pending features
cat progress.md       # review history
cat docs/PHASE_3_ROADMAP.md   # Phase 3 candidates

# Step 2: Choose work
# Option A: P0 收尾 —— 数值平衡实测（三只 Boss + 技能 TTK/掉落/难度曲线，产出平衡表）
# Option B: P1 群体 AI（Enemy Flocking：separation/alignment/cohesion）

# Step 3: Implement + verify + update docs
```
