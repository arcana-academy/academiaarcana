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
      "@/core/context/*",
      "@/core/authorization/*",
    ],
    message:
      'Import a domain only through its public index barrel, e.g. "@/domains/flonts" or "@/core/identity".',
  },
];

const presentationPaths = [
  { name: "react", message: "Domain and core code must stay free of presentation dependencies." },
  { name: "react-dom", message: "Domain and core code must stay free of presentation dependencies." },
];

const presentationPatterns = [
  {
    group: ["next", "next/*", "@supabase/*", "**/components/ui/*", "@/components/ui/*"],
    message: "Domain and core code must stay free of presentation and database clients.",
  },
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: barrelPatterns }],
    },
  },
  {
    files: ["src/core/**/*.{ts,tsx}", "src/domains/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: presentationPaths, patterns: [...barrelPatterns, ...presentationPatterns] },
      ],
    },
  },
  globalIgnores([".next/**", "node_modules/**"]),
]);
