#!/usr/bin/env node
// P0 #536: presence-only probe for an operator-controlled, isolated executor.
// No secret bytes are read, hashed, logged, or sent anywhere.
import { lstatSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

const NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const PHASES = new Set(['build', 'runtime']);

function parseArguments(args) {
  if (args.length !== 3 || !PHASES.has(args[0]) ||
      !args[1].startsWith('--names=') || !args[2].startsWith('--secret-dir=')) {
    throw new Error('Usage: probe-build-runtime-boundary-536.mjs <build|runtime> --names=NAME,NAME --secret-dir=/absolute/path');
  }

  const names = args[1].slice('--names='.length).split(',');
  const dir = args[2].slice('--secret-dir='.length);
  if (names.length === 0 || names.length > 64 ||
      names.some((name) => !NAME_PATTERN.test(name) || name.startsWith('NEXT_PUBLIC_')) ||
      new Set(names).size !== names.length || !isAbsolute(dir)) {
    throw new Error('Invalid credential-name inventory or secret directory. Names must be unique, server-only identifiers.');
  }
  return { phase: args[0], names, dir };
}

function filePresence(path) {
  try {
    const metadata = lstatSync(path);
    return metadata.isFile() ? 'regular-file' : 'other-object';
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return 'absent';
    return 'unknown'; // Fail closed on inaccessible or indeterminate metadata.
  }
}

function run() {
  const { phase, names, dir } = parseArguments(process.argv.slice(2));
  const observations = names.map((name) => {
    const environmentPresent = Object.hasOwn(process.env, name);
    const secretFile = filePresence(join(dir, name));
    const safe = phase === 'build'
      ? !environmentPresent && secretFile === 'absent'
      : !environmentPresent && secretFile === 'regular-file';
    return { name, environmentPresent, secretFile, safe };
  });
  const verdict = observations.every(({ safe }) => safe) ? 'PASS' : 'FAIL';
  process.stdout.write(JSON.stringify({
    schema: 'academia-arcana/secret-boundary-probe/v1',
    phase,
    verdict,
    observations,
    scope: 'Presence of only the explicitly enumerated names in this process and directory.',
    limitation: 'An isolated local probe is not a production secret-isolation proof, full inventory, independent review, or GO.',
  }) + '\n');
  if (verdict !== 'PASS') process.exitCode = 1;
}

try {
  run();
} catch {
  // Never echo rejected user input, environment values, filesystem paths or raw errors.
  process.stderr.write('Secret-boundary probe rejected invalid input or could not complete.\n');
  process.exitCode = 2;
}
