# 无限地图背景系统设计

**日期**: 2026-05-27
**状态**: 已批准

## 概述

游戏背景系统支持玩家在无限地图中向任意方向探索。同一主题内背景平滑扩展，每升2级触发随机主题切换。

## 需求

1. **同一关内相同主题背景不断扩展**
   - 以玩家位置为圆心，视野半径逐步扩大
   - 上下左右四个方向都可以探索
   - 无突兀的区块边界

2. **每升2级后随机换新主题**
   - 主题切换是立即触发
   - 深海/热带/极地三种主题随机切换

## 核心架构

### 玩家中心径向扩展

```
玩家位置 (playerX, playerY)
    ↓
视野半径 renderRadius = 2000
    ↓
新区域背景淡入 (alpha 0 → 1, 500ms)
    ↓
装饰元素在玩家周围生成
```

### 三层背景结构

| 层 | 职责 | 实现 |
|---|------|------|
| 基础渐变层 | 主题色背景 | 渐变填充 + tint |
| 装饰层 | 气泡/水母/光斑 | 程序化生成 |
| 过渡层 | 主题切换动画 | alpha 渐变 |

## 装饰元素管理

### 装饰元素规格

| 元素 | 生成间隔 | 数量上限 | 生命周期 | 行为 |
|------|---------|---------|---------|------|
| 气泡 | 200ms | 30 | 向外飘散直到超出视野 | 向上飘散 + 轻微水平漂移 |
| 水母 | 1000ms | 5 | 持续漂浮 | 缓慢垂直移动，方向随机 |
| 光斑 | 初始生成 | 20 | 持续存在 | 轻微闪烁，随视角移动 |

### 坐标系统

- 世界坐标: 0 到 10000（WORLD_CONFIG.WIDTH/HEIGHT）
- 装饰元素使用世界坐标
- 超出玩家视野半径 + 500px 时回收

### 生成算法

```javascript
// 气泡生成
function generateBubble(playerX, playerY) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 300;
    const x = playerX + Math.cos(angle) * distance;
    const y = playerY + Math.sin(angle) * distance;
    return { x, y, type: 'bubble' };
}
```

## 主题切换逻辑

### 触发条件

- 玩家升级时检查 `level % 2 === 0`
- 排除当前主题，随机选择新主题

### 切换流程

```
onLevelUp(newLevel) {
    if (newLevel % 2 === 0) {
        const themes = ['deep_sea', 'tropical', 'polar'].filter(t => t !== currentTheme);
        const newTheme = themes[Math.floor(Math.random() * themes.length)];
        transitionToTheme(newTheme, duration=1500);
    }
}
```

### 过渡动画

1. 当前装饰元素淡出（200ms）
2. 背景色渐变到中间色（300ms）
3. 背景色渐变到新主题色（300ms）
4. 新装饰元素淡入（200ms）
5. 总计约 1500ms

## 关键文件

| 文件 | 改动 |
|------|------|
| `src/systems/BackgroundExpansion.js` | 重写为玩家中心径向扩展 |
| `src/scenes/GameScene.js` | 添加 onLevelUp 主题切换 |
| `src/constants/ThemeConfig.js` | 新建，主题配置（颜色、装饰参数） |
| `src/systems/__tests__/BackgroundExpansion.test.js` | 新建 |

## 测试验收标准

### 运行时验证（Playwright MCP）

1. **游戏加载** — Canvas 正常渲染，无 JavaScript Error
2. **背景扩展** — 玩家向任意方向移动，背景平滑扩展，无突兀跳变
3. **装饰元素** — 气泡持续生成和飘散，数量在上限内
4. **主题切换** — 升级时观察背景颜色平滑过渡
5. **Console 检查** — 无 Error 级别日志

### 边界情况

- 向任意方向移动（上/下/左/右）都能平滑扩展
- 快速移动不产生性能问题（装饰元素数量受控）
- 主题切换动画期间无卡顿
- 返回已探索区域时背景正确显示（缓存机制）

## 实现计划

### Phase 1: 主题配置
- 创建 `ThemeConfig.js` 定义三种主题的颜色和装饰参数
- 更新 `BackgroundExpansion.js` 导入主题配置

### Phase 2: 装饰元素系统
- 实现气泡生成和管理
- 实现水母生成和管理
- 实现光斑生成

### Phase 3: 径向扩展
- 修改背景扩展算法，以玩家为中心
- 实现淡入效果

### Phase 4: 主题切换
- 在 `GameScene.js` 添加 `onLevelUp` 处理
- 实现过渡动画

### Phase 5: 验证
- Playwright MCP 运行时验证
- 确保无 Error

## 已知约束

- 装饰元素数量受控，避免性能问题
- 主题切换期间禁止其他主题切换（isTransitioning 标志）
- 使用现有的 `WORLD_CONFIG` 中的世界边界