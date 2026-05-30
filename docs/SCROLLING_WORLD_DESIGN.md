# Scrolling World System — 设计文档 (TDD)

**Feature Group**: feat-046 ~ feat-049  
**依赖需求文档**: `docs/SCROLLING_WORLD_REQUIREMENTS.md`  
**编写日期**: 2026-05-30

---

## 1. 架构总览

### 1.1 新增文件清单

```
src/
  config/
    depth_gradient.json          # 深度颜色分段配置（新增）
  systems/
    ScrollingBackground.js       # 主背景系统（新增，替代 BackgroundExpansion）
    DecorationPool.js            # 程序化装饰对象池（新增）
    __tests__/
      ScrollingBackground.test.js  # 单元测试（TDD，先于实现）
      DecorationPool.test.js       # 单元测试（TDD，先于实现）
  constants/
    WorldConfig.js               # 修改：20000×20000，出生点 (10000,14000)
scripts/
  preprocess_textures.py         # 一次性执行：生成镜像拼接纹理（新增）
src/assets/images/seamless/
  bg_undersea_seamless.jpg       # 水平镜像拼接版（2560×720，新增）
  bg_tropical_seamless.jpg
  bg_polar_seamless.jpg
  mid_undersea_seamless.jpg
  mid_tropical_seamless.jpg
  fg_undersea_seamless.jpg
```

### 1.2 修改文件清单

```
src/constants/WorldConfig.js      # WIDTH/HEIGHT → 20000, SPAWN → (10000,14000)
src/scenes/GameScene.js           # 替换 BackgroundExpansion → ScrollingBackground
src/scenes/BootScene.js           # 加载 seamless 纹理 + depth_gradient.json
docs/ARCHITECTURE.md              # 新增系统描述
feature_list.json                 # 新增 feat-046~049
```

### 1.3 删除文件（feat-049 执行）

```
src/systems/BackgroundExpansion.js   # 删除（功能被 ScrollingBackground 全覆盖）
```

---

## 2. 坐标系设计

### 2.1 世界坐标映射

```
worldY = 0          ───── 世界顶部（极浅海，最亮）
                    │
worldY = 2000       ───── 浅海带（珊瑚、阳光光柱）
                    │
worldY = 4000       ───── 中浅层（海草开始出现）
                    │
worldY = 8000       ───── 中深层（礁石、暗礁）
                    │
worldY = 12000      ───── 深海起点（深度雾开始）
                    │
worldY = 14000      ★── 出生点 (10000, 14000)
                    │
worldY = 16000      ───── 深渊（生物发光、极暗）
                    │
worldY = 20000      ───── 世界底部（最深，接近黑色）
```

### 2.2 深度区域划分

| 区域 ID | worldY 范围 | 名称 | 颜色基调 | 主要装饰 |
|---------|------------|------|---------|---------|
| `surface` | 0 ~ 2000 | 浅海 | 亮青绿 `#64c8d2` | 阳光光柱、水面波纹 |
| `shallow` | 2000 ~ 4000 | 珊瑚礁 | 青蓝 `#1ea0b4` | 珊瑚、小气泡 |
| `mid` | 4000 ~ 8000 | 中层 | 深蓝 `#0a5064` | 海草、礁石 |
| `deep` | 8000 ~ 12000 | 深海 | 暗蓝 `#062b42` | 大岩石、稀疏气泡 |
| `abyss` | 12000 ~ 20000 | 深渊 | 接近黑 `#02050f` | 发光生物、深度雾 |

### 2.3 相机坐标关系

```javascript
// Phaser camera.scrollX/Y = 相机左上角的世界坐标
// 玩家中心的世界坐标：
playerWorldX = camera.scrollX + 512   // (viewportWidth / 2)
playerWorldY = camera.scrollY + 384   // (viewportHeight / 2)

// 深度梯度颜色计算使用 playerWorldY（即 camera.scrollY + 384）
// 这样颜色中心与玩家位置对齐
```

---

## 3. 模块设计

### 3.1 `depth_gradient.json`

```json
{
  "stops": [
    { "worldY": 0,     "color": "0x64c8d2" },
    { "worldY": 2000,  "color": "0x1ea0b4" },
    { "worldY": 8000,  "color": "0x0a5064" },
    { "worldY": 14000, "color": "0x062b42" },
    { "worldY": 20000, "color": "0x02050f" }
  ],
  "fogStart": 12000,
  "fogEnd":   20000,
  "fogColor": "0x010818",
  "fogMaxAlpha": 0.65
}
```

设计说明：
- `stops` 数组按 worldY 升序排列，每两个相邻 stop 之间线性插值
- 颜色计算函数为纯函数，输入 worldY 输出 0xRRGGBB 整数，便于单元测试
- 颜色 stop 可在 JSON 修改，无需改代码

### 3.2 `ScrollingBackground.js` — 类设计

```javascript
/**
 * ScrollingBackground
 * 
 * 职责:
 *   - 管理 DepthGradient（颜色梯度层）
 *   - 管理 3 个 TileSprite 纹理层（BgLayer / MidLayer / FgLayer）
 *   - 管理 DepthFog（深度雾效层）
 *   - 管理 ScrollEdge（卷轴边缘效果）
 *   - 管理 BubblePool（气泡对象池）
 *   - 每帧接受 camera 状态，驱动所有层更新
 * 
 * 不负责:
 *   - 程序化装饰（由 DecorationPool 负责）
 *   - Zone 判断（由 MapExpansionSystem 负责）
 *   - 主题切换动画（通过 setTheme() 接口支持）
 */
class ScrollingBackground {
    constructor(scene, gradientConfig, options = {})
    
    // 公开方法
    create()                                    // 创建所有 Phaser 对象
    update(cameraScrollX, cameraScrollY, delta) // 每帧更新
    setTheme(themeKey)                          // undersea / tropical / polar
    destroy()                                   // 清理所有资源
    
    // 内部方法（下划线前缀）
    _createDepthGradient()
    _createTileLayers()
    _createDepthFog()
    _createScrollEdge()
    _createBubblePool()
    _updateDepthGradient(playerWorldY)
    _updateTileLayers(cameraScrollX)
    _updateDepthFog(playerWorldY)
    _updateBubbles(cameraScrollX, cameraScrollY, delta)
    _computeDepthColor(worldY)          // 纯函数，可单元测试
    _interpolateColor(colorA, colorB, t) // 纯函数，可单元测试
    _worldYToDepthZone(worldY)          // 纯函数，可单元测试
}
```

**关键常量（类内静态）**：

```javascript
static LAYER_CONFIG = {
    bg:  { parallaxX: 0.08, alpha: 0.55, depth: 1 },
    mid: { parallaxX: 0.25, alpha: 0.40, depth: 2 },
    fg:  { parallaxX: 0.50, alpha: 0.22, depth: 3 },
};
static EDGE_WIDTH = 120;        // 卷轴边缘暗化宽度 px
static EDGE_ALPHA = 0.4;        // 边缘最大 alpha
static BUBBLE_POOL_SIZE = 40;   // 气泡池上限
static VIEWPORT_W = 1024;
static VIEWPORT_H = 768;
```

### 3.3 `DecorationPool.js` — 类设计

```javascript
/**
 * DecorationPool
 * 
 * 职责:
 *   - 根据相机视口位置，维护视口附近的装饰对象
 *   - 使用确定性 PRNG（mulberry32）按 chunk 坐标生成装饰
 *   - 超出视口 + buffer 的装饰自动回收入池
 *   - 依深度区域选择装饰类型
 * 
 * 不负责:
 *   - 渲染（通过 Phaser scene.add.graphics 创建对象，托管给 Phaser）
 *   - 颜色梯度（由 ScrollingBackground 负责）
 */
class DecorationPool {
    constructor(scene, gradientConfig)
    
    // 公开方法
    update(cameraScrollX, cameraScrollY, playerWorldY)
    destroy()
    
    // 内部方法
    _getChunkKey(chunkX, chunkY)               // 纯函数
    _chunkSeed(chunkX, chunkY)                 // 纯函数：mulberry32 种子
    _generateChunk(chunkX, chunkY, worldY)
    _recycleDistantChunks(cameraCX, cameraCY)
    _createCoral(x, y, seed)                   // 程序绘制珊瑚
    _createSeaweed(x, y, seed)                 // 程序绘制海草
    _createRock(x, y, seed)                    // 程序绘制岩石
    _createGlowParticle(x, y, seed)            // 深层发光粒子
    _createSunRay(x, y, seed)                  // 浅层阳光光柱
    _worldYToZone(worldY)                      // 纯函数：返回区域 ID
    
    static CHUNK_W = 1024;   // chunk 宽度（与视口宽度对齐）
    static CHUNK_H = 768;    // chunk 高度
    static MAX_POOL_SIZE = 50;
    static BUFFER_CHUNKS = 2; // 视口外保留 2 个 chunk 宽度
}
```

**PRNG 设计（mulberry32，50行内实现）**：

```javascript
// 确定性伪随机，相同种子相同输出
static _mulberry32(seed) {
    return function() {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// 使用方式：
const rng = DecorationPool._mulberry32(chunkSeed);
const x = rng() * CHUNK_W;
const y = rng() * CHUNK_H;
const scale = 0.5 + rng() * 1.5;
```

### 3.4 `WorldConfig.js` — 修改

```javascript
// 修改前
export const WORLD_CONFIG = {
    WIDTH: 10000,
    HEIGHT: 10000,
    SPAWN_MARGIN: 500,
    DESPAWN_MARGIN: 2000
};

// 修改后
export const WORLD_CONFIG = {
    WIDTH: 20000,
    HEIGHT: 20000,
    SPAWN_X: 10000,    // 新增：玩家出生 X
    SPAWN_Y: 14000,    // 新增：玩家出生 Y（深海区，向上可到浅海）
    SPAWN_MARGIN: 500,
    DESPAWN_MARGIN: 2000,
    VIEWPORT_W: 1024,
    VIEWPORT_H: 768,
};
```

---

## 4. TDD 测试计划

### 4.1 feat-046 测试文件：`ScrollingBackground.test.js`

**原则**：所有 Phaser 对象全部 mock，只测纯逻辑函数。

#### Group A：`_computeDepthColor(worldY)` — 颜色计算

```javascript
describe('_computeDepthColor', () => {
    // A-01: worldY=0 返回最浅颜色
    test('worldY=0 returns surface color 0x64c8d2')
    
    // A-02: worldY=20000 返回最深颜色
    test('worldY=20000 returns abyss color 0x02050f')
    
    // A-03: worldY=14000（出生点）返回中间色
    test('worldY=14000 returns deep color approx 0x062b42')
    
    // A-04: worldY=8000（两 stop 中间）返回插值色
    test('worldY=8000 interpolates between mid and deep stops')
    
    // A-05: 超出范围 worldY<0 夹紧到0
    test('worldY<0 clamps to stop[0] color')
    
    // A-06: 超出范围 worldY>20000 夹紧到最大
    test('worldY>20000 clamps to last stop color')
    
    // A-07: 颜色值在 [0x000000, 0xFFFFFF] 范围内
    test('returned color is always a valid 24-bit integer')
})
```

#### Group B：`_interpolateColor(colorA, colorB, t)` — 颜色插值

```javascript
describe('_interpolateColor', () => {
    // B-01: t=0 返回 colorA
    test('t=0 returns colorA exactly')
    
    // B-02: t=1 返回 colorB
    test('t=1 returns colorB exactly')
    
    // B-03: t=0.5 返回中间色（RGB 各分量平均）
    test('t=0.5 returns midpoint color')
    
    // B-04: t 夹紧到 [0,1]
    test('t<0 clamps to colorA')
    test('t>1 clamps to colorB')
})
```

#### Group C：`_worldYToDepthZone(worldY)` — 区域判断

```javascript
describe('_worldYToDepthZone', () => {
    // C-01 ~ C-05: 各区间返回正确 zone ID
    test('worldY=1000 returns "surface"')
    test('worldY=3000 returns "shallow"')
    test('worldY=6000 returns "mid"')
    test('worldY=10000 returns "deep"')
    test('worldY=15000 returns "abyss"')
    
    // C-06: 边界值（恰好在 stop 上）
    test('worldY=2000 (boundary) returns "shallow" not "surface"')
    test('worldY=4000 (boundary) returns "mid"')
})
```

#### Group D：DepthFog alpha 计算

```javascript
describe('_computeFogAlpha(worldY)', () => {
    // D-01: worldY < fogStart → alpha=0
    test('worldY=11999 returns fog alpha 0')
    
    // D-02: worldY = fogStart → alpha=0
    test('worldY=12000 returns fog alpha 0')
    
    // D-03: worldY = fogEnd → alpha=maxAlpha(0.65)
    test('worldY=20000 returns fog alpha 0.65')
    
    // D-04: worldY 中间线性插值
    test('worldY=16000 returns fog alpha ~0.325')
})
```

#### Group E：Bubble Pool 配置计算

```javascript
describe('_bubbleConfigForDepth(worldY)', () => {
    // E-01: 浅层 → 气泡小、密
    test('worldY=2000 returns small radius and high count')
    
    // E-02: 深层 → 气泡大、稀
    test('worldY=15000 returns large radius and low count')
    
    // E-03: count 不超过 BUBBLE_POOL_SIZE
    test('count never exceeds BUBBLE_POOL_SIZE')
})
```

#### Group F：构造与生命周期（mock Phaser）

```javascript
describe('ScrollingBackground lifecycle', () => {
    // F-01: create() 不抛异常
    test('create() executes without throwing')
    
    // F-02: update() 在 create() 前调用不崩溃
    test('update() before create() is safe no-op')
    
    // F-03: destroy() 后 update() 不崩溃
    test('update() after destroy() is safe no-op')
    
    // F-04: setTheme() 接受合法 key
    test('setTheme("undersea") does not throw')
    test('setTheme("unknown") logs warn and does not throw')
})
```

### 4.2 feat-047 测试文件：`ScrollingBackground.test.js`（追加）

#### Group G：TileSprite 视差更新

```javascript
describe('_updateTileLayers(cameraScrollX)', () => {
    // G-01: BgLayer tilePositionX = cameraScrollX * 0.08
    test('bg layer tilePositionX is cameraScrollX * PARALLAX_BG')
    
    // G-02: MidLayer tilePositionX = cameraScrollX * 0.25
    test('mid layer tilePositionX is cameraScrollX * PARALLAX_MID')
    
    // G-03: FgLayer tilePositionX = cameraScrollX * 0.50
    test('fg layer tilePositionX is cameraScrollX * PARALLAX_FG')
    
    // G-04: 各层 tilePositionX 互不相同（视差有差异）
    test('three layers have distinct tilePositionX values for same cameraScrollX')
})
```

#### Group H：ScrollEdge 存在性

```javascript
describe('ScrollEdge', () => {
    // H-01: create() 后存在 4 个 edge graphics 对象
    test('creates 4 edge overlay graphics after create()')
    
    // H-02: scrollFactor=0
    test('edge graphics have scrollFactor 0')
})
```

### 4.3 feat-048 测试文件：`DecorationPool.test.js`

#### Group I：PRNG 确定性

```javascript
describe('DecorationPool PRNG', () => {
    // I-01: 相同种子输出相同序列
    test('same seed produces same sequence')
    
    // I-02: 不同种子输出不同序列
    test('different seeds produce different sequences')
    
    // I-03: 输出范围 [0, 1)
    test('output is always in [0, 1)')
})
```

#### Group J：Chunk 坐标与种子

```javascript
describe('chunk key and seed', () => {
    // J-01: _getChunkKey 确定性
    test('same (chunkX, chunkY) always returns same key')
    
    // J-02: 不同 chunk 种子不同
    test('adjacent chunks produce different seeds')
    
    // J-03: 种子为整数（不含浮点误差）
    test('_chunkSeed returns integer')
})
```

#### Group K：zone 判断

```javascript
describe('_worldYToZone', () => {
    // K-01 ~ K-05: 与 ScrollingBackground._worldYToDepthZone 一致
    // （两个类可以共享同一个纯函数，或独立测试）
    test('returns correct zone for each depth range')
})
```

#### Group L：对象池回收

```javascript
describe('pool recycling', () => {
    // L-01: update() 后 pool size 不超过 MAX_POOL_SIZE
    test('active pool never exceeds MAX_POOL_SIZE')
    
    // L-02: 同一 chunkKey 不重复创建
    test('same chunk is not generated twice without recycling')
    
    // L-03: 相机移动超过 buffer 距离后旧 chunk 被回收
    test('chunks beyond buffer distance are recycled')
})
```

### 4.4 feat-049 测试文件：`WorldConfig.test.js`（新增）

```javascript
describe('WorldConfig', () => {
    // M-01: 世界尺寸
    test('WIDTH and HEIGHT are 20000')
    
    // M-02: 出生点
    test('SPAWN_X is 10000 and SPAWN_Y is 14000')
    
    // M-03: 出生点在世界范围内
    test('spawn point is within world bounds')
    
    // M-04: 出生点向上有足够空间
    test('SPAWN_Y allows at least 12000px upward exploration')
    
    // M-05: 出生点向下有足够空间
    test('SPAWN_Y allows at least 6000px downward exploration')
})
```

---

## 5. 分阶段实现计划

### feat-046：坐标系重构 + DepthGradient + TileSprite 基础层

**目标**：建立可运行的最小系统，验证 TileSprite 视差方向正确，颜色随深度变化。

**实现步骤**（TDD 顺序）：

```
Step 1 [TEST]: 编写 Group A + B + C + F 的所有测试
               → npm test → 全部 RED（因为 ScrollingBackground.js 不存在）

Step 2 [CODE]: 实现 ScrollingBackground._computeDepthColor()
               实现 ScrollingBackground._interpolateColor()
               实现 ScrollingBackground._worldYToDepthZone()
               → npm test → Group A/B/C GREEN，F 仍 RED

Step 3 [CODE]: 实现 ScrollingBackground.create() / update() / destroy()
               （mock 友好设计：Phaser 对象通过 scene.add.* 创建，便于 mock）
               → npm test → Group F GREEN

Step 4 [INTEGRATION]: 在 GameScene 中替换 BackgroundExpansion → ScrollingBackground
                      调整 WorldConfig（20000×20000，出生点 10000,14000）
                      GameScene.create() 中：
                        this.backgroundSystem = new ScrollingBackground(...)
                        this.backgroundSystem.create()
                      GameScene.update() 中：
                        this.backgroundSystem.update(
                            this.cameras.main.scrollX,
                            this.cameras.main.scrollY,
                            delta
                        )

Step 5 [SCRIPT]: 执行 scripts/preprocess_textures.py 生成 seamless 纹理
                 检查生成文件在 src/assets/images/seamless/

Step 6 [VERIFY]: 浏览器测试：向上移动颜色变浅，向右移动无接缝
                 → init.sh 全部通过

```

**DoD**：见 feature_list.json feat-046

---

### feat-047：视差完善 + 深度雾 + 卷轴边缘

**目标**：完整的5层视觉系统，深海压迫感，画卷感。

**实现步骤**：

```
Step 1 [TEST]: 编写 Group D + E + G + H 的所有测试
               → npm test → 全部 RED

Step 2 [CODE]: 实现 _computeFogAlpha()
               实现 _bubbleConfigForDepth()
               实现 _updateTileLayers() (已有 tilePositionX 逻辑)
               → npm test → Group D/E GREEN

Step 3 [CODE]: 实现 ScrollEdge（4个 Graphics，各边渐变）
               实现 DepthFog（单 Graphics，深度 alpha 控制）
               实现 BubblePool（40个预分配 Graphics，循环复用）
               → npm test → Group G/H GREEN

Step 4 [VERIFY]: 浏览器测试：
                 - worldY > 12000 时雾效出现
                 - 四边缘有轻微暗化
                 - 3 层视差明显（慢/中/快）
                 - 气泡随深度变化
```

**DoD**：见 feature_list.json feat-047

---

### feat-048：程序化装饰系统

**目标**：DecorationPool 实现，同深度不同位置有装饰差异。

**实现步骤**：

```
Step 1 [TEST]: 编写 Group I + J + K + L 的所有测试
               → npm test → 全部 RED

Step 2 [CODE]: 实现 DecorationPool._mulberry32()（PRNG）
               实现 _getChunkKey() / _chunkSeed()
               实现 _worldYToZone()
               → npm test → Group I/J/K GREEN

Step 3 [CODE]: 实现对象池核心：_generateChunk() / _recycleDistantChunks()
               实现各区域绘制方法：_createCoral() / _createSeaweed() / 
                 _createRock() / _createGlowParticle() / _createSunRay()
               → npm test → Group L GREEN

Step 4 [INTEGRATION]: 在 GameScene 中实例化 DecorationPool
                      GameScene.update() 中调用：
                        this.decorationPool.update(
                            this.cameras.main.scrollX,
                            this.cameras.main.scrollY,
                            this.player.y
                        )

Step 5 [VERIFY]: 浏览器测试：
                 - 相同位置两次路过，装饰一致
                 - 不同 X 位置，装饰有差异
                 - 浅层有光柱，深层有发光粒子
                 - 移动中无明显性能下降
```

**DoD**：见 feature_list.json feat-048

---

### feat-049：清理与收尾

**目标**：删除废弃代码，MapExpansionSystem Y轴化，完整测试。

**实现步骤**：

```
Step 1 [TEST]: 编写 Group M (WorldConfig) 测试
               检查现有 MapExpansionSystem 测试覆盖 Y轴zone

Step 2 [CODE]: 删除 BackgroundExpansion.js
               删除 BackgroundSystem.js 中 chunk 相关死代码
               MapExpansionSystem._computeCurrentZoneId() 改为 Y轴映射：
                 - 不再用 radial 欧氏距离
                 - 改为 worldY → zone（与 depth_gradient.json stop 对齐）

Step 3 [TEST]: 修正 MapExpansionSystem 的受影响测试
               → npm test → GREEN

Step 4 [VERIFY]: init.sh 全部通过，文件数净减少
                 浏览器完整流程测试（菜单→游戏→移动→深度变化→zone变化）
```

**DoD**：见 feature_list.json feat-049

---

## 6. 接口规范

### 6.1 GameScene 调用接口

```javascript
// GameScene.create() 中：
this.backgroundSystem = new ScrollingBackground(
    this,                    // scene
    gradientConfig,          // 从 cache.json.get('depthGradient') 读取
    {
        worldWidth:  WORLD_CONFIG.WIDTH,   // 20000
        worldHeight: WORLD_CONFIG.HEIGHT,  // 20000
        viewportW:   WORLD_CONFIG.VIEWPORT_W,  // 1024
        viewportH:   WORLD_CONFIG.VIEWPORT_H,  // 768
        theme: 'undersea',   // 初始主题
    }
);
this.backgroundSystem.create();

// GameScene.update(time, delta) 中：
this.backgroundSystem.update(
    this.cameras.main.scrollX,   // number
    this.cameras.main.scrollY,   // number
    delta                         // number (ms)
);

// GameScene._onLevelUp() 中（每2级切换主题）：
if (this.level % 2 === 0) {
    const nextTheme = this.backgroundSystem.getNextTheme();
    this.backgroundSystem.setTheme(nextTheme, 1500);  // 1500ms 过渡
}
```

### 6.2 DecorationPool 调用接口

```javascript
// GameScene.create() 中：
this.decorationPool = new DecorationPool(this, gradientConfig);

// GameScene.update() 中：
this.decorationPool.update(
    this.cameras.main.scrollX,   // number
    this.cameras.main.scrollY,   // number
    this.player.y                 // number (playerWorldY)
);
```

### 6.3 `ScrollingBackground` 不暴露的内部状态

以下属性通过下划线前缀标记为私有，外部不应访问：
- `_gradientLayer`（Graphics）
- `_tileLayers`（TileSprite[]）
- `_fogLayer`（Graphics）
- `_edgeOverlays`（Graphics[4]）
- `_bubblePool`（Graphics[]）

---

## 7. 文件修改边界（Scope Guard）

### feat-046 可修改的文件
```
新建: src/systems/ScrollingBackground.js
新建: src/systems/__tests__/ScrollingBackground.test.js
新建: src/config/depth_gradient.json
新建: scripts/preprocess_textures.py
新建: src/assets/images/seamless/*.jpg
修改: src/constants/WorldConfig.js
修改: src/scenes/GameScene.js  （仅 backgroundSystem 相关行）
修改: src/scenes/BootScene.js  （仅加载新资源）
修改: feature_list.json
修改: docs/ARCHITECTURE.md
```

### feat-047 可修改的文件
```
修改: src/systems/ScrollingBackground.js  （新增方法）
修改: src/systems/__tests__/ScrollingBackground.test.js  （新增测试）
```

### feat-048 可修改的文件
```
新建: src/systems/DecorationPool.js
新建: src/systems/__tests__/DecorationPool.test.js
修改: src/scenes/GameScene.js  （仅 decorationPool 相关行）
```

### feat-049 可修改的文件
```
删除: src/systems/BackgroundExpansion.js
修改: src/systems/BackgroundSystem.js  （删除 chunk 死代码）
修改: src/systems/MapExpansionSystem.js  （Y轴 zone 映射）
修改: src/systems/__tests__/MapExpansionSystem.test.js  （更新测试）
新建: src/constants/__tests__/WorldConfig.test.js
```

---

## 8. 测试数量预估

| feat | 新增测试数 | 测试类型 |
|------|-----------|---------|
| feat-046 | ~20 | 纯函数单元测试（颜色/插值/zone）+ 生命周期 |
| feat-047 | ~12 | 视差更新、fog alpha、bubble config |
| feat-048 | ~16 | PRNG、chunk seed、pool 回收 |
| feat-049 | ~8  | WorldConfig、MapExpansionSystem Y轴 zone |
| **合计** | **~56** | 全部 unit，无 E2E（背景为纯视觉，E2E 不适用） |

完成后 init.sh 预计通过测试总数：**765 + 56 = ~821**

---

## 9. 回滚策略

若某个 feat 实现中出现严重阻塞：

1. **feat-046 阻塞**（TileSprite scrollFactor 行为异常）：
   - 回退方案：使用 `setScrollFactor(0)` + 手动在 update 中设置 `x = scene.cameras.main.scrollX + offset`
   - 不影响颜色梯度层（Graphics 不依赖 TileSprite）

2. **feat-047 阻塞**（DepthFog 性能问题）：
   - 回退方案：改为 Image + setAlpha，不用 Graphics 重绘
   - 或降低雾效帧更新频率（每5帧更新一次）

3. **feat-048 阻塞**（装饰对象池内存泄漏）：
   - 回退方案：简化为固定视口内随机装饰，不做 chunk 种子
   - DoD 中装饰"一致性"条款降级为 Should（非 Must）

---

## 10. 与现有系统的关系

```
保持不变:
  MapExpansionSystem     zone 判断（feat-049 改为 Y轴前保持原样）
  BattleSystem           feat-044 实现中，不影响
  SkillSystem            feat-043 已完成，不影响
  CollisionSystem        不影响

feat-046 开始替换:
  BackgroundExpansion    → ScrollingBackground（并行期，两者共存）
  WorldConfig            → 扩大到 20000×20000

feat-049 清理:
  BackgroundExpansion    删除
  BackgroundSystem       保留（ScrollingBackground 不继承它，独立实现）
```
