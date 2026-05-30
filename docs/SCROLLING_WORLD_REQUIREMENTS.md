# Scrolling World System — 需求文档 (PRD)

**Feature Group**: feat-046 ~ feat-049  
**状态**: 设计阶段（未实现）  
**依赖**: feat-043 已完成  
**编写日期**: 2026-05-30

---

## 1. 背景与动机

### 1.1 现有问题

当前无限地图系统（feat-041，`BackgroundExpansion`）存在三个根本性缺陷：

1. **视觉接缝**：`BackgroundExpansion` 的 Chunk 系统把背景图贴在世界坐标，但底层 `BackgroundSystem.createBackground()` 同时把5张图固定在屏幕坐标 `(512, 384)`，两套系统互相干扰，实际上背景没有随相机正确移动。

2. **无深度感**：世界的 Y 轴没有视觉意义。玩家向上或向下移动时背景外观完全相同，违背"上浅下深"的海洋物理规律。

3. **无卷轴展开感**：`chunks` 在视口边缘硬切加载，没有"画卷慢慢展开"的渐进揭示效果。

### 1.2 目标

构建一套新的背景系统 `ScrollingBackground`，实现：
- 真实的海洋深度视觉（Y轴越大越深越暗）
- 多层视差滚动（3层图片纹理 + 颜色梯度底层）
- 水平方向无缝无限延伸
- 卷轴画卷式的边缘揭示效果
- 同深度不同水平位置有随机装饰差异

---

## 2. 用户故事

```
US-01  作为玩家，当我向上游动时，我应该看到海水逐渐变浅、颜色变亮，
       感受到正在接近水面。
       
US-02  作为玩家，当我向下潜水时，我应该看到海水逐渐变暗变蓝，
       深渊区域接近黑色，产生压迫感。
       
US-03  作为玩家，向左右移动时，背景应该无缝连续滚动，
       不出现任何可见的拼接线或硬切边。
       
US-04  作为玩家，向未探索区域移动时，
       视口边缘应该有轻微的暗化渐变，像画卷慢慢展开的感觉。
       
US-05  作为玩家，在相同深度的不同水平位置，
       应该看到不同的海底装饰（珊瑚密集区 vs 岩石区 vs 空旷水域），
       增加探索欲望。
       
US-06  作为玩家，不同深度区域应该有不同的装饰元素：
       浅层有阳光光柱和珊瑚；中层有海草和礁石；深层有发光生物。

US-07  作为玩家，游戏帧率不应因背景系统受到明显影响（桌面 60fps）。
```

---

## 3. 功能需求

### 3.1 世界坐标系（FR-COORD）

| ID | 需求 | 优先级 |
|----|------|--------|
| FR-COORD-01 | 世界尺寸为 20000×20000 像素 | Must |
| FR-COORD-02 | 玩家出生点为 `(10000, 14000)` | Must |
| FR-COORD-03 | Y 轴语义：Y 值越小 = 越浅（接近水面）；Y 值越大 = 越深 | Must |
| FR-COORD-04 | 相机跟随玩家，bounds 为整个 20000×20000 世界 | Must |
| FR-COORD-05 | 出生点向上（Y 减小方向）有 14000px 探索空间 | Must |
| FR-COORD-06 | 出生点向下（Y 增大方向）有 6000px 探索空间，底部为深渊 | Must |
| FR-COORD-07 | 左右各有 10000px 探索空间 | Must |

### 3.2 深度颜色系统（FR-DEPTH）

| ID | 需求 | 优先级 |
|----|------|--------|
| FR-DEPTH-01 | 背景底色随 `camera.scrollY`（即玩家 worldY）实时计算，每帧更新 | Must |
| FR-DEPTH-02 | 颜色分5个区间平滑插值，不得出现颜色跳变 | Must |
| FR-DEPTH-03 | 浅层（worldY 0~2000）：亮青绿 `#64c8d2` → `#1ea0b4` | Must |
| FR-DEPTH-04 | 中层（worldY 2000~8000）：深蓝 `#1ea0b4` → `#0a5064` | Must |
| FR-DEPTH-05 | 深层（worldY 8000~14000）：深蓝黑 `#0a5064` → `#062b42`（出生点色调） | Must |
| FR-DEPTH-06 | 深渊（worldY 14000~20000）：接近纯黑 `#062b42` → `#02050f` | Must |
| FR-DEPTH-07 | 颜色梯度层使用 `setScrollFactor(0)` 固定到相机，不随世界坐标偏移 | Must |
| FR-DEPTH-08 | 颜色梯度层深度 `depth=0`，在所有其他层之下 | Must |

### 3.3 纹理平铺系统（FR-TILE）

| ID | 需求 | 优先级 |
|----|------|--------|
| FR-TILE-01 | 使用 `Phaser.GameObjects.TileSprite` 实现背景纹理图层 | Must |
| FR-TILE-02 | 共 3 个纹理层：BgLayer（远景）、MidLayer（中景）、FgLayer（前景） | Must |
| FR-TILE-03 | 每层纹理使用"水平镜像拼接"预处理图（宽 2560px = 原图 1280 + 水平翻转），消除水平接缝 | Must |
| FR-TILE-04 | 所有纹理层 `scrollFactorY = 0`（Y 方向不随相机偏移，消除垂直接缝） | Must |
| FR-TILE-05 | `tilePositionX` 每帧根据 `camera.scrollX × parallaxFactor` 更新，实现水平视差 | Must |
| FR-TILE-06 | BgLayer：`parallaxFactorX = 0.08`，`alpha = 0.55`，`depth = 1` | Must |
| FR-TILE-07 | MidLayer：`parallaxFactorX = 0.25`，`alpha = 0.40`，`depth = 2` | Must |
| FR-TILE-08 | FgLayer：`parallaxFactorX = 0.50`，`alpha = 0.22`，`depth = 3` | Must |
| FR-TILE-09 | 纹理层叠加在颜色梯度层之上，通过 alpha 让底色透过，产生"色彩染色"效果 | Must |
| FR-TILE-10 | TileSprite 宽高与视口一致（1024×768），使用 `setScrollFactor(0)` 固定到相机 | Must |

### 3.4 深度雾效（FR-FOG）

| ID | 需求 | 优先级 |
|----|------|--------|
| FR-FOG-01 | 深度雾效层（DepthFog）在 worldY > 12000 时开始出现 | Must |
| FR-FOG-02 | worldY = 12000 时 fog alpha = 0；worldY = 20000 时 fog alpha = 0.65 | Must |
| FR-FOG-03 | 雾效颜色为深蓝黑 `0x010818`，`setScrollFactor(0)`，`depth = 4` | Must |
| FR-FOG-04 | 雾效覆盖整个视口（1024×768 矩形），无边缘渐变（靠 alpha 控制强度） | Must |

### 3.5 卷轴边缘效果（FR-EDGE）

| ID | 需求 | 优先级 |
|----|------|--------|
| FR-EDGE-01 | 视口四条边各有一个渐变暗化条，宽度 120px | Should |
| FR-EDGE-02 | 渐变从边缘向内由黑（alpha 0.4）→ 透明（alpha 0） | Should |
| FR-EDGE-03 | 所有边缘条 `setScrollFactor(0)`，`depth = 5` | Should |
| FR-EDGE-04 | 四边常态均显示（不区分运动方向），增强"画框感" | Should |

### 3.6 气泡系统（FR-BUBBLE）

| ID | 需求 | 优先级 |
|----|------|--------|
| FR-BUBBLE-01 | 气泡在相机视口范围内生成，跟随相机（`scrollFactor=1`，世界坐标） | Must |
| FR-BUBBLE-02 | 浅层（worldY < 4000）：气泡小（r=3~8px）、密（30个）、速度快（2s） | Should |
| FR-BUBBLE-03 | 中层（worldY 4000~12000）：气泡中（r=5~15px）、中（20个）、中速（4s） | Should |
| FR-BUBBLE-04 | 深层（worldY > 12000）：气泡大（r=8~20px）、稀（10个）、速度慢（8s） | Should |
| FR-BUBBLE-05 | 气泡颜色随深度变化：浅层亮蓝绿；深层暗蓝紫 | Should |
| FR-BUBBLE-06 | 气泡移出视口顶部后重置到视口底部（循环池，不新建对象） | Must |

### 3.7 程序化装饰系统（FR-DECO）

| ID | 需求 | 优先级 |
|----|------|--------|
| FR-DECO-01 | 装饰元素按玩家 worldX 和 worldY 的确定性哈希种子生成 | Must |
| FR-DECO-02 | 相同 (worldX, worldY) 区域重复经过时，装饰一致（相同种子） | Must |
| FR-DECO-03 | 浅层（worldY < 4000）：阳光光柱（竖向渐变条）+ 珊瑚（程序绘制） | Should |
| FR-DECO-04 | 中层（worldY 4000~12000）：海草（摆动曲线）+ 岩石（随机多边形） | Should |
| FR-DECO-05 | 深层（worldY > 12000）：发光粒子（bioluminescence，小圆 + glow） | Should |
| FR-DECO-06 | 装饰对象池：视口外超过 1200px 的装饰自动回收，移入视口时重新配置 | Must |
| FR-DECO-07 | 装饰层不参与物理碰撞，纯视觉 | Must |
| FR-DECO-08 | 同深度不同 X 区域的装饰密度和类型有差异（通过种子哈希决定） | Should |

### 3.8 系统生命周期（FR-LIFECYCLE）

| ID | 需求 | 优先级 |
|----|------|--------|
| FR-LIFECYCLE-01 | `ScrollingBackground` 构造时接受 `(scene, worldWidth, worldHeight)` | Must |
| FR-LIFECYCLE-02 | `create()` 方法完成所有 Phaser 对象创建 | Must |
| FR-LIFECYCLE-03 | `update(cameraScrollX, cameraScrollY, delta)` 每帧由 GameScene 调用 | Must |
| FR-LIFECYCLE-04 | `destroy()` 清理所有 Phaser 对象，无内存泄漏 | Must |
| FR-LIFECYCLE-05 | `setTheme(themeKey)` 支持切换纹理主题（undersea/tropical/polar） | Should |

---

## 4. 非功能需求

### 4.1 性能（NFR-PERF）

| ID | 需求 |
|----|------|
| NFR-PERF-01 | 桌面浏览器（Chrome/Firefox）稳定 60fps，背景系统 CPU 占用 < 3ms/帧 |
| NFR-PERF-02 | TileSprite 层数 ≤ 3，Graphics 重绘层数 ≤ 2（DepthGradient + DepthFog） |
| NFR-PERF-03 | 装饰对象池上限 50 个对象，超出时回收最远的 |
| NFR-PERF-04 | 气泡对象池上限 40 个对象 |
| NFR-PERF-05 | `DepthGradientLayer` 每帧只 `clear()` + 重绘 3 个矩形，不重新创建对象 |

### 4.2 可维护性（NFR-MAINT）

| ID | 需求 |
|----|------|
| NFR-MAINT-01 | `ScrollingBackground.js` 单文件，不超过 400 行 |
| NFR-MAINT-02 | `DecorationPool.js` 独立文件，不超过 200 行 |
| NFR-MAINT-03 | 深度颜色配置以 JSON 数据形式存储（`src/config/depth_gradient.json`） |
| NFR-MAINT-04 | 所有 magic number 以常量形式命名（如 `PARALLAX_BG = 0.08`） |
| NFR-MAINT-05 | 使用 `DebugLogger` 记录关键事件（深度区域变化、对象池回收次数） |

### 4.3 测试覆盖（NFR-TEST）

| ID | 需求 |
|----|------|
| NFR-TEST-01 | 所有纯逻辑函数（颜色计算、坐标转换、哈希种子）必须有单元测试 |
| NFR-TEST-02 | TDD：先写测试，测试失败后再写实现 |
| NFR-TEST-03 | 不得使用真实 Phaser 对象（全部 mock） |
| NFR-TEST-04 | 每个 feat 完成时 `init.sh` 全部通过 |

### 4.4 兼容性（NFR-COMPAT）

| ID | 需求 |
|----|------|
| NFR-COMPAT-01 | 不破坏 feat-044、feat-045 的实现（这两个 feature 可以并行进行） |
| NFR-COMPAT-02 | `MapExpansionSystem`（zone 追踪）在重构后仍然正常工作 |
| NFR-COMPAT-03 | `BackgroundExpansion` 在 feat-049 之前保留（不删除），feat-049 统一清理 |
| NFR-COMPAT-04 | GameScene 中对 backgroundSystem 的 `update()` 和 `updateBackground()` 调用接口不变 |

---

## 5. 约束与边界

### 5.1 不在范围内（Out of Scope）

- 不实现"水面"特效（玩家到达 worldY=0 的边界处理）
- 不实现动态天气效果（雨/雪）
- 不实现光照反射计算（Phaser 不原生支持实时光照）
- 不修改敌鱼生成逻辑（仍由 MapExpansionSystem zone 控制）
- 不实现背景物体碰撞（装饰纯视觉）

### 5.2 技术约束

- Phaser 3.60（CDN 版本，无构建步骤）
- 纹理预处理由 Python 脚本（`scripts/preprocess_textures.py`）在本地执行，结果提交到 `src/assets/images/seamless/`
- TileSprite 的 `tilePositionY` **不使用**（避免垂直接缝）
- `blendMode` 不依赖 MULTIPLY（Phaser 3 Canvas fallback 下可能不支持）

### 5.3 已知风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| TileSprite setScrollFactor 行为与预期不符 | 中 | 高 | feat-046 第一步用最小 demo 验证 |
| 镜像纹理在视觉上对称感明显 | 中 | 低 | 3 层视差叠加时对称感被掩盖；可用随机 X offset |
| Graphics 重绘 DepthGradient 每帧性能开销 | 低 | 中 | 只绘 3 个矩形，实测后决定是否改为 `setTint` |
| 装饰池哈希不稳定（浮点数精度） | 低 | 中 | 使用整数 chunk 坐标作为种子 |

---

## 6. 验收标准（Acceptance Criteria）

### AC-01：深度颜色（对应 US-01/02）
```
Given: 玩家从出生点 (10000, 14000) 向上移动到 (10000, 2000)
When:  观察背景颜色
Then:  背景颜色从深蓝（#062b42）逐渐变为亮青绿（#64c8d2），无颜色跳变
```

### AC-02：水平无缝（对应 US-03）
```
Given: 玩家从 (10000, 14000) 向右移动 5000px 再向左移动 5000px
When:  观察背景水平方向
Then:  背景连续滚动，无任何可见拼接线（接缝色差 < 5/255）
```

### AC-03：卷轴边缘（对应 US-04）
```
Given: 游戏运行中，相机跟随玩家
When:  观察视口四条边
Then:  每条边内侧 120px 有轻微暗化渐变，增强画框感
```

### AC-04：装饰差异化（对应 US-05）
```
Given: 玩家在 worldY=14000 深度
When:  向右移动 3000px 后向左移回原位
Then:  途中至少看到 2 种不同视觉区域；
       且回到原位时装饰与离开前一致（种子稳定性）
```

### AC-05：性能（对应 NFR-PERF-01）
```
Given: 游戏运行中，背景系统完整工作
When:  Chrome DevTools Performance 录制 5 秒
Then:  平均帧时间 < 16.7ms；背景相关函数总计 < 3ms/帧
```

---

## 7. 术语表

| 术语 | 含义 |
|------|------|
| worldY | 世界坐标 Y 值，等于 `camera.scrollY + viewportHeight/2`（玩家中心） |
| scrollY | Phaser camera.scrollY，即相机左上角的 Y 坐标，约等于 `worldY - 384` |
| TileSprite | Phaser 3 的 `GameObjects.TileSprite`，纹理可无限平铺 |
| tilePositionX | TileSprite 内部纹理的水平偏移，修改此值实现无缝横向滚动 |
| scrollFactor | Phaser GameObject 属性，控制对象随相机移动的速率（0=固定，1=跟随） |
| parallaxFactor | 各背景层的水平视差系数（BgLayer=0.08，MidLayer=0.25，FgLayer=0.50） |
| DecorationPool | 装饰元素的对象池，按 chunk 坐标哈希生成装饰，视口外时回收 |
| DepthGradient | 按 worldY 计算颜色的全屏 Graphics 层（depth=0） |
| DepthFog | 深层半透明覆盖层，增强深海压迫感（depth=4，worldY>12000 时显示） |
| seamless texture | 边缘色彩一致、可无缝平铺的图片（本项目通过镜像拼接生成） |
| chunk | 以 1024×768 为单位划分的世界区域，用于装饰池的种子计算 |
