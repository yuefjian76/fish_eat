# feat-052 死亡演出系统 — 实施计划

> 日期：2026-09-19 · Spec：`docs/superpowers/specs/2026-09-19-feat-052-death-sequence-design.md`

## 步骤

### 1. 配置（数据层）

- [x] 新建 `src/config/death_sequence.json`：`hitStop` / `impact` / `fadeOut` / `text` 四块
- [x] `GameScene.preload()` 加载 `deathSequence`

### 2. 系统（逻辑层，TDD）

- [x] 先写 `src/systems/__tests__/DeathSequenceSystem.test.js`
- [x] 再写 `src/systems/DeathSequenceSystem.js`（纯状态机，无 Phaser 依赖）

### 3. 集成（场景层）

- [x] `GameScene.init()`：`this._isDying = false`、`this._deathPayload = null`
- [x] `create()`：`new DeathSequenceSystem(this.cache.json.get('deathSequence'))`
- [x] 新增 `_buildGameOverPayload()` — 取代两处重复 payload
- [x] 新增 `_triggerGameOver()` — 唯一死亡入口 + 重入保护
- [x] 新增 `_updateDeathSequence(delta)` — phase → Phaser 副作用
- [x] `update()` 首行加 `_isDying` 早退分支
- [x] 替换 `GameScene.js:844` 与 `GameScene.js:1472` 两处 `scene.start('GameOverScene')`

### 4. 调试能力

- [x] `__DEBUG_API__` 新增 `kill()`（无伤触发死亡演出）
- [x] 更新 `help()` 清单

### 5. 验证

- [x] `npm test` 全绿（含新单测）
- [x] 新建 `e2e/death-sequence.spec.js` 并通过
- [x] `npx playwright test --project=chromium` 全量无回归
- [x] 浏览器手动确认演出连贯、HUD 正常、Console 无 Error

### 6. 收尾

- [x] `docs/ARCHITECTURE.md` 系统表新增 DeathSequenceSystem
- [x] `docs/PRODUCT.md` 新增死亡演出章节
- [x] `docs/RELIABILITY.md` 日志点补齐
- [x] `feature_list.json` 新增 feat-052 并置 completed
- [x] `progress.md` / `session-handoff.md` / `CLAUDE.md` / `quality-document.md` 同步计数

---

## 实施结果（2026-09-19）

全部步骤完成。验证：`npm test` 878 passed；`npx playwright test --project=chromium` 42 passed；
`--repeat-each=2` → 84 passed（0 flaky）；截图人工确认演出连贯。

### 计划外的发现（已修复）

1. **"GAME OVER" 文字完全不可见** — `setScrollFactor(0)` 的对象在相机 zoom 下会按视口中心缩放，
   文本世界坐标 (512,384) 相对玩家（约 10000,14000）落在视口外。
   修复：按 `camera.midPoint` 世界坐标锚定并每帧居中；并补 `worldView.contains()` E2E 断言。
2. **debug overlay 被 zoom 推出屏幕** — 同类问题。修复：去掉 `setScrollFactor(0)`，
   每帧按 `camera.worldView` 左上角定位（zoom=1 行为不变）。
3. 物理世界在演出期间保持暂停（原计划一度在 impact 阶段 resume，评估后回退，避免死后仍被攻击）。
