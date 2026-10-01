import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("canonical infrastructure executable guard", () => {
  it("passes against the repository's active infrastructure configuration", () => {
    const script = resolve(
      process.cwd(),
      "scripts/verify-canonical-infrastructure.cjs",
    );

    const output = execFileSync(process.execPath, [script], {
      encoding: "utf8",
    });

    expect(output).toContain(
      "GitHub + GitHub Actions + Render + Supabase",
    );
  });
});
