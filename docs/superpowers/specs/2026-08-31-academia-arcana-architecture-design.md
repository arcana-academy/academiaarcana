# Academia Arcana Architecture & Design System — Design Specification

## Status

**APPROVED CONCEPTUAL ARCHITECTURE / HISTORICAL STRATEGIC SPECIFICATION**

The operational architecture is now maintained in `docs/architecture/AA-ARCHITECTURE-1.0.md`.

This document remains the strategic/conceptual design record. It must not be used as evidence that a future capability is implemented. When a detail in this document differs from the operational baseline, the operational baseline is authoritative for the current repository architecture.

## Goal

Establish the production architecture and visual foundation for Academia Arcana as a modular, contextual, privacy-first educational platform that can evolve without premature microservices.

## Architectural direction

Academia Arcana starts as a modular monolith / modular monorepo. Domain boundaries, application services, contracts, authorization checks, and infrastructure adapters must be explicit so individual domains can later be extracted into independent services only when scale, isolation, operational ownership, or integration requirements justify it.

## Operational synchronization

The current repository operationalizes this concept through:

- a 14-domain canonical registry, including `sanctuary`;
- explicit domain policies and dependency validation;
- query/command/event communication contracts;
- persistent data ownership contracts;
- typed authorized Mestre Arcano context ports;
- Planning ownership of persisted focus-session state;
- import-boundary and architecture tests.

See `docs/architecture/AA-ARCHITECTURE-1.0.md` for the current contract.

## Core principles

- Identity, context, authorization, domain rules, governance, and infrastructure are separate concerns.
- Membership in a context never implies universal access.
- Permissions are evaluated by actor, role, context, resource, action, purpose, and applicable restrictions.
- Frontend visibility is not a security boundary; server-side authorization and database RLS enforce access.
- The Master Arcane AI is an assistant, not a superuser. It receives only the minimum authorized context needed for a task.
- Memory, history, Laboratory findings, and personal data are distinct concepts.
- Inference is never treated as diagnosis, immutable personality, intelligence label, or destiny.
- The Potential Map opens possibilities and never closes doors.
- Gamification recognizes progress and never uses shame, guilt, or artificial failure as motivation.
- Flonts may be globally present but never receives global data access.
- Nothing is shared automatically; sharing is conscious, contextual, and permissioned.
- Security, privacy, accessibility, and cognitive comfort are first-class design requirements.
- Pure white (#FFFFFF) is not the dominant interface color.
- The visual identity combines Dark Fantasy Arcane (dominant) with Arcane Academic (complementary), while preserving all previously approved themes.

## Domain map

### Foundations

1. Identity & Account — authentication and security identity.
2. Context & Membership — context and membership resolution.
3. Authorization & Privacy — permissions and access decisions.

### Learning and experience

4. Learning Core — Grimoires, notebooks, chapters, pages, learning materials, learning history and learner progress.
5. Planning & Productivity — goals, tasks, schedule, focus mode, Pomodoro, reminders, and replanning.
6. Gamification & Progress — XP, levels, titles, achievements, missions and streaks.
7. Education — educational content and educational structures.
8. Social & Communication — friends, invitations, messages, sharing and communication.

### Intelligence

9. Adaptive Learning Lab — bounded adaptive personalization.
10. Arcane Intelligence — Master Arcane reasoning, context building, recommendations and autonomy policy.
11. Flonts Runtime — Flonts state, expressions, interactions, accessibility and contextual presentation.

### Trust and infrastructure

12. Trust, Safety & Governance — reports, moderation, evidence, appeals, policies, terms, consent/acceptance records, security and relevant audit events.
13. Data Platform & Portability — persistence, export/import, retention, deletion, anonymization, backup/recovery and migration infrastructure.

14. Sanctuary — personalized learner entry point, continuation, priorities and snapshot composition.

The distinction between conceptual product scope and current code implementation remains mandatory.

## Request flow

UI -> application use case -> identity/context/authorization as required -> domain service or contract -> infrastructure adapter -> relevant audit event -> response.

## AI request flow

User/context -> authorization -> authorized context ports -> minimum necessary authorized data -> Master Arcane -> autonomy policy -> suggestion / preparation / permitted execution.

High-impact actions require the appropriate confirmation or human/specialist decision.

## Data architecture principles

- Each domain owns its domain data and invariants.
- Shared identifiers and references are explicit rather than hidden through arbitrary cross-domain queries.
- Supabase RLS is a mandatory enforcement layer, complemented by application-level authorization and database constraints.
- Cross-domain reads occur through typed application/domain interfaces, not by reaching into another domain's tables from arbitrary UI code.
- Export and deletion orchestrate across domain owners rather than bypassing ownership.
- Audit records are proportional and do not become blanket surveillance.

## Visual design system

### Visual identity

Dark Fantasy Arcane + Arcane Academic. Dark Fantasy Arcane supplies atmosphere, depth, mystery, sophistication and cinematic character. Arcane Academic supplies study, knowledge, library, notebook, grimoire and intellectual warmth.

### Themes

All previously approved theme presets remain supported, including: Mago Clássico, Escuro, Estudioso, Natural, Cinematic, Delicado, Gamer, Cozy Café, Noturno and Romântico, plus future/previously registered variants. Themes are token configurations, not separate component implementations.

### Tokens

Use semantic tokens for surfaces, text, borders, accents, states, focus, spacing, radii, typography and motion. Components consume semantic tokens; themes map values to tokens. Avoid hard-coded theme colors inside components.

### Accessibility

Accessibility is structural: keyboard navigation, visible focus, WCAG-oriented contrast, scalable typography, OpenDyslexic option, font-size controls, high-contrast mode, color-vision accommodations, reduced motion and predictable interaction patterns.

### Motion and magic

Magical effects must communicate, reward or create atmosphere without competing with information. Reduced-motion preferences disable or simplify nonessential animation and particles.

### Flonts

Flonts is a reusable experience layer, not a data-access shortcut. It may appear across pages with contextual states and can be visually reduced or hidden according to user preferences.

## Approved behavioral rules represented here

Decisions 411–436 remain authoritative, including AI autonomy, inference confidence, data classification, context isolation, authorization/consent distinctions, retention/deletion, export, collaborative content, copies, non-punitive gamification, notification criticality, moderation, security access, account deletion, educator/institution separation, room closure, memory, inference control, autodidact replanning, contribution history, verification/acting/suspension separation, and institutional contexts.

## Non-goals for this phase

- Do not introduce microservices merely for architectural fashion.
- Do not implement every future feature in one pass.
- Do not make the AI a universal database client.
- Do not rebuild the entire existing product blindly; inspect and preserve existing working flows.
- Do not sacrifice accessibility or cognitive comfort for decorative effects.
