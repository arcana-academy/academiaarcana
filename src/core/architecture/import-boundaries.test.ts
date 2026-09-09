import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { CORE_DOMAINS, type CoreDomain } from "./domains";
import { DOMAIN_POLICIES } from "./domain-policy";

const srcRoot = resolve(process.cwd(), "src");

// Modules that must not reach for presentation or database clients directly.
const domainRoots = [resolve(srcRoot, "core"), resolve(srcRoot, "domains")];
// Layers included in the dependency graph and the domain-policy checks. The
// application layer wires domains to presentation, so it may use React and is
// excluded from the presentation prohibition above, but its imports still form
// cycles and cross-module edges that must be measured.
const graphRoots = [...domainRoots, resolve(srcRoot, "application")];
const sourceExtensions = new Set([".ts", ".tsx"]);
const ignoredFilePattern = /\.test\.[^.]+$/;

// The `@/*` alias maps to `src/*` in both tsconfig.json and vitest.config.ts.
const aliasPrefix = "@/";

function collectSourceFiles(root: string): string[] {
  if (!existsSync(root)) return [];

  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(path));
    } else if (sourceExtensions.has(extname(entry.name)) && !ignoredFilePattern.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

function importSpecifiers(source: string): string[] {
  const imports: string[] = [];
  const pattern = /(?:import\s+(?:type\s+)?[^"']*?from\s+|import\s*\()(["'])([^"']+)\1/g;

  for (const match of source.matchAll(pattern)) {
    imports.push(match[2]);
  }
  return imports;
}

function resolveLocalImport(from: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith(".")) {
    base = resolve(dirname(from), specifier);
  } else if (specifier.startsWith(aliasPrefix)) {
    base = resolve(srcRoot, specifier.slice(aliasPrefix.length));
  } else {
    return null;
  }

  // A bare directory resolves to its barrel, so drop the directory match and
  // keep only real files; existsSync alone would return the directory itself.
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? null;
}

function dependencyGraph(files: string[]): Map<string, string[]> {
  const knownFiles = new Set(files);
  const graph = new Map<string, string[]>();

  for (const file of files) {
    const imports = importSpecifiers(readFileSync(file, "utf8"))
      .map((specifier) => resolveLocalImport(file, specifier))
      .filter((target): target is string => target !== null && knownFiles.has(target));
    graph.set(file, imports);
  }

  return graph;
}

function findCycles(graph: Map<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function visit(node: string): void {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      cycles.push([...stack.slice(start), node]);
      return;
    }
    if (visited.has(node)) return;

    visiting.add(node);
    stack.push(node);
    for (const dependency of graph.get(node) ?? []) visit(dependency);
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of graph.keys()) visit(node);
  return cycles;
}

// Each domain owns exactly one directory: the three identity/access domains
// live under src/core, the rest under src/domains.
const domainDirectories = new Map<CoreDomain, string>(
  CORE_DOMAINS.map((domain) => {
    const coreDir = resolve(srcRoot, "core", domain);
    return [domain, existsSync(coreDir) ? coreDir : resolve(srcRoot, "domains", domain)];
  }),
);

function domainOf(path: string): CoreDomain | null {
  for (const [domain, dir] of domainDirectories) {
    if (path === dir || path.startsWith(`${dir}${sep}`)) return domain;
  }
  return null;
}

function isDomainBarrel(path: string, domain: CoreDomain): boolean {
  const dir = domainDirectories.get(domain);
  return path === join(dir ?? "", "index.ts") || path === join(dir ?? "", "index.tsx");
}

type CrossDomainImport = { specifier: string; target: string; targetDomain: CoreDomain };

// Every import in `file` that resolves into a domain other than `sourceDomain`.
function crossDomainImports(file: string, sourceDomain: CoreDomain | null): CrossDomainImport[] {
  const edges: CrossDomainImport[] = [];
  for (const specifier of importSpecifiers(readFileSync(file, "utf8"))) {
    const target = resolveLocalImport(file, specifier);
    if (target === null) continue;

    const targetDomain = domainOf(target);
    if (targetDomain === null || targetDomain === sourceDomain) continue;

    edges.push({ specifier, target, targetDomain });
  }
  return edges;
}

describe("architecture import boundaries", () => {
  const files = domainRoots.flatMap(collectSourceFiles);
  const graphFiles = graphRoots.flatMap(collectSourceFiles);

  it("resolves the @/* alias so alias imports are visible to the checks", () => {
    const resolved = resolveLocalImport(
      resolve(srcRoot, "application/identity/IdentityResolver.ts"),
      "@/core/identity",
    );
    expect(resolved).toBe(resolve(srcRoot, "core/identity/index.ts"));
  });

  it("detects cycles regardless of whether they are built from relative or alias imports", () => {
    const firstBarrel = resolve(srcRoot, "domains/first/index.ts");
    const secondBarrel = resolve(srcRoot, "domains/second/index.ts");
    const cyclic = new Map<string, string[]>([
      [firstBarrel, [secondBarrel]],
      [secondBarrel, [firstBarrel]],
    ]);
    expect(findCycles(cyclic)).not.toEqual([]);
  });

  it("does not allow domain/core source to depend on presentation or database clients", () => {
    const violations: string[] = [];

    for (const file of files) {
      const relativeFile = relative(process.cwd(), file);
      for (const specifier of importSpecifiers(readFileSync(file, "utf8"))) {
        if (/^(react|react-dom)(\/|$)/.test(specifier)) violations.push(`${relativeFile} -> ${specifier}`);
        if (/^next(\/|$)/.test(specifier)) violations.push(`${relativeFile} -> ${specifier}`);
        if (/^@supabase\//.test(specifier)) violations.push(`${relativeFile} -> ${specifier}`);
        if (specifier.includes("components/ui")) violations.push(`${relativeFile} -> ${specifier}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not contain circular local imports across core, domain and application source", () => {
    const cycles = findCycles(dependencyGraph(graphFiles));
    expect(cycles).toEqual([]);
  });

  it("only imports domains that domain-policy declares as allowed dependencies", () => {
    const violations: string[] = [];

    for (const file of graphFiles) {
      const sourceDomain = domainOf(file);
      if (sourceDomain === null) continue;

      const relativeFile = relative(process.cwd(), file);
      for (const { specifier, targetDomain } of crossDomainImports(file, sourceDomain)) {
        if (!DOMAIN_POLICIES[sourceDomain].allowedDependencies.includes(targetDomain)) {
          violations.push(`${relativeFile} -> ${specifier} (${sourceDomain} may not depend on ${targetDomain})`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("imports another domain only through its public index barrel", () => {
    const violations: string[] = [];

    for (const file of graphFiles) {
      const relativeFile = relative(process.cwd(), file);
      for (const { specifier, target, targetDomain } of crossDomainImports(file, domainOf(file))) {
        if (!isDomainBarrel(target, targetDomain)) {
          violations.push(`${relativeFile} -> ${specifier} (reach into ${targetDomain} internals, use its index)`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not let barrel exports expose infrastructure or presentation details", () => {
    const violations: string[] = [];

    for (const file of files.filter((candidate) => candidate.endsWith("/index.ts"))) {
      for (const specifier of importSpecifiers(readFileSync(file, "utf8"))) {
        if (/^@supabase\//.test(specifier) || specifier.includes("components/ui") || /^next(\/|$)/.test(specifier)) {
          violations.push(`${relative(process.cwd(), file)} -> ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
