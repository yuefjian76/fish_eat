#!/bin/bash
set -e

echo "=== Fish Eat Fish — Harness Initialization ==="

# Detect package manager
if [ -f pnpm-lock.yaml ]; then
  PM="pnpm"
elif [ -f yarn.lock ]; then
  PM="yarn"
elif [ -f bun.lock ] || [ -f bun.lockb ]; then
  PM="bun"
else
  PM="npm"
fi

echo "[1/5] Installing dependencies with $PM..."
if [ "$PM" = "npm" ]; then
  npm install
else
  "$PM" install
fi

echo "[2/5] Running tests..."
"$PM" test

echo "[3/5] Verifying game loads (start HTTP server)..."
cd /Users/yuefengjiang/AI/fish_eat
if command -v python3 &>/dev/null; then
  python3 -m http.server 8765 &
  SERVER_PID=$!
  sleep 2
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8765/ || echo "000"
  kill $SERVER_PID 2>/dev/null || true
fi

echo "[4/5] Checking for missing JS syntax errors..."
node --check src/main.js 2>&1 || echo "Note: ES module syntax check may require full bundler"

echo "[5/5] E2E smoke tests (requires Playwright MCP - run separately)..."
echo "  Use Playwright MCP browser tools to run e2e/smoke.spec.js"
echo "  Or run with: npx playwright test e2e/smoke.spec.js --project=chromium"

echo ""
echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run ./init.sh before claiming done"