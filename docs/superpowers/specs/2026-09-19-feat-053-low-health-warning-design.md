# feat-053 低血量警告强化 — 设计文档

> 日期：2026-09-19 · 来源：`docs/PHASE_3_ROADMAP.md` P0 体验打磨

## 1. 现状（问题）

`UIScene` 已有一版低血量警告，但只有"红边渐变 + 固定节奏脉冲"：

| 现有实现 | 位置 | 问题 |
|----------|------|------|
| 红边 vignette，alpha = `0.8*(1-ratio/0.3)` | `UIScene._vignetteAlpha` | 只在 30% 以下可见，缺少"越危险越急促"的递进 |
| `< 15%` 时无限脉冲（固定 600ms yoyo tween） | `UIScene._drawVignette` | 节奏不随血量变化；tween 与重绘逻辑交织，难测试 |
| HP 条变红 | `UIScene._hpColor` | 只有颜色，没有文字/声音提示 |

实际体验问题：**混战中玩家注意不到屏幕边缘的红光**，尤其是血量从 30% 掉到 5% 时反馈强度完全一样，
没有"再不跑就死了"的紧迫感；也完全没有音频提示。

## 2. 目标

1. 警告强度随血量**递进**：越接近死亡，红光越强、脉冲越快。
2. 增加**听觉**提示：危险区间心跳音，间隔随血量收紧。
3. 增加**显式文字**提示（HP 条旁"危险"闪烁），保证视觉通道不止一条。
4. 把判定逻辑抽成**纯函数系统**（可 Jest 单测），`UIScene` 只负责画。
5. 数据驱动：`src/config/low_health.json`，数值可调。

## 3. 非目标

- 不改伤害/回血数值平衡（那是 P0 的另一项"数值平衡实测"）。
- 不做色盲模式（属 P2 无障碍）。
- 不改 HP 条本身的颜色规则。
- 不改死亡演出（feat-052 已完成）。

## 4. 玩法设计

| 血量比例 | 红光 alpha | 脉冲 | 心跳 | "危险"文字 |
|----------|-----------|------|------|-----------|
| ≥ 30% | 0 | — | — | 隐藏 |
| 30% → 18% | 0 → 0.8 线性 | 无 | 无 | 隐藏 |
| ≤ 18%（critical） | 0.8 → 1.0 | 1000ms → 320ms（随血量收紧） | 1200ms → 500ms | 闪烁显示 |

- **alpha** = `maxVignetteAlpha * (1 - ratio / threshold)`，`threshold = 0.3`。
- **severity** = 在 critical 区间内的归一化程度（0 = 刚好进入 critical，1 = 血量 0）。
- **脉冲**：系统内部累计相位，`pulseFactor` 在 1.0 ↔ 0.45 之间振荡；周期由 severity 插值。
  最终 `alpha = baseAlpha * pulseFactor`。用相位累计而非 tween → 纯函数、可断言、无 tween 泄漏。
- **心跳**：critical 区间内累计计时器，达到当前间隔就报一次 `heartbeatDue`。
- **文字**：与脉冲同相位闪烁（`textAlpha`），保证与红光同步。

## 5. 架构

```
src/config/low_health.json          ← 阈值/曲线/节奏参数
        ↓ 只读
src/systems/LowHealthWarningSystem.js  ← 纯逻辑：hpRatio + delta → 警告状态
        ↓ 每帧推送
src/scenes/GameScene.js   →  uiScene.updateLowHealthWarning(state)
                          →  audioSystem.play('heartbeat')   （heartbeatDue 时）
src/scenes/UIScene.js     →  只负责按 state 渲染（红光 alpha、脉冲、文字）
```

血量来源是 `GameScene.hp`，所以系统实例放在 `GameScene`，由它推送给 `UIScene`，
与既有的 `uiScene.updateUI(...)` 模式一致。

### 接口

```js
const sys = new LowHealthWarningSystem(config);
sys.update(hpRatio, delta);   // → { active, alpha, critical, severity, pulsePeriod, showText, textAlpha, heartbeatDue }
sys.reset();
sys.getHeartbeatCount();      // 累计心跳次数（可观测性 + E2E 断言）
```

## 6. 音频

`AudioSystem` 新增 `heartbeat` 类型：两次低频正弦"咚—咚"，指数衰减，音量低于 `hurt`，
避免盖过 BGM。复用现有 Web Audio 合成方式，不引入音频文件。

## 7. 可观测性

| 级别 | 日志点 |
|------|--------|
| `INFO` | 进入/离开低血量状态（`Low health warning`, `{ state: 'enter'|'exit', hpRatio }`） |
| `DEBUG` | 心跳触发（`Low health heartbeat`, `{ hpRatio, interval }`）— 高频，仅 DEBUG |

只在状态**变化**时打 INFO，避免每帧刷屏。

## 8. 验证策略

- **单元测试**（`LowHealthWarningSystem.test.js`）：阈值边界、alpha 曲线、severity、脉冲周期递进、
  心跳间隔递进与计数、文字闪烁、reset、退出 critical 后心跳停止。
- **E2E**（`e2e/low-health.spec.js`）：用新增的 `__DEBUG_API__.damage(n)` 把血量打低 →
  红光可见（`vignetteGraphics.visible/alpha`）、文字出现、心跳计数增长；`fullHealth()` 后全部消失；
  死亡演出开始时警告被清除；无 JS 错误。
- **视觉**：截图 + 像素采样确认屏幕边缘真的变红（不是"对象存在但看不见"——feat-052 踩过这个坑）。

## 9. 风险

| 风险 | 处理 |
|------|------|
| 红光遮挡游戏画面 | 只在边缘 60px 渐变，中心完全透明 |
| 心跳音过吵 | 间隔下限 500ms + 独立低音量，且仅 critical 区间 |
| 死亡演出期间红光残留 | `_triggerGameOver()` 显式清除警告状态 |
| 每帧重绘 graphics 开销 | 4 条边只画一次，之后只改 `alpha` |
