import { CORE_DOMAINS, type CoreDomain } from "./domains";

export type ArchitectureLayer = "ui" | "application" | "domain" | "ports" | "infrastructure";

export type DomainPolicy = {
  responsibility: string;
  owns: readonly string[];
  excludes: readonly string[];
  entities: readonly string[];
  useCases: readonly string[];
  allowedDependencies: readonly CoreDomain[];
  prohibitedDependencies: readonly string[];
  events: readonly string[];
  infrastructure: readonly string[];
};

const sharedInfrastructure = ["persistence adapters", "external integrations"] as const;

export const DOMAIN_POLICIES: Record<CoreDomain, DomainPolicy> = {
  identity: {
    responsibility: "Stable identity and identity lifecycle.",
    owns: ["subject identity", "identity status", "authentication integration boundary"],
    excludes: ["authorization", "full profile", "context membership", "UI preferences", "gamification"],
    entities: ["Identity"],
    useCases: ["resolve identity", "change identity lifecycle state"],
    allowedDependencies: [],
    prohibitedDependencies: ["React", "Next.js UI", "Supabase client", "authorization rules", "domain UI"],
    events: ["identity lifecycle change"],
    infrastructure: sharedInfrastructure,
  },
  context: {
    responsibility: "Resolve the context in which an action or resource is being used.",
    owns: ["context identity", "membership context", "visibility semantics"],
    excludes: ["authorization decisions", "authentication", "UI rendering"],
    entities: ["ContextResource"],
    useCases: ["resolve active context", "resolve resource visibility"],
    allowedDependencies: ["identity"],
    prohibitedDependencies: ["React", "Next.js UI", "Supabase client", "authorization policy implementation"],
    events: ["context changed", "sharing state changed"],
    infrastructure: sharedInfrastructure,
  },
  authorization: {
    responsibility: "Decide whether an actor may perform an action on a resource in a context.",
    owns: ["access requests", "access decisions", "authorization policies"],
    excludes: ["authentication", "context ownership", "UI visibility", "business content"],
    entities: ["AccessRequest", "AccessDecision"],
    useCases: ["evaluate access", "enforce policy"],
    allowedDependencies: ["identity", "context"],
    prohibitedDependencies: ["React", "Next.js UI", "Supabase client", "component state"],
    events: ["access decision recorded when audit is required"],
    infrastructure: sharedInfrastructure,
  },
  learning: {
    responsibility: "Learning processes and learner progress.",
    owns: ["learning progress", "learning sessions", "review state"],
    excludes: ["educational content ownership", "planning policy", "visual presentation"],
    entities: ["learning progress", "learning session"],
    useCases: ["record progress", "start learning session", "record review"],
    allowedDependencies: ["identity", "context", "authorization", "education"],
    prohibitedDependencies: ["React", "Next.js UI", "Supabase client", "visual tokens"],
    events: ["progress recorded", "learning session completed"],
    infrastructure: sharedInfrastructure,
  },
  planning: {
    responsibility: "Study planning and productivity orchestration.",
    owns: ["plans", "tasks", "goals", "schedule", "focus sessions"],
    excludes: ["learning progress invariants", "gamification rewards", "UI layout"],
    entities: ["study plan", "task", "goal", "schedule entry"],
    useCases: ["plan study", "schedule task", "complete task", "replan"],
    allowedDependencies: ["identity", "context", "authorization", "learning"],
    prohibitedDependencies: ["React", "Next.js UI", "Supabase client"],
    events: ["task completed", "plan changed", "focus session completed"],
    infrastructure: sharedInfrastructure,
  },
  gamification: {
    responsibility: "Progress recognition through XP, levels, missions and rewards.",
    owns: ["XP", "levels", "streak", "missions", "achievements", "titles", "rewards"],
    excludes: ["identity ownership", "authorization policy", "learning content", "UI effects"],
    entities: ["XP state", "achievement", "mission", "streak"],
    useCases: ["award progress", "evaluate achievement", "advance level"],
    allowedDependencies: ["identity", "context", "authorization", "learning", "planning"],
    prohibitedDependencies: ["React", "Next.js UI", "Supabase client"],
    events: ["XP awarded", "achievement unlocked", "mission completed", "streak changed"],
    infrastructure: sharedInfrastructure,
  },
  education: {
    responsibility: "Educational content and educational structures.",
    owns: ["subjects", "content", "materials", "concepts", "educational resources"],
    excludes: ["learner progress", "planning state", "authorization decisions"],
    entities: ["subject", "content item", "material", "concept"],
    useCases: ["publish educational content", "organize educational structure"],
    allowedDependencies: ["identity", "context", "authorization"],
    prohibitedDependencies: ["React", "Next.js UI", "Supabase client"],
    events: ["content published", "content updated"],
    infrastructure: sharedInfrastructure,
  },
  social: {
    responsibility: "Social relationships, groups and social interaction.",
    owns: ["friendships", "groups", "invitations", "social sharing", "communication relationships"],
    excludes: ["authorization policy", "context policy", "private resource ownership"],
    entities: ["friendship", "group membership", "invitation"],
    useCases: ["send invitation", "accept relationship", "share socially"],
    allowedDependencies: ["identity", "context", "authorization"],
    prohibitedDependencies: ["React", "Next.js UI", "Supabase client"],
    events: ["invitation sent", "relationship changed", "social share created"],
    infrastructure: sharedInfrastructure,
  },
  adaptive: {
    responsibility: "Adapt the learning experience using bounded personalization signals.",
    owns: ["adaptive recommendations", "pace signals", "adaptive preferences"],
    excludes: ["unrestricted data access", "identity authority", "authorization policy"],
    entities: ["adaptive signal", "recommendation"],
    useCases: ["generate recommendation", "adjust learning strategy"],
    allowedDependencies: ["identity", "context", "authorization", "learning", "education"],
    prohibitedDependencies: ["React", "Next.js UI", "Supabase client", "unbounded data access"],
    events: ["recommendation generated", "adaptation applied"],
    infrastructure: sharedInfrastructure,
  },
  intelligence: {
    responsibility: "Master Arcane intelligence orchestration through authorized contracts and tools.",
    owns: ["reasoning orchestration", "context building", "tool authorization boundary", "autonomy policy integration"],
    excludes: ["superuser access", "direct universal table access", "unbounded domain mutation"],
    entities: ["intelligence request", "tool authorization"],
    useCases: ["prepare authorized context", "produce suggestion", "prepare permitted action"],
    allowedDependencies: ["identity", "context", "authorization", "learning", "education", "adaptive"],
    prohibitedDependencies: ["direct database access", "React", "Next.js UI", "Supabase client", "unscoped domain access"],
    events: ["intelligence request completed", "suggestion produced"],
    infrastructure: ["authorized model adapter", "authorized tool adapters", "audit adapter"],
  },
  flonts: {
    responsibility: "Flonts product/runtime experience within explicit scope.",
    owns: ["Flonts state", "expressions", "interactions", "contextual presentation contract"],
    excludes: ["universal data access", "authorization bypass", "domain ownership outside Flonts"],
    entities: ["Flonts state", "Flonts interaction"],
    useCases: ["resolve contextual Flonts state", "execute authorized interaction"],
    allowedDependencies: ["identity", "context", "authorization"],
    prohibitedDependencies: ["direct database access", "React", "Next.js UI", "Supabase client", "React internals in domain contracts", "unscoped domain access"],
    events: ["Flonts state changed", "Flonts interaction executed"],
    infrastructure: ["runtime adapter", "authorized persistence adapter"],
  },
  trust: {
    responsibility: "Trust, safety and governance mechanisms that are distinct from access decisions.",
    owns: ["consent records", "trust signals", "moderation evidence", "governance records", "relevant audit events"],
    excludes: ["authorization policy", "unbounded surveillance", "content ownership"],
    entities: ["consent record", "governance record", "trust signal"],
    useCases: ["record consent", "record governance event", "evaluate trust signal"],
    allowedDependencies: ["identity", "context", "authorization"],
    prohibitedDependencies: ["React", "Next.js UI", "Supabase client", "duplicated authorization logic"],
    events: ["consent recorded", "governance event recorded", "trust signal changed"],
    infrastructure: sharedInfrastructure,
  },
  data: {
    responsibility: "Persistence and data-platform infrastructure without becoming a universal domain owner.",
    owns: ["repository implementations", "adapters", "clients", "mappings", "portability infrastructure"],
    excludes: ["domain business invariants", "authorization policy ownership", "UI state"],
    entities: ["repository adapter", "persistence mapping", "portability job"],
    useCases: ["persist through ports", "export through domain-owned contracts", "delete through domain-owned contracts"],
    allowedDependencies: [],
    prohibitedDependencies: ["React", "Next.js UI", "Supabase client", "domain business rules", "implicit cross-domain queries"],
    events: ["persistence operation completed", "portability operation completed"],
    infrastructure: ["Supabase adapter", "database client", "migration adapter", "backup/recovery adapter"],
  },
};

export const ARCHITECTURE_LAYERS: readonly ArchitectureLayer[] = [
  "ui",
  "application",
  "domain",
  "ports",
  "infrastructure",
];

export const DOMAIN_DEPENDENCY_DIRECTION = [
  "ui -> application",
  "application -> domain",
  "domain -> ports",
  "infrastructure -> ports",
] as const;
