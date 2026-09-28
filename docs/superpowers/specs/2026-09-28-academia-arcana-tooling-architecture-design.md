# Academia Arcana Tooling Architecture Design

## Goal

Establish a production-oriented tool architecture for Academia Arcana in which the product core remains independent from optional external integrations, while design, development, data, AI, security, QA, and deployment tools form a coherent delivery pipeline.

## Product intent

Academia Arcana is an accessible, customizable educational platform with a Dark Fantasy Arcane / Arcane Academic visual identity. The core experience is organized around Sanctuary, Grimoires, Missions, Planning, Focus, Streaks, Statistics, Achievements, Friends, Profile, Personalization, and Settings.

## Architectural principles

1. Core-first: the application must remain useful without optional third-party integrations.
2. Explicit boundaries: identity, context, authorization, learning, planning, gamification, education, social, adaptive, intelligence, flonts, trust, data, and sanctuary remain independently testable domains.
3. Integration isolation: external providers are accessed through adapters/interfaces rather than embedded throughout product domains.
4. Progressive enhancement: optional integrations enhance workflows without becoming hard dependencies for core navigation or persistence.
5. Accessibility by default: WCAG 2.2 AA is the minimum target; keyboard, screen reader, contrast, reduced motion, cognitive load, and responsive behavior are first-class requirements.
6. Data minimization and security: Supabase RLS and least privilege protect user data; secrets never enter client code or source control.
7. Evidence before completion: implementation is not considered complete until lint, typecheck, tests, accessibility, build, and E2E verification are green.
8. Production observability: errors, runtime behavior, and performance must be observable without exposing sensitive user data.

## Tooling layers

### Product core

Next.js App Router, React, TypeScript, Tailwind/CSS, Lucide React, Supabase, Vitest, Testing Library, Playwright, GitHub Actions, and Vercel.

### Design and visual system

Figma and Canva are used for design exploration, visual assets, presentation materials, and brand consistency. Mermaid is used for architecture and flow documentation. The implementation remains source-controlled in GitHub.

### Data and backend

Supabase provides PostgreSQL, authentication, RLS, and application persistence. Database access must remain behind domain/application boundaries. Schema changes are migration-driven.

### AI

Vercel AI SDK / AI Gateway are the preferred platform layer for AI-native experiences. AI features must use explicit tool contracts, persistence where needed, bounded context, and safe failure behavior. AI must not invent application state.

### External educational/content integrations

Quizlet, Ace Quiz Maker, DataCamp, Consensus, SciSpace, Tarteel, A-Z Holy Bible, and other specialized providers are optional adapters. Each integration must have a clear user-facing purpose, an isolated interface, graceful failure, and no dependency from core authentication/navigation.

### Productivity and knowledge integrations

Notion, Dropbox, Slack, Linear, Outlook Calendar, and related providers may support knowledge capture, files, collaboration, planning, and workflow automation. These remain optional integration modules.

### Security and observability

Vercel Firewall/WAF, Honeybadger, Vercel Observability, and Malwarebytes-supported workflows are complementary security/observability capabilities. They do not replace application authorization, RLS, secure headers, validation, or automated tests.

## Integration contract

Each external integration should expose:

- capability identifier;
- availability/health status;
- authentication requirements;
- input/output contract;
- timeout/retry policy;
- user-facing fallback;
- telemetry classification;
- data-retention expectations.

Core domains must depend on internal interfaces, never directly on provider SDKs where practical.

## User experience architecture

The primary shell is responsible for global navigation, responsive behavior, accessibility, theme tokens, notifications, and authenticated state. Feature domains render inside the shell.

The visual hierarchy should prioritize:

1. current context;
2. next meaningful action;
3. progress and continuity;
4. optional enrichment.

The interface should avoid presenting a wall of integrations. Integrations should appear contextually where they solve a concrete learning or productivity need.

## Delivery pipeline

Design → source implementation → database migration → automated unit/component/accessibility tests → browser/E2E verification → production build → preview deployment → observability/security verification → production deployment.

## Quality gates

A change is eligible for merge only when applicable checks pass:

- ESLint;
- TypeScript typecheck;
- Vitest;
- accessibility tests;
- production build;
- Playwright E2E;
- architecture/domain boundary tests where applicable;
- visual/browser verification for UI changes.

## Current repository constraints

The repository currently standardizes on Node.js 24 and npm 11.19.1. The existing package declares Next.js 16.3.6, React 19.3.0, TypeScript 6.0.3, Vitest 4.1.11, Playwright 1.63.0, and Supabase packages. The existing CI quality workflow already models the required quality sequence.

## Non-goals

- Installing every available connector into the production bundle.
- Making external providers mandatory for the core application.
- Replacing Supabase authorization with provider-side authorization.
- Adding features solely because an integration exists.
- Treating audits as completion without implementing the required fixes.

## Success criteria

The architecture is successful when the Academia Arcana core can build, test, authenticate, persist data, and operate independently; integrations can be enabled or disabled behind stable contracts; and the complete user experience passes accessibility, browser, build, security, and deployment verification.
