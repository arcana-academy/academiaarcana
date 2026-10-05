import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { getIntegrationStatusSnapshot } from "@/infrastructure/integrations/status";

const root = process.cwd();
const privilegedSupabaseEnv = ["SUPABASE", "SERVICE", "ROLE", "KEY"].join("_");
const supabaseSecretPrefix = ["sb", "secret"].join("_") + "_";

function walkTextFiles(directory: string): string[] {
  const absolute = resolve(root, directory);
  const results: string[] = [];

  for (const name of readdirSync(absolute)) {
    const path = resolve(absolute, name);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      results.push(...walkTextFiles(relative(root, path)));
      continue;
    }

    if (/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(name)) {
      results.push(relative(root, path));
    }
  }

  return results;
}

function readRepoFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P0 credential and secret boundaries", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps privileged Supabase credentials out of active runtime source", () => {
    const activeFiles = [
      ...walkTextFiles("src"),
      "next.config.ts",
      "render.yaml",
    ];

    for (const path of activeFiles) {
      const fileContent = readRepoFile(path);

      expect(
        fileContent,
        `${path} must not reference the privileged Supabase runtime key`,
      ).not.toMatch(new RegExp(privilegedSupabaseEnv, "i"));

      expect(
        fileContent,
        `${path} must not embed a Supabase secret-key prefix`,
      ).not.toMatch(new RegExp(supabaseSecretPrefix, "i"));
    }
  });

  it("keeps sensitive server credentials out of the NEXT_PUBLIC namespace", () => {
    const keys = readRepoFile(".env.example")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => line.slice(0, line.indexOf("=")).trim());

    const forbiddenPublicNames = keys.filter(
      (name) =>
        name.startsWith("NEXT_PUBLIC_") &&
        /(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|SERVICE_ROLE)/i.test(name),
    );

    expect(forbiddenPublicNames).toEqual([]);
    expect(keys).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(keys).not.toContain(`NEXT_PUBLIC_${privilegedSupabaseEnv}`);
  });

  it("never serializes configured credential sentinels in the public integration snapshot", async () => {
    const sentinels = [
      "qa-datacamp-sensitive-marker",
      "qa-dropbox-sensitive-marker",
      "qa-airtable-sensitive-marker",
      "qa-parallel-sensitive-marker",
      "qa-exa-sensitive-marker",
    ];

    vi.stubEnv("PARALLEL_API_KEY", sentinels[3]);
    vi.stubEnv("EXA_API_KEY", sentinels[4]);

    const snapshot = await getIntegrationStatusSnapshot({
      githubVerifier: () => Promise.reject(new Error("qa verifier unavailable")),
      dataCampVerifier: () => Promise.reject(new Error("qa verifier unavailable")),
      dropboxVerifier: () => Promise.reject(new Error("qa verifier unavailable")),
      airtableVerifier: () => Promise.reject(new Error("qa verifier unavailable")),
      dataCampApiKey: sentinels[0],
      dropboxToken: sentinels[1],
      airtableToken: sentinels[2],
      airtableBaseId: "qa-base-id",
    });

    const serialized = JSON.stringify(snapshot);

    for (const sentinel of sentinels) {
      expect(serialized).not.toContain(sentinel);
    }

    expect(serialized).not.toMatch(
      /"(?:accessToken|refreshToken|access_token|refresh_token|clientSecret|client_secret)"\s*:/,
    );
  });

  it("pins third-party GitHub Actions and disables checkout credential persistence", () => {
    const workflowFiles = readdirSync(resolve(root, ".github/workflows"))
      .filter((name) => /\.ya?ml$/.test(name))
      .map((name) => `.github/workflows/${name}`);

    for (const path of workflowFiles) {
      const fileContent = readRepoFile(path);
      const usesLines = fileContent.match(/^\s*-?\s*uses:\s*[^\n]+$/gm) ?? [];

      for (const line of usesLines) {
        const reference = line
          .replace(/^\s*-?\s*uses:\s*/, "")
          .split("#")[0]
          .trim();

        if (reference.startsWith("./")) continue;

        expect(
          reference,
          `${path} must pin third-party actions by full commit SHA`,
        ).toMatch(/@[0-9a-f]{40}$/i);
      }

      if (/uses:\s*actions\/checkout@/i.test(fileContent)) {
        const checkoutBlocks =
          fileContent.match(
            /uses:\s*actions\/checkout@[0-9a-f]{40}[^\n]*\n(?:\s+[^\n]*\n){0,6}/gi,
          ) ?? [];

        expect(checkoutBlocks.length, `${path} checkout blocks`).toBeGreaterThan(0);

        for (const block of checkoutBlocks) {
          expect(
            block,
            `${path} checkout must not persist repository credentials`,
          ).toMatch(/persist-credentials:\s*false/i);
        }
      }
    }
  });
});
