# Academia Arcana — Platform Architecture Design Specification

**Date:** 2026-09-28
**Status:** Design approved for specification; implementation pending written-spec review

## 1. Goal

Establish a production architecture for Academia Arcana in which the educational product Core remains stable and independently usable while external services are integrated as replaceable modules.

Success means:
- the Core remains functional without optional third-party integrations;
- every integration has an explicit boundary and failure behavior;
- UI, data, AI, security, observability, testing, and deployment concerns remain separated;
- accessibility and responsive behavior are first-class requirements;
- Supabase remains the system of record for application data and authorization;
- Vercel remains the primary web deployment/runtime platform;
- GitHub remains the source-of-truth for code, CI, pull requests, and quality gates.

## 2. Current technical foundation

The existing repository uses:
- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- Lucide React
- Supabase
- Vitest + Testing Library
- Playwright
- ESLint
- GitHub Actions
- Honeybadger
- Vercel deployment

The repository already defines explicit domains including identity, context, authorization, learning, planning, gamification, education, social, adaptive, intelligence, flonts, trust, data, and sanctuary.

## 3. Architecture

Use a modular monolith with explicit boundaries:

```
Experience
  ├─ Design system / components
  ├─ Pages / layouts / navigation
  └─ Accessibility / responsive interaction

Application Core
  ├─ Identity
  ├─ Context
  ├─ Authorization
  ├─ Learning
  ├─ Planning
  ├─ Gamification
  ├─ Education
  ├─ Social
  ├─ Adaptive
  ├─ Intelligence
  ├─ Flonts
  ├─ Trust
  ├─ Data
  └─ Sanctuary

Integration Layer
  ├─ AI providers / MCP
  ├─ Research providers
  ├─ Education providers
  ├─ Content providers
  ├─ Productivity providers
  └─ Security / observability providers

Infrastructure
  ├─ Supabase / PostgreSQL / Auth / RLS
  ├─ Vercel
  ├─ GitHub Actions
  └─ Monitoring / logging
```

Optional integrations MUST NOT become direct dependencies of Core domain logic.

## 4. Integration contract

Each external integration must expose an application-facing adapter rather than being imported throughout the UI.

Required conceptual interface:

```ts
export interface ArcanaIntegration<TConfig = unknown, TResult = unknown> {
  readonly id: string;
  readonly name: string;
  readonly category: IntegrationCategory;
  configure(config: TConfig): Promise<void>;
  health(): Promise<IntegrationHealth>;
  execute(input: unknown): Promise<TResult>;
}
```

The exact implementation may vary by provider, but domain code must depend on an internal contract, not a vendor SDK.

Integration categories:
- ai
- research
- education
- content
- productivity
- security
- observability

## 5. Core product surfaces

The primary user-facing product surfaces are:
- Santuário
- Academia
- Grimórios
- Missões
- Cronograma
- Foco
- Streak
- Estatísticas
- Conquistas
- Amigos
- Perfil
- Personalizar
- Configurações

The Santuário is the primary authenticated home and should consolidate context, current progress, next action, and continuity.

The public landing page remains independent of authenticated application state except for redirecting authenticated users to the Santuário.

## 6. Data and security

Supabase/PostgreSQL is the source of truth for persistent product state.

Requirements:
- RLS remains enabled for user-owned application data;
- authorization is enforced server-side and in database policies;
- secrets never enter client bundles;
- external provider credentials remain server-side;
- integration failures must not expose credentials or sensitive internal errors;
- minimize persisted personal data;
- audit security-sensitive mutations;
- preserve existing ownership constraints and cascade relationships unless a reviewed migration changes them.

## 7. AI architecture

AI capabilities belong behind the Intelligence boundary.

The Mestre Arcano may orchestrate:
- contextual study assistance;
- planning assistance;
- adaptive recommendations;
- retrieval/search;
- educational generation;
- tool calls.

AI must not invent application state. Product facts such as progress, streaks, achievements, schedules, and stored study material must come from authoritative application data.

AI providers should be replaceable through an internal provider abstraction.

## 8. Design system

The visual identity is Dark Fantasy Arcane with Arcane Academic as a complementary language.

The design system must define:
- typography;
- color and semantic tokens;
- spacing;
- surfaces;
- elevation;
- borders;
- iconography;
- buttons;
- forms;
- cards;
- dialogs;
- navigation;
- feedback states;
- loading states;
- empty states;
- error states.

Accessibility target: WCAG 2.2 AA.

Neurodesign requirements include reduced cognitive load, predictable navigation, visible focus, keyboard support, readable typography, reduced-motion support, clear hierarchy, and personalization without unnecessary complexity.

## 9. Quality and verification

Every production feature must pass the relevant layers:
1. unit tests;
2. component tests;
3. integration tests;
4. accessibility tests;
5. architecture/boundary tests;
6. E2E tests;
7. production build;
8. browser visual verification.

The repository Quality Gate remains the canonical merge gate.

Required production verification:
- no unexpected console errors;
- critical routes render;
- authentication transitions correctly;
- data reads/writes respect authorization;
- responsive layouts work at desktop and mobile widths;
- keyboard navigation works;
- primary flows have accessible names and focus behavior.

## 10. Deployment

Vercel is the primary deployment platform.

Environments:
- local development;
- preview;
- production.

Environment variables must be configured per environment and validated before build/runtime use.

Deployments should be observable and reversible.

## 11. Tooling roles

- GitHub: source control, PRs, CI, issue tracking.
- Vercel: deployment, runtime, browser verification, observability and AI platform capabilities where appropriate.
- Supabase: database, authentication, RLS and persistent state.
- Figma/Canva: visual design and reusable design assets.
- Mermaid: architecture and flow diagrams.
- DataCamp/Quizlet/Quiz Maker/Consensus/SciSpace and similar providers: optional education/research capabilities through adapters.
- Notion/Dropbox and similar providers: optional content/knowledge workflows.
- Malware/security tooling: security validation and user-protection workflows.
- Linear/Slack/calendar tooling: optional workflow integrations.
- Monitoring providers: runtime error and performance visibility.

## 12. Non-goals

This architecture does not require:
- turning every external tool into a mandatory runtime dependency;
- replacing the existing modular-monolith approach with microservices;
- adding integrations that have no concrete user-facing or engineering value;
- duplicating authoritative application data into external systems without a defined reason;
- shipping an integration before its failure, security, privacy, and accessibility behavior is defined.

## 13. Delivery phases

### Phase 1 — Foundation
Design tokens, component primitives, application shell, navigation, accessibility foundations.

### Phase 2 — Core experience
Santuário, Grimórios, Academia, planning, focus, progress, profile and settings.

### Phase 3 — Data and intelligence
Supabase integration hardening, adaptive context, Mestre Arcano and AI abstractions.

### Phase 4 — External capabilities
Research, education, content, productivity and specialized integrations, prioritized by concrete product value.

### Phase 5 — Production hardening
Performance, security, observability, browser QA, CI, preview and production deployment.

## 14. Acceptance criteria

The architecture is accepted when:
- Core domains do not import external-provider SDKs directly;
- integrations can be disabled without breaking Core routes;
- the design system provides consistent states across authenticated surfaces;
- Supabase authorization remains authoritative;
- AI cannot fabricate application state;
- WCAG 2.2 AA requirements are represented in component and E2E tests;
- the complete Quality Gate passes;
- the application is verified in a deployed Vercel environment.
