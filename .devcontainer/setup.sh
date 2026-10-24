#!/usr/bin/env bash
# Isolated Codespaces/Codex Cloud development bootstrap.
# No real credentials, production services, migrations, deploys, or GHCR.
set -Eeuo pipefail

if ! node -e '
const [major, minor, patch] = process.versions.node.split(".").map(Number);
process.exit(major === 24 && (minor > 22 || (minor === 22 && patch >= 1)) ? 0 : 1);
'; then
  echo "ERROR: Node.js >=24.22.1 <25 required by package.json/.nvmrc." >&2
  exit 1
fi

if [[ "$(npm --version)" != "11.19.1" ]]; then
  if command -v sudo >/dev/null 2>&1; then
    sudo npm install --global npm@11.19.1 --ignore-scripts --no-audit --no-fund
  elif [[ "$(id -u)" == "0" ]]; then
    npm install --global npm@11.19.1 --ignore-scripts --no-audit --no-fund
  else
    echo "ERROR: npm 11.19.1 is required. Install it in this isolated environment." >&2
    exit 1
  fi
fi

if [[ "$(npm --version)" != "11.19.1" ]]; then
  echo "ERROR: npm version mismatch after setup." >&2
  exit 1
fi

node scripts/verify-supply-chain-workflows.cjs
node scripts/verify-dependency-lifecycle-scripts.cjs
npm ci --ignore-scripts --no-audit --no-fund
npm rebuild unrs-resolver --ignore-scripts=false --no-audit --no-fund

echo "Cloud development dependencies installed. No build, E2E, credentials, or deploy was run."
echo "For the existing CI-approved test sequence, use the GitHub Actions Quality Gate."
