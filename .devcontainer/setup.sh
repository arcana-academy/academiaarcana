#!/usr/bin/env bash
# Isolated Codespaces/Codex Cloud development bootstrap.
# No real credentials, production services, migrations, deploys, or GHCR.
set -Eeuo pipefail

if [[ "$(node -p 'process.versions.node.split(".")[0]')" != "24" ]]; then
  echo "ERROR: Node.js 24 required by package.json/.nvmrc." >&2
  exit 1
fi

if [[ "$(npm --version)" != "11.19.1" ]]; then
  # Pin npm through Corepack (bundled with Node 24) instead of an unpinned
  # global npm install. Corepack resolves the exact version declared in
  # package.json's packageManager field and verifies the download signature.
  export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
  if command -v sudo >/dev/null 2>&1; then
    sudo corepack enable npm
  elif [[ "$(id -u)" == "0" ]]; then
    corepack enable npm
  else
    echo "ERROR: npm 11.19.1 is required. Install it in this isolated environment." >&2
    exit 1
  fi
  corepack prepare npm@11.19.1 --activate
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
