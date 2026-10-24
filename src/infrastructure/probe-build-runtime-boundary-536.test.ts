import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const script = resolve(process.cwd(), 'scripts/security/probe-build-runtime-boundary-536.mjs');
const CREDENTIAL = 'SYNTHETIC_SERVER_CREDENTIAL';
const VALUE = 'private-synthetic-marker-never-output';
let dir = '';

function probe(phase: 'build' | 'runtime', env: Record<string, string> = {}, names = CREDENTIAL) {
  // Deliberately do NOT inherit ambient CI variables or any real credentials.
  const result = spawnSync(process.execPath, [script, phase, '--names=' + names, '--secret-dir=' + dir], {
    encoding: 'utf8',
    env: { NODE_ENV: 'test', PATH: process.env.PATH ?? '', ...env },
  });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    report: result.stdout ? JSON.parse(result.stdout) : null,
  };
}

beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'aa-secret-boundary-536-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('P0 #536: non-secret-bearing build/runtime boundary probe', () => {
  it('accepts a build with no enumerated secret in env or file directory', () => {
    const result = probe('build');
    expect(result.status).toBe(0);
    expect(result.report).toMatchObject({ phase: 'build', verdict: 'PASS' });
  });

  it('rejects a build even if its secret environment variable has an empty value', () => {
    const result = probe('build', { [CREDENTIAL]: '' });
    expect(result.status).toBe(1);
    expect(result.report.observations[0].environmentPresent).toBe(true);
  });

  it('rejects and redacts a build containing a synthetic secret value', () => {
    const result = probe('build', { [CREDENTIAL]: VALUE });
    expect(result.status).toBe(1);
    expect(result.report.verdict).toBe('FAIL');
    expect(result.stdout + result.stderr).not.toContain(VALUE);
  });

  it('rejects a build exposing a runtime secret file', () => {
    writeFileSync(join(dir, CREDENTIAL), VALUE);
    const result = probe('build');
    expect(result.status).toBe(1);
    expect(result.report.observations[0].secretFile).toBe('regular-file');
    expect(result.stdout + result.stderr).not.toContain(VALUE);
  });

  it('accepts a runtime file-only presence for the listed synthetic name', () => {
    writeFileSync(join(dir, CREDENTIAL), VALUE);
    const result = probe('runtime');
    expect(result.status).toBe(0);
    expect(result.report).toMatchObject({ phase: 'runtime', verdict: 'PASS' });
  });

  it('rejects a runtime variable even when its file is present', () => {
    writeFileSync(join(dir, CREDENTIAL), VALUE);
    const result = probe('runtime', { [CREDENTIAL]: VALUE });
    expect(result.status).toBe(1);
    expect(result.report.verdict).toBe('FAIL');
    expect(result.stdout + result.stderr).not.toContain(VALUE);
  });

  it('rejects missing and symlinked runtime files', () => {
    expect(probe('runtime').report.verdict).toBe('FAIL');
    const target = join(dir, 'target');
    writeFileSync(target, VALUE);
    symlinkSync(target, join(dir, CREDENTIAL));
    const result = probe('runtime');
    expect(result.status).toBe(1);
    expect(result.report.observations[0].secretFile).toBe('other-object');
  });

  it('fails closed on empty, duplicate, client-public or malformed credential inventories', () => {
    for (const names of ['', CREDENTIAL + ',' + CREDENTIAL, 'NEXT_PUBLIC_KEY', '../../TOKEN']) {
      const result = probe('build', {}, names);
      expect(result.status).toBe(2);
      expect(result.stdout).toBe('');
      expect(result.stderr).not.toContain(VALUE);
    }
  });

  it('checks every enumerated name, not merely the first one', () => {
    writeFileSync(join(dir, 'SECOND_SYNTHETIC_SECRET'), VALUE);
    const result = probe('build', {}, CREDENTIAL + ',SECOND_SYNTHETIC_SECRET');
    expect(result.status).toBe(1);
    expect(result.report.observations).toHaveLength(2);
    expect(result.report.observations[1].safe).toBe(false);
  });
});
