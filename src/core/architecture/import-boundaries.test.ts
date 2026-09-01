import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoots = [resolve(process.cwd(), "src/core"), resolve(process.cwd(), "src/domains")];
const sourceExtensions = new Set([".ts", ".tsx"]);
const ignoredFilePattern = /\.test\.[^.]+$/;

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
  if (!specifier.startsWith(".")) return null;

  const base = resolve(dirname(from), specifier);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
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

describe("architecture import boundaries", () => {
  const files = sourceRoots.flatMap(collectSourceFiles);

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

  it("does not contain circular local imports in core/domain source", () => {
    const cycles = findCycles(dependencyGraph(files));
    expect(cycles).toEqual([]);
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
