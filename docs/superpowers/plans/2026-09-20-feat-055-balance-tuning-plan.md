# feat-055 数值平衡实测与难度曲线修复 — 实施计划

> Spec: `docs/superpowers/specs/2026-09-20-feat-055-balance-tuning-design.md`
> 流程：TDD（先写失败测试 → 实现 → 转绿）→ E2E → 改前/改后实测对比 → 文档与状态更新

## 1. 数据层

- [x] `src/config/levels.json`：新增 `sizeGrowth`（10 项，Lv1→Lv11 累计 ≈9.4×）
- [x] 单元测试：表长度 = `experienceTable.length - 1`、每项 > 1、累计值在预期窗口内

## 2. 纯逻辑层（新增 `src/systems/BalanceCurve.js`）

- [x] `getPlayerSizeMultipliers(levelsData)`：读 `sizeGrowth`，缺失/越界回退 1.5
- [x] `getPlayerSizeAtLevel(baseSize, level, levelsData)`：累计乘积（供测试与 Boss/敌人缩放共用）
- [x] `getEnemyScale(baseSize, playerSize)`：`clamp(sqrt(playerSize/baseSize), 1, 3.2)`
- [x] `getSpawnWeights(level)`：纳入 `mutant_shark` / `giant_jellyfish`，权重和 = 1
- [x] `capContactDamage(damage, playerMaxHp, ratio = 0.25)`
- [x] 单元测试：三档阶梯（食物/中立/威胁）在 Lv1~Lv11 全程存在（表驱动断言）

## 3. 场景层接入

- [x] `GameScene.onLevelUp()`：用 `sizeGrowth` 取倍率（不再写死 1.5）
- [x] `GameScene._getSpawnWeights()`：委托 `BalanceCurve.getSpawnWeights`
- [x] `GameScene._doSpawnEnemy()`：`sizeFactor` 乘上 `getEnemyScale`
- [x] `GameScene.calculateEnemyLevel()`：区间改为「区域范围 ∪ 玩家等级邻域」
- [x] `GameScene.spawnBoss()`：Boss 尺寸 × `enemyScale`
- [x] `GameScene._handleCollisionResult()`：接触伤害过 `capContactDamage`

## 4. 工具修复

- [x] `__DEBUG_API__.spawn(type, count)`：参数错位（`1` → 类型字符串）+ 在玩家周围 300~600px 生成

## 5. 验证

- [x] `npm test` 全绿
- [x] 新增 `e2e/balance.spec.js`：spawn 落在玩家附近 / 同类型纹理正确 / 1v1 之外三档共存 / 接触伤害受上限约束
- [x] 全量 E2E 无回归（`--repeat-each=2`）
- [x] 改前/改后自动游玩对比（同一探针，120s）
- [x] `./init.sh` 5 步全过

## 6. 收尾

- [x] `docs/ARCHITECTURE.md`（BalanceCurve 入系统清单）/ `docs/PRODUCT.md`（成长曲线与难度阶梯）/ `docs/RELIABILITY.md`（平衡探针方法）/ `docs/PHASE_3_ROADMAP.md`（P0 收尾）
- [x] `feature_list.json` feat-055 completed + 证据
- [x] `progress.md` / `session-handoff.md` / `AGENTS.md` / `CLAUDE.md` / `quality-document.md` / `evaluator-rubric.md` 同步

---

## 实施结果（2026-09-20 完成）

**状态**：feat-055 已 completed，全部验证通过。

| 验证项 | 命令 | 结果 |
|--------|------|------|
| 单元测试 | `npm test` | 981 passed / 0 failed（56 suites，1 skipped） |
| E2E（本功能） | `npx playwright test e2e/balance.spec.js --project=chromium` | 7 passed |
| E2E（全量） | `npx playwright test --project=chromium` | 63 passed |
| E2E（全量 ×2） | `npx playwright test --project=chromium --repeat-each=2` | 126 passed，0 flaky |
| 环境 | `./init.sh` | 5/5 steps pass |
| 实测 | 120s 自动游玩探针 + 逐级食物链采样 | 见 spec 第 7 节 |

**新增/改动文件**

| 文件 | 变更 |
|------|------|
| `src/systems/BalanceCurve.js` | 新增（纯函数：成长表 / 体型 / 敌人缩放 / 等级分布 / 刷怪权重 / 接触伤害上限） |
| `src/systems/__tests__/BalanceCurve.test.js` | 新增（35+ 用例，含逐级三档阶梯不变量） |
| `src/config/levels.json` | 新增 `sizeGrowth`（10 项，Lv11 ≈9.4×） |
| `src/scenes/GameScene.js` | 成长曲线数据化；尺寸/耐久分职；敌人等级跟随玩家；委托 BalanceCurve 取权重；Boss 尺寸缩放；接触伤害上限；`spawn()` 修复 |
| `src/systems/BossSystem.js` | `buildBossConfig(data, level, sizeScale)` |
| `src/systems/CollisionSystem.js` | 导出 `DEFAULT_SIZE_THRESHOLD`（与平衡断言共用） |
| `src/systems/SpawnSystem.js` | 权重表委托 BalanceCurve |
| `src/systems/__tests__/SpawnSystem.test.js` | 断言按新表更新 |
| `src/systems/__tests__/EnemyLevelDist.test.js` | 改为直接测试真实实现（删除与实现不一致的内联副本） |
| `e2e/balance.spec.js` | 新增（7 用例） |

**计划外但必要的修正**

1. **拆分 size 与 hp 的缩放职责**：原计划只打算"加大敌人缩放"，实测发现难度加成乘进 `size` 后
   会把唯一可吃的虾推出可吃区间 —— 这是开局成长死锁的真正原因，必须先拆开。
2. **给低等级权重表补威胁位**：原计划只补 mutant_shark / giant_jellyfish 到高等级表，
   实测 Lv3~6 一条威胁鱼都没有，必须从 Lv1 起就留威胁位。
3. **重写 `EnemyLevelDist.test.js`**：它内联了一份与 GameScene 早已不一致的分布副本
   （"文档测试会说谎"），改为直接测 `BalanceCurve.pickEnemyLevel`。
