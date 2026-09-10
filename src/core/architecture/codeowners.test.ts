import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const codeownersPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  ".github",
  "CODEOWNERS",
);
const source = readFileSync(codeownersPath, "utf8");

type CodeownersRule = {
  pattern: string;
  owners: string[];
};

function parseCodeowners(contents: string): {
  comments: string[];
  rules: CodeownersRule[];
} {
  const comments: string[] = [];
  const rules: CodeownersRule[] = [];

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) continue;

    if (line.startsWith("#")) {
      comments.push(line.slice(1).trim());
      continue;
    }

    const [pattern, ...owners] = line.split(/\s+/);
    rules.push({ pattern, owners });
  }

  return { comments, rules };
}

describe("repository code ownership", () => {
  const { comments, rules } = parseCodeowners(source);

  it("documents the repository-wide ownership and review requirement", () => {
    const documentation = comments.join("\n");

    expect(documentation).toMatch(/CODEOWNERS — Academia Arcana/);
    expect(documentation).toMatch(/Proprietário padrão de todo o repositório\./);
    expect(documentation).toMatch(
      /Alterações em qualquer arquivo devem solicitar revisão do proprietário\./,
    );
  });

  it("assigns every repository path to the Academia Arcana owner", () => {
    expect(rules).toEqual([
      {
        pattern: "*",
        owners: ["@arcana-academy"],
      },
    ]);
  });

  it("does not contain unsupported negation or ownerless active rules", () => {
    for (const rule of rules) {
      expect(rule.pattern).not.toMatch(/^!/);
      expect(rule.owners.length, `owner missing for ${rule.pattern}`).toBeGreaterThan(0);
      expect(rule.owners.every((owner) => owner.startsWith("@"))).toBe(true);
    }
  });
});
