# Clean State Checklist — 鱼吃鱼 (Fish Eat Fish)

在每次提交前和每个会话结束时运行此清单。
**所有检查项必须通过，才可以提交或声称功能完成。**

---

## Build（构建）

- [ ] `npm test` 通过，0 个测试失败
- [ ] 无 JavaScript 语法错误（`node --check src/main.js` 或 `./init.sh` Step 3）
- [ ] 无未使用的变量或导入（代码自查）
- [ ] `./init.sh` 全部 5 个步骤通过

---

## Architecture（架构边界）

- [ ] Scene 层不直接实现游戏逻辑（只组装和调用 System）
- [ ] System 层尽量不直接依赖 Phaser 全局对象
- [ ] System 之间通过 DI + 回调接口通信，不相互直接引用
- [ ] Entity 层只做渲染和物理，不含游戏规则判断
- [ ] Config 层 JSON 文件格式合法（JSON.parse 不报错）
- [ ] 所有提取的系统都有 `reset(config)` 方法（支持 scene restart）
- [ ] 新 IPC/事件通道定义在统一位置（如果有）

---

## Runtime（运行时）

- [ ] 游戏从 BootScene 正常启动（HTTP server + 浏览器打开）
- [ ] 菜单界面正常显示（标题、难度选择、鱼类选择按钮）
- [ ] 游戏加载无崩溃，Phaser Canvas 正常渲染
- [ ] 玩家移动控制响应正常（方向键 + 鼠标）
- [ ] 吃鱼碰撞检测正常（1.2x 大小规则，获得经验）
- [ ] 受伤机制正常（敌人 >1.2x 时扣血，屏幕震动）
- [ ] 敌人 AI 状态正常（WANDERING / CHASING / ATTACKING / FLEEING）
- [ ] 技能 Q/W/E/R 冷却正常，UI 反馈正确
- [ ] 升级时触发光波动画和等级文字
- [ ] WaveSystem 状态切换正常（calm → surge → peak）
- [ ] Boss 在对应等级触发（Lv5 / Lv10 / Lv15）
- [ ] GameOverScene 正常显示统计信息

---

## Logging（日志）

- [ ] DebugLogger 输出带时间戳的结构化日志
- [ ] 日志级别正确使用（DEBUG / INFO / WARN / ERROR）
- [ ] 关键事件已记录：吃鱼、升级、Boss 出现、玩家死亡
- [ ] `?debug=true` 模式下 Debug Overlay 正常显示
- [ ] `window.__GAME_SCENE__` 在调试模式下正常暴露

---

## Data Integrity（数据完整性）

- [ ] localStorage 认证数据持久化正常（刷新后会话保持）
- [ ] 商店升级数据正常保存和读取
- [ ] 成就数据正常持久化
- [ ] 无数据格式错误（JSON 解析不报错）
- [ ] Config JSON 文件中克制关系数据完整（strongAgainst / weakTo）

---

## Performance（性能）

- [ ] 游戏运行帧率目标 60 FPS（浏览器 DevTools 确认）
- [ ] 无内存泄漏迹象（长时间运行后无明显卡顿）
- [ ] 敌人生成遵循 WaveSystem 间隔（calm 2s, surge 400ms）
- [ ] 碰撞检测无明显性能开销

---

## Repository（仓库状态）

- [ ] `git status` 无意外文件（无未追踪的临时文件）
- [ ] 无敏感数据（.env、credentials、API keys）已暂存
- [ ] 无 `dist/` 或构建产物被提交
- [ ] `progress.md` 已追加本次会话记录
- [ ] `feature_list.json` 反映实际功能状态（状态和证据都已更新）
- [ ] `session-handoff.md` 已更新（如果会话结束或功能跨会话）

---

## Harness Files（Harness 文件完整性）

- [ ] `AGENTS.md` 存在且包含 5 个子系统说明
- [ ] `CLAUDE.md` 存在且包含快速参考命令
- [ ] `init.sh` 可执行（`bash init.sh` 正常运行）
- [ ] `feature_list.json` 存在且格式合法
- [ ] `docs/ARCHITECTURE.md` 存在
- [ ] `docs/PRODUCT.md` 存在
- [ ] `docs/RELIABILITY.md` 存在

---

## E2E（端到端验证）

- [ ] `e2e/smoke.spec.js` 中的 7 个冒烟测试通过（如已运行 Playwright）
- [ ] 游戏页面无 Console Error（浏览器 DevTools 确认）
- [ ] 场景切换无 JavaScript 崩溃

---

## 通过标准

只有当以上**所有必要检查项**都勾选后，才可以：
1. 将 `feature_list.json` 中该功能标记为 `completed`
2. 提交代码（`git commit`）
3. 声称会话完成并更新 `progress.md`
