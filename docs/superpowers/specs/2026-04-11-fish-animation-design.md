# 鱼动画系统改进设计方案

**日期:** 2026-04-11
**状态:** 设计完成，等待实现
**负责人:** Claude AI

---

## 1. 概述

### 1.1 项目背景

《鱼吃鱼》游戏当前使用基于帧的图片轮播实现鱼动画，存在以下问题：
- 鱼不会跟随移动方向转向
- 动画较为生硬，缺乏流畅度
- 难以实现动作细节和特效
- 多鱼种动画制作成本高

### 1.2 目标

引入骨骼动画系统，提升鱼的视觉质量和动画表现力：
- 流畅的游泳动画（骨骼驱动）
- 自然的方向转向（骨骼旋转）
- 丰富的动作细节（鳞片、鳍摆动等）
- 高效的动画复用

---

## 2. 技术方案

### 2.1 核心技术选型

**选用工具:** Spine (3.8.99)

**选择理由:**
- Phaser 3 官方支持 Spine 插件
- 成熟的动画编辑生态
- 骨骼动画数据与贴图分离
- 支持动画混合和平滑过渡
- 社区资源丰富

### 2.2 资产制作流程

```
MiniMax AI 生成高质量鱼图片
         ↓
人工处理/导入 Spine 编辑器
         ↓
绑定骨骼 + 创建动画
         ↓
导出 .json + .png 贴图
         ↓
集成到游戏
```

### 2.3 资源清单

#### 2.3.1 已生成的鱼种 Pose 图片

| 鱼种 | 文件名 | 尺寸 | 风格 |
|------|--------|------|------|
| 小丑鱼 (Player) | `fish_clownfish_pose.jpg` | 512x512 | 橙色，白条纹 |
| 鲨鱼 | `fish_shark_pose.jpg` | 512x512 | 灰色，流线型 |
| 鲨鱼之王 (BOSS) | `fish_shark_king_pose.jpg` | 512x512 | 金色王冠，帝王气场 |
| 小虾 | `fish_shrimp_pose.jpg` | 512x512 | 粉色，弯曲身体 |
| 琵琶鱼 | `fish_anglerfish_pose.jpg` | 512x512 | 深紫色，发光诱饵 |
| 水母 | `fish_jellyfish_pose.jpg` | 512x512 | 透明浅蓝，发光 |
| 海马 | `fish_seahorse_pose.jpg` | 512x512 | 金色，卷曲尾巴 |
| 章鱼 | `fish_octopus_pose.jpg` | 512x512 | 紫色，8条触手 |
| 鳗鱼 | `fish_eel_pose.jpg` | 512x512 | 黄色，长身体 |
| 变异鲨鱼 | `fish_mutant_shark_pose.jpg` | 512x512 | 红色，突变效果 |
| 巨型水母 | `fish_giant_jellyfish_pose.jpg` | 512x512 | 青色，大型 |
| 大王乌贼 (BOSS) | `fish_boss_squid_pose.jpg` | 512x512 | 深红色，巨大 |
| 海底巨龙 (BOSS) | `fish_boss_sea_dragon_pose.jpg` | 512x512 | 蓝色，龙身 |

**存放路径:** `src/assets/images/`

#### 2.3.2 Spine 骨骼动画文件

| 鱼种 | 文件名 | 动画数量 | 动画类型 |
|------|--------|----------|----------|
| 小丑鱼 | `clownfish.json` | 2 | swim, idle |
| 鲨鱼 | `shark.json` | 3 | swim, chase, attack |
| 鲨鱼之王 | `shark_king.json` | 4 | idle, swim, roar, summon |
| 小虾 | `shrimp.json` | 2 | swim, idle |
| 琵琶鱼 | `anglerfish.json` | 2 | swim, lure |
| 水母 | `jellyfish.json` | 2 | float, pulse |
| 海马 | `seahorse.json` | 2 | swim, idle |
| 章鱼 | `octopus.json` | 3 | swim, idle, stealth |
| 鳗鱼 | `eel.json` | 2 | dash, swim |
| 变异鲨鱼 | `mutant_shark.json` | 2 | swim, enrage |
| 巨型水母 | `giant_jellyfish.json` | 2 | float, chain_lightning |
| 大王乌贼 | `boss_squid.json` | 4 | idle, swim, tentacle_slap, ink_blind |
| 海底巨龙 | `boss_sea_dragon.json` | 4 | idle, swim, fire_breath, earthquake |

**存放路径:** `src/assets/spine/`

---

## 3. 骨骼结构设计

### 3.1 典型鱼骨骼结构

```
root (根骨)
├── body (身体主骨)
│   ├── head (头部)
│   ├── dorsal_fin (背鳍)
│   ├── pectoral_fin_left (左胸鳍)
│   ├── pectoral_fin_right (右胸鳍)
│   └── tail (尾巴)
```

### 3.2 特殊鱼种骨骼

#### 水母
```
root
├── dome (圆顶)
└── tentacle_1~5 (触手，多骨骼链)
```

#### 章鱼
```
root
├── head (头部)
└── tentacle_1~8 (8条触手)
```

#### 鳗鱼
```
root
├── body_1 (身体段1)
├── body_2 (身体段2)
├── body_3 (身体段3)
└── head (头部)
```

---

## 4. 动画设计

### 4.1 通用动画

| 动画名 | 适用鱼种 | 描述 |
|--------|----------|------|
| idle | 全部 | 静止/轻微浮动 |
| swim | 全部 | 正常游泳摆动 |
| chase | 猎食者 | 追击姿态 |
| attack | 战斗型 | 攻击动作 |
| hurt | 全部 | 受伤反应 |
| death | 全部 | 死亡动画 |

### 4.2 特色动画

| 鱼种 | 动画名 | 描述 |
|------|--------|------|
| 鲨鱼之王 | roar | 咆哮，震怒 |
| 鲨鱼之王 | summon | 召唤技能 |
| 琵琶鱼 | lure | 发光诱饵闪烁 |
| 水母 | pulse | 脉冲收缩 |
| 变异鲨鱼 | enrage | 愤怒变红 |
| 大王乌贼 | tentacle_slap | 触手拍击 |
| 大王乌贼 | ink_blind | 墨汁致盲 |
| 海底巨龙 | fire_breath | 火焰吐息 |
| 海底巨龙 | earthquake | 地震打击 |

---

## 5. 技术集成

### 5.1 Phaser 3 Spine 支持

```javascript
// 安装 Spine 插件 (已在 phaser 3.60 中内置)
// 需要加载 spine 相关文件
this.load.spine('shark', 'src/assets/spine/shark.json', 'src/assets/spine/shark.png');
```

### 5.2 预期改动

#### 5.2.1 FishFactory 重构

```javascript
// 当前：基于帧的图片轮播
// 目标：基于 Spine 骨骼动画

export class SpineFishFactory {
    static createSpineFish(scene, fishType, scale) {
        const spineFile = SpineFishFactory.getSpineFile(fishType);
        const spine = scene.add.spine(0, 0, spineFile);
        spine.setScale(scale);
        return spine;
    }

    static playAnimation(spine, animationName, loop = true) {
        spine.play(animationName, loop);
    }

    static setFlipX(spine, flip) {
        spine.setFlipX(flip);
    }
}
```

#### 5.2.2 Enemy/Player 适配

- 替换 `FishFactory.createFish()` 为 `SpineFishFactory.createSpineFish()`
- 动画状态机管理（idle → swim → attack）
- 方向翻转基于骨骼旋转

#### 5.2.3 性能优化

- 骨骼动画比帧动画更省内存
- 复用骨骼数据，只替换贴图
- 考虑 LOD (Level of Detail) 策略

---

## 6. 实施计划

### 6.1 阶段划分

| 阶段 | 任务 | 优先级 |
|------|------|--------|
| 1 | 验证 - 用 MiniMax 生成样本测试质量 | 高 |
| 2 | 美工 - 在 Spine 中绑定一套鱼（鲨鱼）作为示例 | 高 |
| 3 | 开发 - 重构 FishFactory 支持 Spine | 高 |
| 4 | 开发 - 适配 Enemy/Player 系统 | 中 |
| 5 | 扩展 - 绑定其余鱼种动画 | 中 |
| 6 | 优化 - 性能调优和动画混合 | 低 |

### 6.2 风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| Spine 学习成本 | 中 | 提供培训资源或外包 |
| 动画资产工作量 | 高 | 优先实现核心鱼种 |
| 运行时性能 | 低 | 骨骼动画效率高 |
| 多鱼一致性 | 中 | 建立鱼种设计规范 |

---

## 7. 替代方案对比

### 7.1 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| Spine 骨骼动画 | 流畅、可混合、文件小 | 需学习工具 | **推荐** |
| DragonBones | 类似 Spine | 社区较小 | 中 |
| 帧动画优化 | 简单实现 | 动画生硬、文件大 | 低 |
| Live2D | 2D 专用、表现力强 | 授权费用高 | 中 |

### 7.2 最终推荐

采用 **Spine 骨骼动画**，平衡效果和成本。

---

## 8. 附录

### 8.1 文件路径汇总

```
src/assets/
├── images/
│   ├── fish_clownfish_pose.jpg
│   ├── fish_shark_pose.jpg
│   ├── fish_shark_king_pose.jpg
│   ├── fish_shrimp_pose.jpg
│   ├── fish_anglerfish_pose.jpg
│   ├── fish_jellyfish_pose.jpg
│   ├── fish_seahorse_pose.jpg
│   ├── fish_octopus_pose.jpg
│   ├── fish_eel_pose.jpg
│   ├── fish_mutant_shark_pose.jpg
│   ├── fish_giant_jellyfish_pose.jpg
│   ├── fish_boss_squid_pose.jpg
│   └── fish_boss_sea_dragon_pose.jpg
└── spine/
    ├── clownfish.json
    ├── shark.json
    ├── shark_king.json
    ├── shrimp.json
    ├── anglerfish.json
    ├── jellyfish.json
    ├── seahorse.json
    ├── octopus.json
    ├── eel.json
    ├── mutant_shark.json
    ├── giant_jellyfish.json
    ├── boss_squid.json
    └── boss_sea_dragon.json
```

### 8.2 参考资源

- [Phaser 3 Spine 文档](https://phaser.io/docs)
- [Spine 官方编辑器](http://esotericsoftware.com/spine-editor)
- [Spine 社区资源](https://esotericsoftware.com/forum/index.php?topic=12077)

---

**文档版本:** 1.0
**下次审查:** 实现阶段完成时
