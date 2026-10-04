import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Mirrors src/core/architecture/import-boundaries.test.ts: a domain module is
// reached only through its public index barrel, and domain/core code never
// depends on presentation or database clients.
const barrelPatterns = [
  {
    group: [
      "@/domains/*/*",
      "**/domains/*/*",
      "@/core/identity/*",
      "**/core/identity/*",
      "@/core/context/*",
      "**/core/context/*",
      "@/core/authorization/*",
      "**/core/authorization/*",
    ],
    message:
      'Import a domain only through its public index barrel, e.g. "@/domains/flonts" or "@/core/identity".',
  },
];

const presentationPaths = [
  {
    name: "react",
    message: "Domain and core code must stay free of presentation dependencies.",
  },
  {
    name: "react-dom",
    message: "Domain and core code must stay free of presentation dependencies.",
  },
];

const presentationPatterns = [
  {
    group: [
      "next",
      "next/*",
      "@supabase/*",
      "**/components/ui/*",
      "@/components/ui/*",
    ],
    message:
      "Domain and core code must stay free of presentation and database clients.",
  },
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: barrelPatterns }],
      // TypeScript/React modules are ES modules; top-level declarations are
      // module-scoped and are not implicit browser globals.
      "no-implicit-globals": "off",
    },
  },
  {
    files: ["src/**/*.{test,spec}.{ts,tsx}"],
    rules: {
      "no-empty": "off",
      "no-empty-function": "off",
    },
  },
  {
    files: ["src/core/**/*.{ts,tsx}", "src/domains/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: presentationPaths,
          patterns: [...barrelPatterns, ...presentationPatterns],
        },
      ],
    },
  },
  // Scope the lint to the main source tree.
  // - ".next" / "node_modules" must match at ANY depth: the repository root
  //   holds local project copies (e.g. "academiaarcana-clean/") that carry
  //   their own ".next" and "node_modules"; a root-anchored pattern does not
  //   stop those from being linted, which floods the report with findings in
  //   generated Next.js output.
  // - The local copies themselves are git-ignored working artefacts, not part
  //   of the linted source.
  globalIgnores([
    ".next/**",
    "**/.next/**",
    "node_modules/**",
    "**/node_modules/**",
    "academiaarcana-clean/**",
  ]),
]);
