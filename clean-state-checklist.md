# Clean State Checklist

运行此清单在每次提交前和每个会话结束。

## Build

- [ ] `npm test` 通过，无测试失败
- [ ] 无 TypeScript 或 ESLint 错误（如果有的话）
- [ ] 无未使用的变量或导入警告

## Architecture

- [ ] Scene 代码不直接导入 System 实现细节
- [ ] System 之间通过 DI + 回调接口通信
- [ ] 所有系统有 `reset(config)` 方法支持 scene restart
- [ ] Entity 层只做渲染和物理，不含游戏逻辑
- [ ] Config 层 JSON 文件格式正确

## Runtime

- [ ] 游戏从 BootScene 正常启动（`npm run dev` 或 `./init.sh`）
- [ ] 菜单界面显示正确（标题、难度选择、按钮）
- [ ] 游戏加载无崩溃，canvas 正常渲染
- [ ] 玩家移动控制响应正常
- [ ] 吃鱼碰撞检测工作正常（经验获取）
- [ ] 敌人 AI 行为正常（游荡/追逐/攻击/逃跑）
- [ ] 技能 Q/W/E/R 冷却正常
- [ ] 升级触发光波动画
- [ ] GameOverScene 显示统计面板

## Logging

- [ ] DebugLogger 输出带时间戳的日志
- [ ] 日志级别（DEBUG/INFO/WARN/ERROR）正确
- [ ] 关键事件已记录（吃鱼、升级、死亡）

## Data Integrity

- [ ] localStorage 认证数据持久化正常
- [ ] 用户数据存档正常
- [ ] 无数据丢失或格式错误

## Repository

- [ ] `git status` 无意外文件
- [ ] 无敏感数据（.env、credentials）提交
- [ ] 无临时文件或调试输出
- [ ] `progress.md` 已更新当前状态
- [ ] `feature_list.json` 反映实际功能状态
- [ ] `session-handoff.md` 已更新（如果会话结束）

## Scripts

- [ ] `./init.sh` 通过所有验证步骤
- [ ] E2E 冒烟测试通过（如已配置）