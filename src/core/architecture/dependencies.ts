export type DomainModule<Id extends string> = {
  readonly id: Id;
};

export const DOMAIN_DEPENDENCIES = {
  identity: [],
  context: ["identity"],
  authorization: ["identity", "context"],
  learning: ["identity", "context", "authorization"],
  planning: ["identity", "context", "authorization", "learning"],
  gamification: ["identity", "learning"],
  education: ["identity", "context", "authorization", "learning"],
  social: ["identity", "context", "authorization"],
  adaptive: ["identity", "context", "authorization", "learning"],
  intelligence: ["identity", "context", "authorization", "learning", "adaptive"],
  flonts: [],
  trust: ["identity", "context", "authorization"],
  data: ["identity", "authorization", "trust"],
} as const satisfies Record<string, readonly string[]>;

export type DomainDependencyGraph = typeof DOMAIN_DEPENDENCIES;

export function assertAcyclicDomainGraph(graph: Record<string, readonly string[]>): void {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const path: string[] = [];

  function visit(domain: string): void {
    if (visiting.has(domain)) {
      const cycleStart = path.indexOf(domain);
      const cycle = [...path.slice(cycleStart), domain].join(" -> ");
      throw new Error(`Domain dependency cycle detected: ${cycle}`);
    }

    if (visited.has(domain)) return;

    visiting.add(domain);
    path.push(domain);

    for (const dependency of graph[domain] ?? []) {
      if (!(dependency in graph)) {
        throw new Error(`Unknown domain dependency: ${domain} -> ${dependency}`);
      }
      visit(dependency);
    }

    path.pop();
    visiting.delete(domain);
    visited.add(domain);
  }

  for (const domain of Object.keys(graph)) visit(domain);
}
