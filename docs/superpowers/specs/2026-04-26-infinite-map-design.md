# 无限地图扩展系统设计

## 概述

实现一个无限延伸的地图系统，玩家可以向任意方向探索，世界根据玩家位置动态生成内容和切换主题。

## 设计目标

1. 玩家可以向任意方向无限移动
2. 世界分为主题区域（浅海 → 珊瑚礁 → 深海 → 深渊）
3. 到达距离临界点时自动无缝切换背景主题
4. 每个主题有不同的敌人分布、视觉色调和装饰元素
5. 背景使用预制图像 + 程序化叠加实现平滑过渡

## 架构设计

### 1. 世界坐标系

- 原点 (0, 0) 为游戏开始位置
- 使用同心圆划分主题区域：
  - 0-1000px：浅海 (Shallow)
  - 1000-2500px：珊瑚礁 (Coral)
  - 2500-4500px：深海 (Deep)
  - 4500px+：深渊 (Abyss)

### 2. 主题配置 (ThemeZone)

```javascript
const THEME_ZONES = [
  {
    id: 'shallow',
    minDistance: 0,
    maxDistance: 1000,
    tint: 0xFFFFFF,
    bubbleColor: 0xAAFFDD,
    enemyLevelRange: [1, 3],
    bossType: null,
    backgrounds: ['bg_tropical_theme', ...],
    midgrounds: ['midground_tropical_theme', ...],
  },
  {
    id: 'coral',
    minDistance: 1000,
    maxDistance: 2500,
    tint: 0xFFEEDD,
    bubbleColor: 0xFFAA99,
    enemyLevelRange: [3, 6],
    bossType: null,
    backgrounds: ['bg_undersea_theme', ...],
    ...
  },
  // ... deep, abyss
];
```

### 3. 核心组件

#### MapExpansionSystem

职责：
- 追踪玩家世界坐标 (worldX, worldY)
- 计算当前所在主题区域
- 管理背景图像的动态加载和切换
- 触发主题过渡动画

关键方法：
- `updatePlayerPosition(x, y)` - 更新玩家位置
- `getCurrentZone()` - 获取当前所在区域
- `transitionToZone(zone)` - 执行区域过渡
- `preloadAdjacentZones()` - 预加载相邻区域资源

#### BackgroundExpansion

职责：
- 扩展 BackgroundSystem 支持无限背景
- 管理多张背景图像的拼接位置
- 实现程序化装饰元素（气泡、水草）

关键属性：
- `tileSize: 1024` - 背景图像尺寸
- `renderDistance: 2048` - 视野范围
- `loadedChunks: Map<string, Image>` - 已加载的chunk图像

### 4. 渲染策略

#### 背景层渲染

```
每次更新时：
1. 计算玩家世界坐标 (worldX, worldY)
2. 计算当前所在 ThemeZone
3. 确定需要渲染的背景chunk列表
4. 卸载视野外的旧chunk，加载视野内的新chunk
5. 应用主题色调和过渡效果
```

#### 主题过渡

当玩家跨越区域边界时：
1. 触发淡入淡出过渡（500ms）
2. 同时更新：
   - 背景图像
   - 气泡颜色
   - 敌人等级范围
3. 程序化元素（珊瑚、水草）同步更新

### 5. 敌人分布

- 敌人等级根据 `enemyLevelRange` 和距离计算
- 距离越远，敌人等级范围越高
- Boss 只在深渊区域 (4500px+) 生成
- 刷新率也随距离调整（远处刷新更少但更强）

### 6. 性能优化

- **Chunk 管理**：只保留视野范围内的背景chunk
- **异步预加载**：相邻区域的资源提前加载
- **LOD 系统**：远处的装饰元素简化渲染
- **对象池**：敌人和物品使用对象池复用

## 数据流

```
GameScene.update()
    ↓
MapExpansionSystem.updatePlayerPosition(player.x, player.y)
    ↓
计算当前 ThemeZone
    ↓
检查是否需要区域过渡 → 否：直接渲染
                        → 是：触发 transitionToZone()
    ↓
BackgroundExpansion.render()
    ↓
更新背景层、气泡、装饰元素
```

## 文件结构

```
src/
├── systems/
│   ├── MapExpansionSystem.js    # 新增：地图扩展核心
│   └── BackgroundExpansion.js    # 新增：背景扩展（扩展 BackgroundSystem）
├── scenes/
│   └── GameScene.js             # 修改：集成 MapExpansionSystem
└── config/
    └── zones.json               # 新增：主题区域配置
```

## 过渡动画实现

```javascript
// 主题过渡效果
transitionToZone(newZone, duration = 500) {
  // 1. 创建黑色遮罩
  const overlay = this.scene.add.graphics();
  overlay.fillStyle(0x000000, 0);
  overlay.setDepth(100);

  // 2. 淡出当前背景
  this.scene.tweens.add({
    targets: this.currentBackground,
    alpha: 0,
    duration: duration / 2
  });

  // 3. 加载新背景并淡入
  this.loadNewZoneBackground(newZone, () => {
    this.scene.tweens.add({
      targets: this.newBackground,
      alpha: 1,
      duration: duration / 2,
      onComplete: () => overlay.destroy()
    });
  });

  // 4. 更新装饰元素
  this.updateDecorations(newZone);
}
```

## 边界情况处理

| 情况 | 处理方式 |
|------|----------|
| 玩家快速移动穿越多个区域 | 使用最新区域，忽略中间过渡 |
| 资源加载未完成时玩家到达 | 显示加载指示器，等待完成 |
| 玩家向回移动到已加载区域 | 复用已缓存的chunk |
| 浏览器窗口大小改变 | 动态调整渲染范围 |

## 成功标准

1. 玩家可以向任意方向移动而不停止
2. 背景随位置平滑切换主题
3. 远处敌人明显比近处更强
4. 60fps 性能表现
5. 无明显加载卡顿
