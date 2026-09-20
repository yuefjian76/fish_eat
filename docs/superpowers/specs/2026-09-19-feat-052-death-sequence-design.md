# feat-052 死亡演出系统 — 设计文档

> 日期：2026-09-19 · 状态：已实现 · 来源：`docs/PHASE_3_ROADMAP.md` P0 体验打磨

## 1. 问题

玩家血量归零时，`GameScene` 直接硬切到 `GameOverScene`：

```js
// src/scenes/GameScene.js:844（吃鱼碰撞路径）
// src/scenes/GameScene.js:1472（敌人攻击路径）
this.scene.start('GameOverScene', { score, level, difficulty, kills, survivalTime });
```

问题有三：

1. **没有死亡反馈** — 玩家在满屏敌鱼中突然看到结算页，不知道发生了什么，情绪断点缺失。
2. **结算数据有两处重复实现** — 两条路径各自拼 payload，改字段容易漏改一处。
3. **没有重入保护** — 同一帧内多只敌鱼同时命中时，`scene.start()` 会被调用多次。

## 2. 目标

- 血量归零后播放约 1.3 秒的死亡演出，再进入结算页。
- 演出数据驱动（新增 `src/config/death_sequence.json`），时序可调。
- 死亡瞬间冻结世界，避免"死后还被追打"。
- 结算 payload 在**死亡瞬间**计算（`survivalTime` 不能把演出时长算进去）。
- 两条死亡路径统一到单一入口，具备重入保护。
- 保留 E2E 可验证性：`__DEBUG_API__.kill()` 可手动触发死亡。

## 3. 非目标

- 不改 `GameOverScene` 的布局与结算逻辑。
- 不改技能/护盾的减伤规则。
- 不做复活、连击中断等新玩法机制。
- 不引入新音频资源（复用 `AudioSystem` 现有 `hurt` 音效）。

## 4. 演出设计

三阶段，总时长约 1350ms（含 tween 收尾）：

| 阶段 | 时长 | 表现 |
|------|------|------|
| `hitStop` | 150ms | 物理世界暂停（全场冻结）；白屏闪光 + 镜头震动 |
| `impact` | 700ms | 镜头推进（zoom 1.0 → 1.3）对准玩家；玩家淡出；颗粒爆散；"GAME OVER" 文字缩放浮现 |
| `fadeOut` | 500ms | 镜头淡出至黑，然后 `scene.start('GameOverScene', payload)` |

设计取舍：

- **不做变速慢动作**：Arcade Physics 的 `world.timeScale` 语义（值越大越慢）容易踩坑，且会与冻结策略互相干扰。改用"全场冻结 + 镜头推进"达到同等的戏剧感，行为完全确定。
- **镜头推进而不是拉远**：聚焦死亡瞬间的玩家，强化"被吃掉"的失败感。
- **HUD 不受影响**：`UIScene` 是独立场景、独立相机，死亡演出只作用于 `GameScene` 主相机。

## 5. 架构

遵循仓库分层（Scene 控制流 / System 纯逻辑 / Config 数据）：

```
src/config/death_sequence.json      ← 时序与视觉参数
        ↓ 只读
src/systems/DeathSequenceSystem.js  ← 纯状态机（无 Phaser 依赖，可 Jest 单测）
        ↓ DI + 回调
src/scenes/GameScene.js             ← 只负责把 phase 映射成 Phaser 副作用
```

`DeathSequenceSystem` 只做一件事：给定 `delta`，推进时间轴并报告**当前阶段**与**是否结束**。
所有 Phaser 调用（暂停物理、镜头、粒子、淡出）都留在 `GameScene`，与 `WaveSystem` / `GrowthSystem` 的既有模式一致。

### 接口

```js
const sys = new DeathSequenceSystem(config);
sys.start();                    // → true；已在播放中则 false（重入保护）
sys.update(delta);              // → { phase, phaseChanged, progress, done }
sys.isActive();                 // → boolean
sys.getPhase();                 // → 'idle' | 'hitStop' | 'impact' | 'fadeOut' | 'done'
sys.reset();
```

## 6. GameScene 集成

```js
_triggerGameOver() {            // 唯一死亡入口（两条路径都调用它）
    if (this._isDying) return;  // 重入保护
    this._isDying = true;
    this._deathPayload = this._buildGameOverPayload();  // 死亡瞬间快照
    this.physics.world.pause();
    this.player.body.setVelocity(0, 0);
    this.cameras.main.flash(150, 255, 255, 255);
    this.cameras.main.shake(150, 0.012);
    this.audioSystem?.play('hurt');
    this.deathSequence.start();
}
```

`update()` 首行插入早退分支：

```js
if (this._isDying) { this._updateDeathSequence(delta); return; }
```

早退后波次、刷怪、碰撞、回血全部停止——这正是"冻结"的语义。

## 7. 可观测性

| 级别 | 日志点 |
|------|--------|
| `INFO` | `Game over triggered` `{ score, level, kills, hp }` |
| `INFO` | `Death sequence phase` `{ phase }` |
| `INFO` | `Game over transition` `{ survivalTime }` |

## 8. 验证策略

- **单元测试**（`DeathSequenceSystem.test.js`）：阶段顺序、边界推进、`done` 只报告一次、重入保护、自定义配置、`reset()`。
- **E2E**（`e2e/death-sequence.spec.js`）：`kill()` 触发 → `_isDying` 为 true 且物理暂停 → 镜头推进 → `GameOverScene` 激活 → 无 JS 错误 → 二次 `kill()` 被拒绝。
- **浏览器手动**：正常游玩至死亡，确认冻结/推进/淡出连贯，HUD 不受影响。

## 9. 风险

| 风险 | 处理 |
|------|------|
| 物理暂停后忘记恢复 | 不恢复——场景直接切走；`init()` 中 `_isDying = false` 复位 |
| 演出期间玩家输入仍生效 | `update()` 首行早退，输入处理不执行 |
| 结算时间被演出拉长 | payload 在 `_triggerGameOver()` 内即时快照 |
| E2E 等待时间不足 | E2E 用 `waitForFunction` 等到 `GameOverScene` 激活，而非固定 sleep |
