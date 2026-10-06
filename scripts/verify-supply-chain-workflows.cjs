/* eslint-disable @typescript-eslint/no-require-imports */

const {
  existsSync,
  readdirSync,
  readFileSync,
} = require("node:fs");
const { resolve } = require("node:path");

const root = process.cwd();
const workflowDir = resolve(root, ".github/workflows");
const codeownersPath = resolve(root, ".github/CODEOWNERS");

if (!existsSync(workflowDir)) {
  throw new Error("Missing .github/workflows directory.");
}

if (!existsSync(codeownersPath)) {
  throw new Error("Missing .github/CODEOWNERS for security-sensitive policy surfaces.");
}

const codeowners = readFileSync(codeownersPath, "utf8");
for (const requiredOwnership of [
  "/.github/ @arcana-academy",
  "/render.yaml @arcana-academy",
  "/package-lock.json @arcana-academy",
  "/scripts/verify-dependency-lifecycle-scripts.cjs @arcana-academy",
  "/scripts/verify-supply-chain-workflows.cjs @arcana-academy",
]) {
  if (!codeowners.includes(requiredOwnership)) {
    throw new Error(`Missing CODEOWNERS policy: ${requiredOwnership}`);
  }
}

const workflowFiles = readdirSync(workflowDir)
  .filter((name) => /\.ya?ml$/i.test(name))
  .sort();

const autofixWorkflowPath = resolve(workflowDir, "autofix.yml");
if (existsSync(autofixWorkflowPath)) {
  const autofixWorkflow = readFileSync(autofixWorkflowPath, "utf8");
  if (/^\s*push\s*:/m.test(autofixWorkflow)) {
    throw new Error(
      "autofix.yml must not run on push; autofix write authority is restricted to pull-request branches.",
    );
  }
  if (!/^\s*pull_request\s*:/m.test(autofixWorkflow)) {
    throw new Error(
      "autofix.yml must remain scoped to pull_request.",
    );
  }
}

const shaPinnedUse = /^[^\s@]+@[0-9a-f]{40}$/i;

for (const fileName of workflowFiles) {
  const path = resolve(workflowDir, fileName);
  const content = readFileSync(path, "utf8");
  const lines = content.split(/\r?\n/);

  if (/\bpull_request_target\s*:/m.test(content)) {
    throw new Error(
      `${fileName}: pull_request_target is prohibited by the supply-chain trust boundary.`,
    );
  }

  if (/\bwrite-all\b/i.test(content)) {
    throw new Error(
      `${fileName}: write-all permissions are prohibited.`,
    );
  }

  if (/^\s*contents:\s*write\s*$/m.test(content)) {
    throw new Error(
      `${fileName}: GitHub Actions workflows must not receive contents: write.`,
    );
  }

  if (!/^permissions\s*:/m.test(content)) {
    throw new Error(
      `${fileName}: explicit top-level permissions are required.`,
    );
  }

  const usesEntries = [];
  lines.forEach((line, index) => {
    const match = line.match(/^\s*-?\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/);
    if (match) usesEntries.push({ value: match[1], index });
  });

  for (const entry of usesEntries) {
    if (entry.value.startsWith("./")) continue;

    if (!shaPinnedUse.test(entry.value)) {
      throw new Error(
        `${fileName}:${entry.index + 1}: third-party action is not pinned to a full commit SHA: ${entry.value}`,
      );
    }

    if (entry.value.startsWith("actions/checkout@")) {
      const nearby = lines
        .slice(entry.index + 1, entry.index + 10)
        .join("\n");

      if (!/^\s*persist-credentials:\s*false\s*$/m.test(nearby)) {
        throw new Error(
          `${fileName}:${entry.index + 1}: checkout must set persist-credentials: false.`,
        );
      }
    }
  }

  if (/\bpull_request\s*:/m.test(content)) {
    const secretRefs = [
      ...content.matchAll(/secrets\.([A-Z0-9_]+)/g),
    ].map((match) => match[1]);

    const disallowed = secretRefs.filter(
      (name) => name !== "GITHUB_TOKEN",
    );

    if (disallowed.length > 0) {
      throw new Error(
        `${fileName}: pull_request workflow references repository secrets: ${[...new Set(disallowed)].join(", ")}`,
      );
    }
  }
}

console.log(
  `Supply-chain workflow boundary verified across ${workflowFiles.length} workflow files.`,
);
