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
| 单元测试 | `npm test` | 731 测试，44 套件 |
| E2E 冒烟 | `npx playwright test e2e/smoke.spec.js` | 7 测试 |
| 全流程 | `./init.sh` | install → test → verify |

### Test Coverage

| 模块 | 测试数 | 状态 |
|------|--------|------|
| Systems | ~600 | ✅ |
| Entities | ~80 | ✅ |
| Scenes | ~50 | ✅ |
| Config | ~5 | ✅ |

### Clean State Testing

每次主要测试前：
1. 验证 `clean-state-checklist.md` 通过
2. 运行 `npm test` 确认通过
3. 运行 E2E 测试验证完整流程

## Known Issues

1. **PNG 透明度** — 部分水母/章鱼 PNG 背景可能不透明，程序化 fallback 存在
2. **localStorage 限制** — 大数据量可能触发配额限制
3. **WebGL 兼容性** — 旧浏览器可能不支持