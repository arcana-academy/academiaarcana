/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const guard = resolve(__dirname, '..', 'verify-supply-chain-workflows.cjs');
const ownership = [
  '/.github/ @arcana-academy',
  '/render.yaml @arcana-academy',
  '/package-lock.json @arcana-academy',
  '/scripts/verify-dependency-lifecycle-scripts.cjs @arcana-academy',
  '/scripts/verify-supply-chain-workflows.cjs @arcana-academy',
].join('\n') + '\n';

function runSyntheticWorkflow({ expression, trigger = 'pull_request' }) {
  const root = mkdtempSync(join(tmpdir(), 'aa-supply-chain-'));
  try {
    mkdirSync(join(root, '.github', 'workflows'), { recursive: true });
    writeFileSync(join(root, '.github', 'CODEOWNERS'), ownership);
    writeFileSync(join(root, '.github', 'workflows', 'synthetic.yml'), [
      'name: synthetic-regression',
      'on:',
      `  ${trigger}:`,
      'permissions:',
      '  contents: read',
      'jobs:',
      '  synthetic:',
      '    runs-on: ubuntu-24.04',
      '    steps:',
      '      - name: Synthetic-only step',
      '        env:',
      `          SYNTHETIC_VALUE: ${expression}`,
      '        run: echo synthetic',
      '',
    ].join('\n'));
    return spawnSync(process.execPath, [guard], { cwd: root, encoding: 'utf8' });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('accepts a synthetic pull_request without secret access', () => {
  const result = runSyntheticWorkflow({ expression: 'synthetic-only' });
  assert.equal(result.status, 0, result.stderr);
});

test('accepts the limited GitHub token through direct property access', () => {
  const result = runSyntheticWorkflow({ expression: '${{ secrets.GITHUB_TOKEN }}' });
  assert.equal(result.status, 0, result.stderr);
});

for (const expression of [
  '${{ secrets.SYNTHETIC_NOT_A_REAL_SECRET }}',
  "${{ secrets['SYNTHETIC_NOT_A_REAL_SECRET'] }}",
  '${{ secrets[format(\'SYNTHETIC_{0}\', \"NAME\")] }}',
  '${{ secrets . SYNTHETIC_NOT_A_REAL_SECRET }}',
  "${{ secrets['GITHUB_TOKEN'] }}",
]) {
  test('rejects noncanonical PR secret references: ' + expression, () => {
    const result = runSyntheticWorkflow({ expression });
    assert.notEqual(result.status, 0, 'Unsafe PR workflow was unexpectedly accepted');
  });
}

test('does not change rules for push-only workflows', () => {
  const result = runSyntheticWorkflow({
    expression: "${{ secrets['SYNTHETIC_NOT_A_REAL_SECRET'] }}",
    trigger: 'push',
  });
  assert.equal(result.status, 0, result.stderr);
});
