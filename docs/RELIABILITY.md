# Reliability -- 鱼吃鱼 (Fish Eat Fish)

## Debug Logging

### Overview

项目使用 `DebugLogger` 系统输出结构化日志，支持 4 个日志级别：
- **DEBUG** — 常规数据访问（列出、读取文件）
- **INFO** — 重要事件（吃鱼、升级、死亡）
- **WARN** — 非关键缺失数据（找不到资源）
- **ERROR** — 失败（文件不存在、解析错误）

### Logger API

```javascript
import { logger } from '../systems/DebugLogger.js';

// 基本日志
logger.debug('Player moved to', { x: 100, y: 200 });
logger.info('Enemy eaten', { fishType: 'clownfish', expGain: 50 });
logger.warn('Resource not found', { resource: 'spritesheet' });
logger.error('Failed to load', { error: e.message });

// 获取服务专属 logger
const gameLogger = logger.forService('GameScene');
gameLogger.info('Game started', { difficulty: 'normal' });
```

### Log Format

每个日志条目是单行 JSON：

```json
{
  "timestamp": "2026-05-27T12:00:00.000Z",
  "level": "INFO",
  "service": "game-scene",
  "message": "Enemy eaten",
  "data": {
    "fishType": "clownfish",
    "expGain": 50,
    "playerLevel": 3
  }
}
```

### 关键日志点

**GameScene:**
- 游戏开始/结束
- 吃鱼成功（fishType, expGain, newLevel）
- 升级触发（level, skillUnlocked）
- 玩家受伤（damage, remainingHp）
- 波次状态切换（waveState, spawnInterval）

**SpawnSystem:**
- 敌鱼创建（fishType, x, y）
- 刷怪权重（weights, playerLevel）

**CollisionSystem:**
- 碰撞结果（type: eat/damaged, fishType）
- 吃鱼判定（canEat: true/false, sizeRatio）

**SkillSystem:**
- 技能使用（skillId, success, cooldownRemaining）
- 技能冷却（skillId, remainingTime）

## Clean State Management

### Purpose

Clean state 管理确保测试和开发从已知空状态开始，防止累积数据影响结果或导致意外行为。

### Reset Mechanism

GameScene 支持通过 `scene.restart()` 重置所有系统：

```javascript
// GameScene.init()
const systemConfigs = {
    waveSystem: { calmDuration: 8000, surgeDuration: 4000, ... },
    spawnSystem: { fishData: this.fishData, difficulty: this.difficulty, ... },
    // ...
};

this.waveSystem.reset(systemConfigs.waveSystem);
this.spawnSystem.reset(systemConfigs.spawnSystem);
```

每个系统实现 `reset(config)` 方法：
- WaveSystem — 重置波次状态为 calm
- SpawnSystem — 重置刷怪计时器
- CollisionSystem — 清空碰撞状态
- FloatingTextSystem — 清空活跃文本
- HealthRegenSystem — 重置 HP 和战斗计时器

### When to Use Clean State

- 开发新功能前
- 测试特定场景
- 调试问题
- 运行 E2E 测试

### Verification

使用 `clean-state-checklist.md` 验证：
- Build 通过（npm test）
- 架构边界正确
- 运行时行为正确
- 日志输出正常

## Performance Benchmarks

### Overview

游戏性能目标：

| 指标 | 目标 | 说明 |
|------|------|------|
| 游戏加载 | <3s | BootScene 资源加载 |
| 帧率 | 60 FPS | 稳定帧率 |
| 碰撞检测 | O(n) | 空间分区优化 |
| 波次切换 | 即时 | 无延迟 |
| 敌人 AI | <1ms/帧 | 状态机开销 |

### Benchmark 方法

使用 browser console 或 Playwright 测量：

```javascript
// 帧率测量
console.time('frame');
// game loop
console.timeEnd('frame');

// 加载时间测量
const start = performance.now();
await page.goto('http://localhost:8080');
await page.waitForSelector('canvas');
console.log(`Load time: ${performance.now() - start}ms`);
```

### Performance Tips

1. **碰撞检测** — 使用 spatial partitioning 减少检测次数
2. **对象池** — 敌人和投射物复用
3. **渲染优化** — 仅更新可见对象
4. **状态机** — 简化 AI 逻辑，避免每帧复杂计算

## Testing Strategy

### Test Layers

| 层 | 命令 | 覆盖 |
|----|------|------|
| 单元测试 | `npm test` | 每个系统的纯逻辑 |
| E2E 冒烟 | `npx playwright test e2e/smoke.spec.js` 或 Playwright MCP | 游戏加载 + 核心功能 |
| 全流程 | `./init.sh` | install → test → verify |

### E2E Testing Requirements

E2E 测试验证游戏完整流程，确保功能可集成。测试应覆盖：

- **菜单界面** — 登录/注册/游客模式入口正常
- **游戏加载** — Canvas 渲染，场景切换无崩溃
- **核心循环** — 玩家移动、碰撞、吃鱼、升级流程正常
- **UI 响应** — HUD 显示、技能栏、技能使用正常

运行 E2E 验证：
```bash
# 方式 1: Playwright MCP（推荐，在 Claude Code 中使用 browser_* 工具）
# 方式 2: 命令行
npx playwright test e2e/smoke.spec.js --project=chromium
# 方式 3: 内置 HTTP server
python3 -m http.server 8765 &
npx playwright test e2e/smoke.spec.js
```

### Clean State Testing

每次主要测试前：
1. 验证 `clean-state-checklist.md` 通过
2. 运行 `npm test` 确认通过
3. 运行 E2E 测试验证完整流程

## Known Issues

1. **PNG 透明度** — 部分水母/章鱼 PNG 背景可能不透明，程序化 fallback 存在
2. **localStorage 限制** — 大数据量可能触发配额限制
3. **WebGL 兼容性** — 旧浏览器可能不支持

## Debug Mode

游戏支持 Debug 模式，可通过 URL 参数 `?debug=true` 启用：

### 暴露的全局变量

| 变量 | 访问 | 用途 |
|------|------|------|
| `window.__PHASER_GAME__` | 浏览器控制台 | Phaser 游戏实例 |
| `window.__GAME_SCENE__` | 浏览器控制台 | 当前 GameScene 实例 |

### Debug Overlay

DEBUG 模式下，GameScene 显示只读状态面板：

```
Wave: calm | HP: 50/50 | Score: 0 | Level: 1 | Enemies: 5
```

### 运行时调试

在浏览器控制台直接检查游戏状态：

```javascript
// 查看波次状态
__GAME_SCENE__.waveSystem.getState()

// 查看敌鱼数量
__GAME_SCENE__.enemies.length

// 查看玩家血量
__GAME_SCENE__.hp

// 查看分数
__GAME_SCENE__.score

// 强制升级（测试用）
__GAME_SCENE__.growthSystem.addExp(100)
```

## Observability Checklist

新功能开发时，确保满足可观测性要求：

- [ ] 所有系统使用 `logger.forService('SystemName')` 输出日志
- [ ] 关键事件使用 INFO 级别（游戏开始、升级、死亡、Boss 出现）
- [ ] 每帧更新使用 DEBUG 级别（移动、碰撞检测）
- [ ] 错误使用 ERROR 级别，并包含上下文数据
- [ ] 日志格式为 JSON，包含 timestamp、level、service、message、data
- [ ] 新功能上线前在 Playwright MCP 中验证 Console 无 Error