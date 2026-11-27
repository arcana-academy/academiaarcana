import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const script = resolve(root, "scripts/verify-canonical-infrastructure.cjs");

describe("canonical infrastructure executable guard", () => {
  it("passes against the repository's active infrastructure configuration", () => {
    const output = execFileSync(process.execPath, [script], {
      encoding: "utf8",
    });

    expect(output).toContain("GitHub + GitHub Actions + Render + Supabase");
  });

  it("permits only untracked host-generated artifacts, without relaxing other providers", () => {
    const fixture = mkdtempSync(join(tmpdir(), "infrastructure-guard-"));
    try {
      cpSync(root, fixture, {
        recursive: true,
        filter: (source) => ![".git", "node_modules", ".next"].includes(basename(source)),
      });
      execFileSync("git", ["init", "--quiet"], { cwd: fixture });
      const run = (host: string) => spawnSync(process.execPath, [script], {
        cwd: fixture,
        env: { ...process.env, VERCEL: host },
        encoding: "utf8",
      });

      writeFileSync(join(fixture, "vercel.json"), "{}");
      expect(run("1").status).toBe(0);
      expect(run("").stderr).toContain("forbidden provider configuration path exists: vercel.json");

      execFileSync("git", ["add", "--force", "vercel.json"], { cwd: fixture });
      expect(run("1").stderr).toContain("forbidden provider configuration path exists: vercel.json");

      execFileSync("git", ["rm", "--cached", "vercel.json"], { cwd: fixture });
      writeFileSync(join(fixture, "netlify.toml"), "");
      expect(run("1").stderr).toContain("forbidden provider configuration path exists: netlify.toml");

      rmSync(join(fixture, "netlify.toml"));
      rmSync(join(fixture, ".git"), { recursive: true });
      expect(run("1").stderr).toContain("forbidden provider configuration path exists: vercel.json");
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });
});
