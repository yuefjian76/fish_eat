# 登录系统设计规格

## 概述

实现 Firebase 认证 + Firestore 数据存储的登录系统，支持简单用户名密码登录，用户数据自动同步。

## 目标

1. 玩家可以使用用户名/密码注册和登录
2. 支持游客模式（不登录直接玩）
3. 玩家数据（等级、金币、成就等）保存到 Firestore
4. 支持多设备数据同步

## 架构设计

### Firebase 配置

使用 Firebase Realtime Database 或 Firestore 存储用户数据：
- 集合：`users` → 文档：`{userId}` → 字段：用户数据

### 数据结构

```javascript
// Firestore users/{uid}
{
  username: string,
  level: number,
  exp: number,
  hp: number,
  maxHp: number,
  currency: number,
  highScore: number,
  maxLevel: number,
  unlockedDifficulties: string[],
  upgrades: { [key: string]: number },
  achievements: string[],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 现有 localStorage 数据的迁移

首次登录时，将 localStorage 数据迁移到 Firestore，并保留 localStorage 作为缓存。

## 文件结构

```
src/
├── systems/
│   ├── AuthSystem.js      # Firebase Auth 封装
│   └── UserDataSystem.js  # Firestore 数据读写
├── scenes/
│   └── MenuScene.js       # 修改：添加登录界面
└── config/
    └── firebase.json      # Firebase 配置
```

## AuthSystem 职责

- `login(username, password)` - 登录
- `register(username, password)` - 注册
- `logout()` - 登出
- `getCurrentUser()` - 获取当前用户
- `onAuthStateChanged(callback)` - 监听登录状态变化

## UserDataSystem 职责

- `saveUserData(data)` - 保存数据到 Firestore
- `loadUserData()` - 从 Firestore 加载数据
- `mergeLocalAndRemote(local, remote)` - 合并本地和远程数据（远程优先）
- `syncToLocal(data)` - 将 Firestore 数据同步到 localStorage

## 界面流程

```
MenuScene
├── 已登录 → 显示用户名 + 最高分 + 开始游戏按钮 + 登出按钮
├── 未登录 → 显示登录/注册表单
│           ├── 用户名输入框
│           ├── 密码输入框
│           ├── 登录按钮
│           ├── 注册按钮
│           └── 游客模式按钮
```

## 游戏数据同步

- **游戏结束时**：GameOverScene → 保存到 Firestore + localStorage
- **登录成功后**：Firestore → localStorage（下次加载更快）
- **登出时**：保留 localStorage 数据（游客可继续玩）

## 错误处理

- 网络错误：提示用户，显示重试按钮
- 注册失败（用户名已存在）：提示"用户名已被占用"
- 登录失败（密码错误）：提示"用户名或密码错误"
- 数据加载失败：使用 localStorage 缓存数据

## 成功标准

1. 玩家可以使用用户名密码注册和登录
2. 游客可以跳过登录直接玩游戏
3. 游戏数据自动保存到 Firestore
4. 重新登录后数据正确恢复
5. 支持多设备同步
