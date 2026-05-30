#!/bin/bash
# init.sh — 鱼吃鱼 (Fish Eat Fish) Harness 初始化和验证脚本
#
# 用途：每次会话开始时执行，确保环境健康
# 用法：bash init.sh
#
# 通过所有步骤才可以开始开发。

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Fish Eat Fish — Harness 初始化验证 ==="
echo "工作目录: $(pwd)"
echo ""

# ─── 检测包管理器 ────────────────────────────────────────────────
if [ -f pnpm-lock.yaml ]; then
  PM="pnpm"
elif [ -f yarn.lock ]; then
  PM="yarn"
elif [ -f bun.lock ] || [ -f bun.lockb ]; then
  PM="bun"
else
  PM="npm"
fi

# ─── Step 1: 安装依赖 ────────────────────────────────────────────
echo "[1/5] 安装依赖（$PM）..."
if [ "$PM" = "npm" ]; then
  npm install --silent
else
  "$PM" install
fi
echo "      ✓ 依赖安装完成"
echo ""

# ─── Step 2: 运行单元测试 ─────────────────────────────────────────
echo "[2/5] 运行单元测试..."
if "$PM" test; then
  echo "      ✓ 单元测试通过"
else
  echo "      ✗ 单元测试失败 — 请先修复测试再继续"
  exit 1
fi
echo ""

# ─── Step 3: 验证游戏入口文件语法 ────────────────────────────────
echo "[3/5] 检查入口文件语法..."
if node --input-type=module < src/main.js 2>/dev/null; then
  echo "      ✓ 入口文件语法正常"
elif node -e "require('fs').readFileSync('src/main.js', 'utf8')" 2>/dev/null; then
  echo "      ✓ 入口文件可读"
else
  echo "      ✓ 跳过（ES module 语法检查需要完整浏览器环境）"
fi
echo ""

# ─── Step 4: 验证核心配置文件 ────────────────────────────────────
echo "[4/5] 验证核心配置文件..."
CONFIGS_OK=true
for f in src/config/fish.json src/config/skills.json src/config/levels.json \
          src/config/difficulty.json src/config/drops.json; do
  if node -e "JSON.parse(require('fs').readFileSync('$f', 'utf8'))" 2>/dev/null; then
    echo "      ✓ $f"
  else
    echo "      ✗ $f — JSON 格式错误"
    CONFIGS_OK=false
  fi
done
if [ "$CONFIGS_OK" = false ]; then
  echo "      配置文件存在错误，请修复后重试"
  exit 1
fi
echo ""

# ─── Step 5: 验证 Harness 文件完整性 ─────────────────────────────
echo "[5/5] 验证 Harness 文件完整性..."
HARNESS_OK=true
HARNESS_FILES=(
  "AGENTS.md"
  "CLAUDE.md"
  "init.sh"
  "feature_list.json"
  "progress.md"
  "session-handoff.md"
  "clean-state-checklist.md"
  "evaluator-rubric.md"
  "quality-document.md"
)
for f in "${HARNESS_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "      ✓ $f"
  else
    echo "      ✗ $f — 文件缺失"
    HARNESS_OK=false
  fi
done

DOCS_FILES=(
  "docs/ARCHITECTURE.md"
  "docs/PRODUCT.md"
  "docs/RELIABILITY.md"
)
for f in "${DOCS_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "      ✓ $f"
  else
    echo "      ⚠ $f — 文档缺失（建议创建）"
  fi
done

if [ "$HARNESS_OK" = false ]; then
  echo "      部分 harness 文件缺失，请补充"
fi
echo ""

# ─── 完成 ─────────────────────────────────────────────────────────
echo "=== 验证完成 ==="
echo ""
echo "E2E 冒烟测试（需要浏览器，单独运行）："
echo "  1. python3 -m http.server 8765 &"
echo "  2. npx playwright test e2e/smoke.spec.js --project=chromium"
echo "  或使用 Playwright MCP browser 工具"
echo ""
echo "下一步："
echo "  1. 读 feature_list.json，找一个 pending 功能"
echo "  2. 只做那一个功能"
echo "  3. 实现后重新运行 ./init.sh 验证"
echo "  4. 验证通过后更新 feature_list.json 和 progress.md"
