import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { getRuntimeSecret, hasRuntimeSecret } from "./runtime-secrets";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("runtime secrets", () => {
  it("prefers a runtime secret file over an environment fallback", () => {
    const dir = mkdtempSync(join(tmpdir(), "arcana-secrets-"));
    try {
      process.env.TEST_RUNTIME_SECRET = "env-value";
      writeFileSync(join(dir, "TEST_RUNTIME_SECRET"), "file-value\n");

      expect(
        getRuntimeSecret("TEST_RUNTIME_SECRET", { secretDir: dir }),
      ).toBe("file-value");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("falls back to environment variables for local and test runtimes", () => {
    process.env.TEST_RUNTIME_SECRET = "env-value";

    expect(
      getRuntimeSecret("TEST_RUNTIME_SECRET", {
        secretDir: "/definitely-missing-arcana-secret-dir",
      }),
    ).toBe("env-value");
    expect(
      hasRuntimeSecret("TEST_RUNTIME_SECRET", {
        secretDir: "/definitely-missing-arcana-secret-dir",
      }),
    ).toBe(true);
  });

  it("returns null when neither source is configured", () => {
    delete process.env.TEST_RUNTIME_SECRET;

    expect(
      getRuntimeSecret("TEST_RUNTIME_SECRET", {
        secretDir: "/definitely-missing-arcana-secret-dir",
      }),
    ).toBeNull();
  });

  it("rejects unsafe secret file names", () => {
    expect(() => getRuntimeSecret("../secret")).toThrow(
      "Invalid runtime secret name.",
    );
  });
});
