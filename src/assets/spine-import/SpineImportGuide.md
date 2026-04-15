# Spine 骨骼绑定快速参考

## 素材位置

```
src/assets/spine-import/
├── textures/
│   ├── fish_clownfish_pose.jpg      # 小丑鱼 - 玩家角色
│   ├── fish_shark_pose.jpg          # 鲨鱼 - 普通敌人
│   ├── fish_shark_king_pose.jpg     # 鲨鱼之王 - BOSS
│   ├── fish_shrimp_pose.jpg         # 小虾 - 小型敌人
│   ├── fish_anglerfish_pose.jpg     # 琵琶鱼 - 远程敌人
│   ├── fish_jellyfish_pose.jpg      # 水母 - 漂浮型敌人
│   ├── fish_seahorse_pose.jpg       # 海马 - 闪避型敌人
│   ├── fish_octopus_pose.jpg        # 章鱼 - 隐身型敌人
│   ├── fish_eel_pose.jpg            # 鳗鱼 - 冲刺型敌人
│   ├── fish_mutant_shark_pose.jpg   # 变异鲨鱼 - 精英
│   ├── fish_giant_jellyfish_pose.jpg # 巨型水母 - 精英
│   ├── fish_boss_squid_pose.jpg     # 大王乌贼 - BOSS
│   └── fish_boss_sea_dragon_pose.jpg # 海底巨龙 - BOSS
│
├── clownfish.json      # 骨骼模板
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
│
└── documentation/
    └── README.md
```

---

## 快速绑定流程

### 以鲨鱼为例 (shark)

1. **打开 Spine** → 新建项目

2. **导入图片**
   - 将 `fish_shark_pose.jpg` 拖入 Spine
   - 或使用菜单: Project → Import

3. **创建骨骼** (参考 shark.json)
   ```
   root (0, 0)
   └── body (length: 120)
       ├── head (length: 60, x: 100)
       ├── tail_upper (length: 70, x: -120)
       ├── tail_lower (length: 40, x: -100, y: 25)
       ├── dorsal_fin (length: 50, x: -20, y: -40)
       ├── pectoral_fin_left (length: 45, x: 20, y: 20, rotation: -25)
       └── pectoral_fin_right (length: 45, x: 20, y: -20, rotation: 25)
   ```

4. **绑定图片到插槽**
   - 在 Tree 面板选中骨骼
   - 在 Properties 面板创建 Attachment
   - 选择对应的图片区域

5. **创建动画**
   - 切换到 Animations 面板
   - 创建 swim, chase, attack 动画
   - 拖动骨骼关键帧

6. **导出**
   - File → Export
   - 选择 JSON 格式
   - 命名: `shark.json`

---

## 鱼种分类绑定建议

### 第一优先级（核心鱼种）

| 鱼种 | 骨骼数 | 动画数 | 难度 |
|------|--------|--------|------|
| 鲨鱼 | 7 | 3 | 中 |
| 小丑鱼 (Player) | 6 | 2 | 低 |
| 小虾 | 4 | 2 | 低 |

### 第二优先级（普通敌人）

| 鱼种 | 骨骼数 | 动画数 | 难度 |
|------|--------|--------|------|
| 水母 | 6 | 2 | 中 |
| 章鱼 | 9 | 3 | 高 |
| 鳗鱼 | 6 | 2 | 中 |

### 第三优先级（精英/BOSS）

| 鱼种 | 骨骼数 | 动画数 | 难度 |
|------|--------|--------|------|
| 变异鲨鱼 | 8 | 2 | 中 |
| 大王乌贼 | 10+ | 4 | 高 |
| 海底巨龙 | 12+ | 4 | 高 |
| 鲨鱼之王 | 9 | 4 | 高 |

---

## 骨骼绑定小技巧

### 1. 骨骼命名规范
```
部位_type  # 如: body_main, fin_left, tail_upper
```

### 2. 插槽命名规范
```
slot_骨骼名  # 如: slot_body, slot_dorsal_fin
```

### 3. 动画命名规范
```
action_state  # 如: swim_idle, chase_active, attack_strike
```

### 4. 关键帧间隔
- 快速动作: 2-4 帧
- 正常摆动: 8-12 帧
- 缓慢浮动: 16-24 帧

---

## 推荐绑定顺序

1. **小丑鱼** - 最简单，先练手
2. **鲨鱼** - 代表性敌人
3. **水母** - 触手骨骼练习
4. **章鱼** - 8触手挑战
5. **BOSS** - 综合应用
