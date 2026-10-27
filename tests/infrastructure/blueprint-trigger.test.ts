import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { readServiceTrigger, assertFrozenBlueprint } = require(
  "../../scripts/security/read-blueprint-trigger.cjs",
) as {
  readServiceTrigger: (renderYaml: string, serviceName?: string) => string;
  assertFrozenBlueprint: (root: string) => string;
};

const root = process.cwd();

const blueprint = (trigger: string, name = "academiaarcana") =>
  [
    "services:",
    "  - type: web",
    `    name: ${name}`,
    "    runtime: node",
    "    branch: main",
    `    autoDeployTrigger: ${trigger}`,
    "    healthCheckPath: /api/health",
    "",
  ].join("\n");

// Exercises the freeze assertion against an in-memory Blueprint by pointing it
// at a temporary directory containing that exact content.
const assertFrozenBlueprintFrom = (content: string): string => {
  const dir = mkdtempSync(join(tmpdir(), "aa-blueprint-"));
  try {
    writeFileSync(join(dir, "render.yaml"), content);
    return assertFrozenBlueprint(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

describe("readServiceTrigger", () => {
  it("reads the quoted frozen trigger from the real Blueprint", () => {
    expect(readServiceTrigger(readFileSync(resolve(root, "render.yaml"), "utf8"))).toBe("off");
    expect(assertFrozenBlueprint(root)).toBe("off");
  });

  it("requires a quoted string enum value", () => {
    // YAML 1.1 resolves bare `off` to boolean false, which is not the string
    // enum Render's Blueprint schema expects.
    for (const value of ["off", "commit", "checksPass", '"on"', "false", ""]) {
      expect(() => readServiceTrigger(blueprint(value))).toThrow(/quoted string enum/);
    }
  });

  it("accepts other quoted enum values but the freeze assertion rejects them", () => {
    // The reader is deliberately generic; the NO-GO policy lives in
    // assertFrozenBlueprint, not in the YAML parser.
    expect(readServiceTrigger(blueprint('"commit"'))).toBe("commit");
    expect(readServiceTrigger(blueprint("'checksPass'"))).toBe("checksPass");
    expect(readServiceTrigger(blueprint("'off'"))).toBe("off");
    expect(() => assertFrozenBlueprintFrom(blueprint('"commit"'))).toThrow(/must be "off"/);
    expect(() => assertFrozenBlueprintFrom(blueprint("'checksPass'"))).toThrow(/must be "off"/);
    expect(assertFrozenBlueprintFrom(blueprint("'off'"))).toBe("off");
  });

  it("rejects a missing, commented-out, or duplicate trigger", () => {
    expect(() =>
      readServiceTrigger("services:\n  - type: web\n    name: academiaarcana\n"),
    ).toThrow(/exactly one autoDeployTrigger/);
    expect(() =>
      readServiceTrigger(blueprint('"off"').replace("    autoDeployTrigger:", "    # autoDeployTrigger:")),
    ).toThrow(/exactly one autoDeployTrigger/);
    expect(() =>
      readServiceTrigger(blueprint('"off"\n    autoDeployTrigger: "off"')),
    ).toThrow(/exactly one autoDeployTrigger/);
  });

  it("scopes the trigger to the named web service, not a global regex", () => {
    const twoServices = [
      "services:",
      "  - type: web",
      "    name: outro-servico",
      '    autoDeployTrigger: "commit"',
      "  - type: web",
      "    name: academiaarcana",
      '    autoDeployTrigger: "off"',
      "",
    ].join("\n");
    expect(readServiceTrigger(twoServices, "academiaarcana")).toBe("off");
    expect(readServiceTrigger(twoServices, "outro-servico")).toBe("commit");
    expect(assertFrozenBlueprintFrom(twoServices)).toBe("off");
  });

  it("ignores inline comments and carriage returns", () => {
    expect(
      readServiceTrigger(blueprint('"off" # release freeze').replaceAll("\n", "\r\n")),
    ).toBe("off");
  });

  it("rejects an empty Blueprint and an unknown service name", () => {
    expect(() => readServiceTrigger("")).toThrow(/Empty Blueprint/);
    expect(() => readServiceTrigger(blueprint('"off"'), "inexistente")).toThrow(
      /exactly one web service/,
    );
  });
});
