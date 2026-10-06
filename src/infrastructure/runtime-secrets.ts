import { readFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_SECRET_DIR = "/etc/secrets";
const SECRET_NAME_PATTERN = /^[A-Z0-9_]+$/;

type RuntimeSecretOptions = {
  readonly secretDir?: string;
};

function normalizeSecret(value: string | undefined | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function assertSecretName(name: string): void {
  if (!SECRET_NAME_PATTERN.test(name)) {
    throw new Error("Invalid runtime secret name.");
  }
}

function readSecretFile(name: string, secretDir: string): string | null {
  try {
    return normalizeSecret(readFileSync(join(secretDir, name), "utf8"));
  } catch {
    return null;
  }
}

export function getRuntimeSecret(
  name: string,
  { secretDir = DEFAULT_SECRET_DIR }: RuntimeSecretOptions = {},
): string | null {
  assertSecretName(name);

  return (
    readSecretFile(name, secretDir) ??
    normalizeSecret(process.env[name])
  );
}

export function hasRuntimeSecret(
  name: string,
  options?: RuntimeSecretOptions,
): boolean {
  return getRuntimeSecret(name, options) !== null;
}
