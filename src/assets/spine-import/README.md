# Spine 导入指南

## 素材包说明

本素材包包含 13 种鱼的高质量 Pose 图片和对应的 Spine 骨骼动画 JSON 模板。

---

## 文件对应关系

| 鱼种 | Pose 图片 | Spine JSON |
|------|-----------|------------|
| 小丑鱼 (Player) | `fish_clownfish_pose.jpg` | `clownfish.json` |
| 鲨鱼 | `fish_shark_pose.jpg` | `shark.json` |
| 鲨鱼之王 (BOSS) | `fish_shark_king_pose.jpg` | `shark_king.json` |
| 小虾 | `fish_shrimp_pose.jpg` | `shrimp.json` |
| 琵琶鱼 | `fish_anglerfish_pose.jpg` | `anglerfish.json` |
| 水母 | `fish_jellyfish_pose.jpg` | `jellyfish.json` |
| 海马 | `fish_seahorse_pose.jpg` | `seahorse.json` |
| 章鱼 | `fish_octopus_pose.jpg` | `octopus.json` |
| 鳗鱼 | `fish_eel_pose.jpg` | `eel.json` |
| 变异鲨鱼 | `fish_mutant_shark_pose.jpg` | `mutant_shark.json` |
| 巨型水母 | `fish_giant_jellyfish_pose.jpg` | `giant_jellyfish.json` |
| 大王乌贼 (BOSS) | `fish_boss_squid_pose.jpg` | `boss_squid.json` |
| 海底巨龙 (BOSS) | `fish_boss_sea_dragon_pose.jpg` | `boss_sea_dragon.json` |

---

## 导入步骤

### 1. 准备工作

1. 安装 Spine 编辑器: http://esotericsoftware.com/spine-download
2. 确保 Pose 图片已准备好（建议转换为 PNG 带透明背景）

### 2. 创建新项目

1. 打开 Spine 编辑器
2. 点击 **New Project** (新建项目)
3. 选择 **Create** 创建空白项目

### 3. 导入图片作为 Slot 附件

**方法一：拖拽导入**
1. 将 `fish_xxx_pose.jpg` 图片拖入 Spine 窗口
2. Spine 会自动创建对应的 Texture Atlas

**方法二：通过菜单导入**
1. 选择 **Project** → **Import**
2. 选择图片文件

### 4. 设置骨骼

JSON 文件中已定义了基础的骨骼结构，你可以：

1. **直接使用 JSON 模板**
   - 将对应的 `xxx.json` 文件内容复制到 Spine 的 JSON 导入窗口
   - Spine 会提示"骨骼数据存在，是否覆盖？"选择 Yes

2. **手动创建骨骼**
   - 按 JSON 中定义的骨骼结构在 Spine 中创建
   - 对应关系见下方"骨骼结构参考"

### 5. 绑定图片到骨骼

1. 在 **Tree** 面板中选中要绑定的骨骼
2. 在 **Attachments** 面板中点击 **New** → **Attachment**
3. 选择对应的图片区域
4. 拖动调整位置和大小

---

## 骨骼结构参考

### 典型鱼（鲨鱼、小丑鱼）

```
root (根骨)
└── body (身体主骨)
    ├── head (头部) - optional
    ├── dorsal_fin (背鳍)
    ├── pectoral_fin_left (左胸鳍)
    ├── pectoral_fin_right (右胸鳍)
    └── tail (尾巴)
```

### 水母

```
root
└── dome (圆顶)
    └── tentacle_1~5 (触手，多骨骼链)
```

### 章鱼

```
root
└── head (头部)
    └── tentacle_1~8 (8条触手)
```

### 鳗鱼

```
root
├── body_1 (身体段1)
├── body_2 (身体段2)
├── body_3 (身体段3)
└── head (头部)
```

---

## 动画类型参考

每个 JSON 模板已包含以下动画：

| 动画名 | 描述 | 适用鱼种 |
|--------|------|----------|
| `idle` | 静止/轻微浮动 | 全部 |
| `swim` | 正常游泳摆动 | 全部 |
| `chase` | 追击姿态 | 鲨鱼 |
| `attack` | 攻击动作 | 战斗型 |
| `roar` | 咆哮 | BOSS |
| `summon` | 召唤技能 | BOSS |
| `enrage` | 愤怒变红 | 变异鲨鱼 |
| `pulse` | 脉冲收缩 | 水母 |
| `float` | 漂浮 | 水母 |
| `dash` | 冲刺 | 鳗鱼 |
| `stealth` | 隐身 | 章鱼 |
| `fire_breath` | 火焰吐息 | 海底巨龙 |
| `earthquake` | 地震打击 | 海底巨龙 |
| `tentacle_slap` | 触手拍击 | 大王乌贼 |
| `ink_blind` | 墨汁致盲 | 大王乌贼 |

---

## 导出设置

完成动画后，导出设置：

1. **Export Format**: `JSON`
2. **Atlas Format**: `PNG`
3. **PNG Size**: 512x512 或 1024x1024

导出文件命名建议：
```
{鱼种}_spine.json      # 骨骼数据
{鱼种}_spine.atlas.txt # 图集配置
{鱼种}_spine.png       # 合并贴图
```

---

## 注意事项

1. **背景透明** - 当前 JPG 图片可能有背景，建议在导入前用 Photoshop/GIMP 去除背景，保存为 PNG

2. **骨骼父子关系** - 确保骨骼层级正确，子骨骼会继承父骨骼的变换

3. **动画混合** - Spine 支持动画混合，可以同时播放多个动画（如 swim + attack）

4. **图片尺寸** - 建议统一使用 512x512 或 1024x1024 的贴图

---

## 下一步

完成 Spine 动画后，将导出的文件放入：

```
src/assets/spine/{鱼种}/
├── {鱼种}.json      # 骨骼数据
├── {鱼种}.atlas.txt # 图集
└── {鱼种}.png       # 贴图
```

然后更新 `FishFactory.js` 以支持 Spine 动画。
