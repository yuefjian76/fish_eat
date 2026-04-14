# 鱼动画系统改进 - 执行计划

**创建日期:** 2026-04-11
**最后更新:** 2026-04-14
**状态:** 帧动画生成完成，待集成测试

---

## 1. 目标

将《鱼吃鱼》游戏的鱼动画从当前方案升级为更高质量的帧动画系统。

---

## 2. 当前方案 vs 目标方案

| 项目 | 当前方案 | 目标方案 |
|------|----------|----------|
| 动画类型 | 静态帧轮播 (4-7帧) | AI生成精美多帧动画 |
| 图片质量 | 简单几何绘制 | 照片级精美图片 |
| 动画数量 | 每鱼种 4-7 帧 | 每鱼种 6-8 帧 |
| 姿态变化 | 有限 | 游泳姿态完整循环 |

---

## 2.1 游戏平衡调整 (2026-04-12)

| 项目 | 调整前 | 调整后 |
|------|--------|--------|
| 玩家深度 | 50 | 100 (最上层) |
| 护盾冷却 | 25秒 | 45秒 |
| 护盾HP | 无限(持续5秒) | 最大HP的20% |
| 护盾效果 | 全程挡伤 | 被咬光HP即消失 |
| 敌人攻击冷却 | 1.5秒 | 0.8秒 |
| 敌人伤害 | size/4 (约50-75) | log(size)*3+2 (约12-15) |
| 升级后深度 | 重置为0 | 保持100 |

**伤害公式:** `max(5, min(2 + log(size) * 3, 15))`
- 小鱼: 5-10 伤害
- 中鱼: 11-13 伤害
- BOSS: 12-15 伤害
- 玩家50HP约4口被BOSS吃掉

---

## 3. 进度追踪

### 3.1 帧动画生成

| 鱼种 | 帧数 | 状态 | 文件路径 |
|------|------|------|--------|
| 小丑鱼 (Player) | 6/6 | ✅ 完成 | `src/assets/images/frames/clownfish/` |
| 鲨鱼 | 4/4 | ✅ 完成 | `src/assets/images/frames/shark/` |
| 小虾 | 4/4 | ✅ 完成 | `src/assets/images/frames/shrimp/` |
| 水母 | 4/4 | ✅ 完成 | `src/assets/images/frames/jellyfish/` |
| 琵琶鱼 | 4/4 | ✅ 完成 | `src/assets/images/frames/anglerfish/` |
| 海马 | 4/4 | ✅ 完成 | `src/assets/images/frames/seahorse/` |
| 章鱼 | 4/4 | ✅ 完成 | `src/assets/images/frames/octopus/` |
| 鳗鱼 | 4/4 | ✅ 完成 | `src/assets/images/frames/eel/` |
| 变异鲨鱼 | 4/4 | ✅ 完成 | `src/assets/images/frames/mutant_shark/` |
| 巨型水母 | 4/4 | ✅ 完成 | `src/assets/images/frames/giant_jellyfish/` |
| 鲨鱼之王 | 4/4 | ✅ 完成 | `src/assets/images/frames/shark_king/` |
| 大王乌贼 | 4/4 | ✅ 完成 | `src/assets/images/frames/boss_squid/` |
| 海底巨龙 | 4/4 | ✅ 完成 | `src/assets/images/frames/boss_sea_dragon/` |

### 3.2 代码集成

| 任务 | 状态 | 说明 |
|------|------|------|
| BootScene 加载新帧 | ✅ 完成 | 支持所有13种鱼帧动画 |
| FishFactory 支持新帧 | ✅ 完成 | FISH_FRAME_CONFIG 已配置所有鱼种 |
| 敌人帧使用正确深度 | ✅ 完成 | enemy depth=30, player depth=100 |
| 回退机制 | ✅ 完成 | 帧不存在时回退到程序化绘制 |

### 3.3 资源生成

| 类型 | 状态 | 说明 |
|------|------|------|
| Pose 图片 | ✅ 完成 | 13种鱼 x 1张 = 13张 |
| Spine 骨骼模板 | ✅ 完成 | 13个 JSON 文件 |
| 帧动画图片 | ✅ 完成 | 13种鱼 x 4帧 = 52张 |
| Spine 绑定 | ❌ 待开始 | 需美工操作（可选） |

---

## 4. 待办事项

### 4.1 帧动画生成 ✅

- [x] 所有鱼种帧动画生成完成 (13种鱼 x 4帧)

### 4.2 代码适配

- [x] 更新 FishFactory 支持新帧动画路径
- [x] 更新 BootScene 加载新帧图片
- [x] 适配鱼种与帧目录映射
- [ ] 测试所有鱼种动画显示

### 4.3 Spine 骨骼动画（可选高级方案）

- [ ] 美工在 Spine 中绑定骨骼
- [ ] 创建各鱼种动画关键帧
- [ ] 导出 Spine 资产
- [ ] 重构 FishFactory 支持 Spine
- [ ] 实现动画混合和方向翻转

---

## 5. 文件结构

```
src/assets/
├── images/
│   ├── frames/
│   │   ├── clownfish/     # 小丑鱼 - 6帧 ✅
│   │   ├── shark/         # 鲨鱼 - 4帧 ✅
│   │   ├── shrimp/        # 小虾 - 4帧 ✅
│   │   ├── jellyfish/     # 水母 - 4帧 ✅
│   │   ├── anglerfish/    # 琵琶鱼 - 4帧 ✅
│   │   ├── seahorse/      # 海马 - 4帧 ✅
│   │   ├── octopus/       # 章鱼 - 4帧 ✅
│   │   ├── eel/           # 鳗鱼 - 4帧 ✅
│   │   ├── mutant_shark/  # 变异鲨鱼 - 4帧 ✅
│   │   ├── giant_jellyfish/ # 巨型水母 - 4帧 ✅
│   │   ├── shark_king/    # 鲨鱼之王 - 4帧 ✅
│   │   ├── boss_squid/    # 大王乌贼 - 4帧 ✅
│   │   └── boss_sea_dragon/ # 海底巨龙 - 4帧 ✅
│   ├── fish_*_pose.jpg    # Pose参考图
│   └── frames/            # 旧帧动画（备用）
├── spine/
│   ├── *.json            # Spine骨骼动画模板
│   └── ...
└── spine-import/
    ├── textures/          # 导入素材包
    ├── README.md          # 导入指南
    └── SpineImportGuide.md # 快速参考
```

---

## 6. 设计文档

- `docs/superpowers/specs/2026-04-11-fish-animation-design.md`

---

## 7. 下一步行动

1. **立即:** 测试所有鱼种动画显示
2. **短期:** 验证帧动画正确加载和播放
3. **中期:** 可选 - 美工进行 Spine 绑定
4. **长期:** 实现完整骨骼动画系统

---

**下次更新:** 测试帧动画集成
