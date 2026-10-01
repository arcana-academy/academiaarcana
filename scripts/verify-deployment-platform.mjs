import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const packagePath = resolve(root, "package.json");
const forbiddenFiles = ["vercel.json"];
const forbiddenPackageNames = new Set(["vercel"]);

const violations = [];

for (const filename of forbiddenFiles) {
  if (existsSync(resolve(root, filename))) {
    violations.push(`Forbidden legacy deployment file present: ${filename}`);
  }
}

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const dependencySections = [
  packageJson.dependencies,
  packageJson.devDependencies,
  packageJson.optionalDependencies,
  packageJson.peerDependencies,
].filter(Boolean);

for (const section of dependencySections) {
  for (const name of Object.keys(section)) {
    if (forbiddenPackageNames.has(name) || name.startsWith("@vercel/")) {
      violations.push(`Forbidden legacy deployment dependency present: ${name}`);
    }
  }
}

if (violations.length) {
  throw new Error(
    [
      "Render is the canonical deployment platform for Academia Arcana.",
      "Legacy Vercel configuration/dependencies are not permitted.",
      ...violations.map((item) => `- ${item}`),
    ].join("\n"),
  );
}

console.log(JSON.stringify({
  deploymentPlatform: "render",
  verified: true,
}, null, 2));
