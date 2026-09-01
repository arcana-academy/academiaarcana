import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type PackageJson = {
  scripts?: Record<string, string>;
  engines?: { node?: string };
};

const root = fileURLToPath(new URL("../../../", import.meta.url));
const packageJson = JSON.parse(
  readFileSync(`${root}/package.json`, "utf8"),
) as PackageJson;
const nodeVersion = readFileSync(`${root}/.nvmrc`, "utf8").trim();

describe("technical tooling contract", () => {
  it("keeps required quality scripts and Node 22 aligned", () => {
    expect(packageJson.scripts).toEqual(
      expect.objectContaining({
        build: expect.any(String),
        lint: expect.any(String),
        test: expect.any(String),
        typecheck: expect.any(String),
      }),
    );
    expect(nodeVersion).toBe("22");
    expect(packageJson.engines?.node).toBe(">=22 <23");
  });
});
