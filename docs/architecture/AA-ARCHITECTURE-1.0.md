# Academia Arcana — AA-ARCHITECTURE-1.0

## Status

**CANÔNICO — OPERATIONAL ARCHITECTURE BASELINE**

This document is the operational companion to the conceptual architecture specification. The conceptual specification remains historical/strategic; this document records the architecture as currently formalized in the repository.

**Repository:** `arcana-academy/academiaarcana`  
**Canonical branch:** `main`  
**Baseline commit at synchronization:** `ae53e2d5dec033ac4d00fca6d938e0aa9926fa83`

Status vocabulary:

- **CANÔNICO** — official architectural decision in force.
- **CONFIRMADO** — supported by repository or external evidence, but not itself a design decision.
- **IMPLEMENTADO** — represented in repository code.
- **VALIDADO** — covered by an appropriate automated or reviewable verification.
- **PROPOSTA** — not adopted.
- **PENDENTE** — unresolved decision or implementation required for this document's scope.
- **CONFLITANTE** — contradictory evidence exists.
- **DESCONHECIDO** — insufficient evidence.

---

## 1. Architectural model

Academia Arcana uses a **modular monolith**.

The application remains an integrated product, while business responsibilities are separated into explicit domains. The monolith is therefore organized by architectural boundaries rather than by screens or arbitrary folders.

### Core rule

> High cohesion, low coupling, explicit contracts, controlled dependencies, proportional complexity.

### Non-goals

- No premature microservices.
- No distributed architecture merely for architectural appearance.
- No universal database client owned by AI or UI.
- No domain created only to organize files.
- No duplicate business invariants merely to satisfy a layer diagram.

---

## 2. Logical layers

The current architectural layer model is:

```text
ui
 ↓
application
 ↓
domain
 ↓
ports
 ↑
infrastructure
```

These are **logical responsibilities**, not mandatory directory names.

### UI

Pages, components, interaction, visual state and accessibility behavior.

### Application

Use-case orchestration and application services.

### Domain

Business concepts, invariants and domain behavior.

### Ports

Consumer-owned contracts expressing required capabilities.

### Infrastructure

Concrete persistence, external providers, adapters and runtime technical details.

---

## 3. Canonical domains

The repository currently formalizes **14 domains**:

1. identity
2. context
3. authorization
4. learning
5. planning
6. gamification
7. education
8. social
9. adaptive
10. intelligence
11. flonts
12. trust
13. data
14. sanctuary

The domain registry is implemented in `src/core/architecture/domains.ts`.

The first three foundations are represented under `src/core`; the business domains are represented under `src/domains`. This physical split does not change their logical status as architectural domains.

---

## 4. Domain responsibility contract

The canonical policy is implemented in `src/core/architecture/domain-policy.ts`.

| Domain | Canonical responsibility | Excludes |
|---|---|---|
| identity | Stable identity and identity lifecycle | authorization, full profile, context membership, UI preferences, gamification |
| context | Resolve action/resource context, membership context and visibility semantics | authorization decisions, authentication, UI rendering |
| authorization | Decide whether an actor may perform an action on a resource in a context | authentication, context ownership, UI visibility, business content |
| learning | Learning processes and learner progress | educational content ownership, planning policy, visual presentation |
| planning | Study planning and productivity orchestration | learning progress invariants, gamification rewards, UI layout |
| gamification | XP, levels, missions, achievements, streak and rewards | identity ownership, authorization policy, learning content, UI effects |
| education | Educational content and educational structures | learner progress, planning state, authorization decisions |
| social | Social relationships, groups and social interaction | authorization policy, context policy, private resource ownership |
| adaptive | Bounded adaptation and personalization signals | unrestricted data access, identity authority, authorization policy |
| intelligence | Authorized Master Arcane orchestration and tool/context boundaries | superuser access, universal table access, unbounded mutation |
| flonts | Scoped Flonts runtime/product experience | universal data access, authorization bypass, ownership outside Flonts |
| trust | Trust, safety and governance distinct from access decisions | authorization policy, unbounded surveillance, content ownership |
| data | Persistence and portability infrastructure | business invariants, authorization ownership, UI state |
| sanctuary | Personalized learner entry point, snapshot, continuation and priorities | learning progress ownership, educational ownership, planning policy, authorization, UI rendering |

### Resolution of previous pending boundary questions

- **Learning vs Education:** Learning owns learning processes/progress; Education owns educational content/structures.
- **Context:** owns context resolution, membership context and visibility semantics; it does not make authorization decisions.
- **Trust:** owns trust/safety/governance mechanisms distinct from authorization.
- **Flonts:** owns the scoped Flonts runtime/product layer, not universal application data.
- **Data:** owns persistence/portability infrastructure, not business-domain state.
- **Sanctuary:** is a formal domain, not merely a page-level feature.

These are now **CANÔNICO + IMPLEMENTADO**.

---

## 5. Canonical dependency matrix

The dependency matrix is derived from the domain policies and validated for unknown, duplicate, self and cyclic dependencies.

### Allowed dependencies

```text
identity      -> none
context       -> identity
authorization -> identity, context
learning      -> identity, context, authorization, education
planning      -> identity, context, authorization, learning
gamification  -> identity, context, authorization, learning, planning
education     -> identity, context, authorization
social        -> identity, context, authorization
adaptive      -> identity, context, authorization, learning, education
intelligence  -> identity, context, authorization, learning, education, adaptive
flonts        -> identity, context, authorization
trust         -> identity, context, authorization
data          -> none
sanctuary     -> identity, context, authorization, learning, education, planning, gamification, adaptive
```

### Architectural direction

```text
ui -> application
application -> domain
domain -> ports
infrastructure -> ports
```

Cross-domain imports are checked against the declared dependency policy and must use public domain barrels rather than private internals.

State: **CANÔNICO + IMPLEMENTADO + VALIDADO**.

---

## 6. Domain communication contract

Cross-domain communication is explicitly classified as:

- **Query** — read request.
- **Command** — change intent.
- **Event** — immutable fact after a successful change.

Direct domain communication therefore requires:

```text
source
target
kind = query | command
contractName
```

Events require:

```text
source
kind = event
eventName
```

A domain event belongs to its producer. Direct communication to self, unknown targets, undeclared targets, unnamed contracts and undeclared events are invalid.

Implemented in:

```
src/core/architecture/domain-communication.ts
src/core/architecture/domain-communication.test.ts
```

State: **CANÔNICO + IMPLEMENTADO + VALIDADO**.

---

## 7. Commands, Queries, Use Cases, Ports, Repositories and Events

### Commands

Represent the **intention to change**.

### Queries

Represent reads without business side effects.

### Use Cases

Represent the **unit of application behavior** and orchestrate an operation.

### Ports

Contracts owned by the consumer/domain defining the required capability.

### Repositories

Persistence ports implemented by infrastructure.

### Events

Immutable facts emitted after a successful state transition when another part of the system needs to react or record the fact.

This semantic separation is canonical.

---

## 8. Persistent data ownership

The ownership registry is implemented in:

```
src/core/architecture/data-ownership.ts
src/core/architecture/data-ownership.test.ts
```

### Current ownership

| Resource | Kind | Owner |
|---|---|---|
| public.grimoires | table | learning |
| public.notebooks | table | learning |
| public.chapters | table | learning |
| public.pages | table | learning |
| public.page_progress | table | learning |
| public.study_tasks | table | planning |
| public.gamification_profiles | table | gamification |
| public.missions | table | gamification |
| public.focus_sessions | table | planning |
| public.friend_connections | table | social |
| public.feedback_responses | table | trust |
| public.integration_credentials | table | infrastructure |
| public.external_document_sources | table | infrastructure |
| public.complete_study_task_with_reward | database-rpc | cross-domain |
| public.move_workspace_page | database-rpc | learning |
| storage.grimoire-covers | storage-bucket | learning |

### Ownership rules

1. Domain ownership does not move merely because another domain consumes the data.
2. Cross-domain transactions may coordinate invariants without transferring ownership.
3. Infrastructure credentials and external-source descriptors remain infrastructure resources.
4. Storage is a persistence mechanism; semantic ownership stays with the relevant business domain.
5. Data is not a universal business-domain owner.

State: **CANÔNICO + IMPLEMENTADO + VALIDADO**.

---

## 9. Application/use-case inventory

The current implementation inventory is intentionally evidence-based.

### Implemented application behavior

**Identity**
- IdentityResolver
- identity contracts

**Learning**
- Workspace service
- Workspace state

**Planning**
- StudyTaskService
- FocusSessionService

**Gamification**
- Complete study task / reward orchestration

**Intelligence**
- Execute Mestre Arcano

**Flonts**
- FlontsProvider

**Sanctuary**
- getSanctuary
- sanctuary view-model assembly

**Accessibility**
- accessibility-preferences application provider/context/hooks

### Domains with canonical contracts but no dedicated application use-case implementation currently visible

- education
- social
- adaptive
- trust
- data

This is **not an architectural defect**. It means these domains currently provide contracts/policy boundaries while their future application behaviors remain implementation scope for the corresponding product capabilities.

No placeholder use cases are created merely to make every domain appear symmetric.

State: **CONFIRMADO + IMPLEMENTADO PARCIALMENTE**.

---

## 10. Infrastructure/repository ownership

Concrete persistence remains infrastructure.

Known repository families include:

- Learning workspace repositories
- Learning page-progress repository
- Planning study-task repository
- Planning focus-session repository
- Gamification repository
- study-task reward repository
- Sanctuary repository
- Trust feedback repository
- Intelligence document-source repository

The application/server boundary composes these concrete adapters as needed.

The rule is not “never instantiate infrastructure from a server boundary”; the rule is that business/domain code must not depend on infrastructure details.

---

## 11. Focus architecture — resolved

The Focus persistence boundary was previously an architectural gap.

It is now resolved.

Current flow:

```text
src/app/foco/actions.ts
    ↓
FocusSessionService
    ↓
FocusSessionRepository
    ↓
SupabaseFocusSessionRepository
    ↓
focus_sessions
```

The Server Action no longer performs `.from("focus_sessions")` directly.

The implementation includes:

- duration validation;
- authenticated owner binding;
- FocusSession domain contract;
- repository port;
- Supabase adapter;
- service tests;
- adapter tests;
- architectural boundary test.

PR #419 was merged into `main` as commit `fb227dff47420495ab03b2a8e6cf786a760e12d2`.

State: **IMPLEMENTADO + VALIDADO**.

---

## 12. Mestre Arcano architecture — resolved

The AI runtime is not a universal database client.

The current architecture uses:

```text
authenticated route
    ↓
server-side context composition
    ↓
MestreArcanoToolContext
    ├── learner port
    └── document port
             ↓
authorized infrastructure adapters
             ↓
Supabase / SharePoint / external providers
```

The OpenAI runtime and tools do not directly access Supabase.

The Intelligence boundary now exposes:

- typed learner snapshots;
- typed mission snapshots;
- typed study-task snapshots;
- typed SharePoint source snapshots;
- typed document context;
- learner context port;
- document context port;
- composite tool context.

Credential ownership and authenticated-subject binding are preserved at the server boundary.

PR #417 was merged into `main` as commit `ae53e2d5dec033ac4d00fca6d938e0aa9926fa83`.

State: **CANÔNICO + IMPLEMENTADO + VALIDADO**.

---

## 13. AI safety and authority

The Master Arcane:

- is an assistant, not a superuser;
- receives only authorized/minimum context required by tools;
- cannot grant itself permissions;
- cannot access arbitrary tables by model choice;
- must not invent learner progress, notes, tasks, XP, streaks, missions or personal data;
- must treat external document content as untrusted data;
- keeps credentials server-side;
- uses typed boundary DTOs rather than domain internals.

High-impact changes must remain subject to the appropriate application authorization and confirmation rules.

---

## 14. Security architecture

Canonical security principles:

- least privilege;
- server-side authorization;
- Supabase RLS;
- owner scoping;
- input validation;
- data minimization;
- separation of identity and authorization;
- no unnecessary superuser capability;
- no client exposure of server secrets.

The frontend is never treated as the security boundary.

RLS and application authorization complement each other.

State: **CANÔNICO**.

---

## 15. Accessibility and neurodesign

Baseline:

**WCAG 2.2 AA**

Accessibility is structural and cross-cutting.

Required architectural support includes:

- keyboard navigation;
- visible focus;
- semantic markup;
- screen-reader compatibility;
- scalable typography;
- contrast;
- reduced motion;
- predictable interactions;
- user-controlled preferences;
- cognitive-load reduction;
- personalization without component duplication.

Existing application/core support includes an accessibility-preferences module with motion/environment resolution and preference merging.

State: **CANÔNICO + IMPLEMENTADO PARCIALMENTE**.

---

## 16. Product architecture mapping

| Product area | Primary architectural owner |
|---|---|
| Santuário | sanctuary, consuming planning/learning/gamification/adaptive context |
| Academia | education + learning experience |
| Grimórios | learning |
| Capítulos | learning |
| Páginas | learning |
| Missões | gamification |
| Cronograma | planning |
| Foco | planning |
| Streak | gamification |
| Estatísticas | projection of learning/gamification data |
| Conquistas | gamification |
| Amigos | social |
| Perfil | identity/application-facing profile capabilities |
| Personalização | accessibility/preferences + adaptive where applicable |
| Configurações | application/integration configuration surfaces |
| Mestre Arcano | intelligence |
| Flonts | flonts |

This table is an ownership map, not a prohibition on a view consuming other domains.

---

## 17. Repository-to-architecture mapping

### Foundation

```
src/core/identity
src/core/context
src/core/authorization
src/core/architecture
src/core/accessibility-preferences
```

### Domains

```
src/domains/adaptive
src/domains/data
src/domains/education
src/domains/flonts
src/domains/gamification
src/domains/intelligence
src/domains/learning
src/domains/planning
src/domains/sanctuary
src/domains/social
src/domains/trust
```

### Application

The application layer currently contains implemented behavior for Identity, Learning, Planning, Gamification, Intelligence, Flonts and Sanctuary, plus accessibility/preferences infrastructure at the application boundary.

### Infrastructure

Concrete persistence and integration adapters remain under `src/infrastructure`.

The physical organization has now been reconciled with the logical architecture closely enough for the current monolith.

---

## 18. Architectural verification

Current repository safeguards include:

### Domain policy validation

Checks:

- exact domain registry;
- policy coverage;
- forbidden presentation/infrastructure dependencies;
- declared dependency direction;
- acyclic matrix;
- duplicate/self/unknown dependency rejection.

### Communication validation

Checks:

- allowed communication targets;
- command/query classification;
- producer-owned event declarations;
- contract/event naming;
- self-communication rejection.

### Data ownership validation

Checks:

- unique resource ownership;
- approved owners;
- approved supporting domains;
- explicit cross-domain transaction ownership;
- storage classification.

### Import boundary validation

Checks:

- no React/Next/Supabase dependencies in domain/core source;
- no local cycles across the measured architecture graph;
- only declared cross-domain dependencies;
- public-barrel usage;
- no infrastructure/presentation leakage through domain barrels.

State: **IMPLEMENTADO + VALIDADO**.

---

## 19. Historical technical validation

The file `docs/engineering/technical-validation.md` records a prior validation cycle and must be read as historical evidence, not current live status.

It documents a successful clean-room pipeline on an earlier baseline.

Current package/runtime values are read from the current repository and are not taken from that historical report.

This distinction is intentional and canonical.

---

## 20. Resolved architecture pendências

The following previously identified items are now closed as architecture decisions:

| Previous pending item | Resolution | State |
|---|---|---|
| Learning/Education boundary | Learning owns process/progress; Education owns content/structure | CLOSED |
| Context boundary | context owns context/membership/visibility; authorization owns access decisions | CLOSED |
| Trust scope | trust/safety/governance distinct from authorization | CLOSED |
| Flonts scope | scoped runtime/product layer without universal data access | CLOSED |
| Data boundary | persistence/portability infrastructure without business ownership | CLOSED |
| Sanctuary status | formal architecture domain | CLOSED |
| Domain dependency matrix | explicit and validated | CLOSED |
| Domain communication model | query/command/event contract | CLOSED |
| Persistent data ownership | explicit resource ownership contract | CLOSED |
| Mestre Arcano boundary | typed authorized learner/document ports | CLOSED |
| Focus persistence boundary | Planning application/service + repository | CLOSED |
| Domain ↔ code mapping | 14-domain registry plus physical domain barrels | CLOSED |
| Historical vs current validation | explicit distinction in this document | CLOSED |

---

## 21. Items intentionally not promoted to architectural debt

The following are implementation backlog, not unresolved architectural decisions:

- adding new use cases for domains whose product capabilities have not yet been implemented;
- adding future repositories for future resources;
- adding future events for future workflows;
- adding future integrations;
- expanding statistics beyond currently available evidence;
- implementing future education/social/adaptive/trust/data behaviors.

No empty placeholder architecture is required for these items.

---

## 22. Current risks

### Risk: application composition can grow too broad

Server boundaries may compose several adapters. This is acceptable while the composition remains orchestration and does not absorb domain rules.

### Risk: Data becomes a catch-all abstraction

Controlled by explicit ownership and the rule that Data does not own business invariants.

### Risk: Intelligence becomes a superdomain

Controlled by typed, authorized context ports and bounded tool contracts.

### Risk: new domains bypass the registry

Controlled by explicit domain registry/policy validation.

### Risk: documentation drifts from code

Controlled by this operational baseline and the architectural tests.

---

## 23. Canonical rules for future architecture changes

Every new architecture change must preserve:

1. Explicit ownership.
2. Explicit dependency.
3. Explicit contract.
4. Authenticated and authorized access.
5. Testable behavior.
6. No unnecessary infrastructure coupling.
7. No silent replacement of prior decisions.
8. Product-driven complexity.
9. Accessibility and privacy as cross-cutting properties.
10. Render is the standard infrastructure/deployment platform for Academia Arcana; production mutations remain explicit and authorized.

---

## 24. Final canonical state

**AA-ARCHITECTURE-1.0 = CANÔNICO**

The architecture baseline is now considered **structurally consolidated**.

The previously open architectural boundary questions have explicit resolutions in code and/or this document.

The remaining work is primarily **product implementation, integration implementation, validation and future evolution**, not redefinition of the architectural foundation.

Canonical operational loop:

```text
DECIDIR
  ↓
CONTRATO
  ↓
IMPLEMENTAR
  ↓
TESTAR
  ↓
VALIDAR
  ↓
CONSOLIDAR
```

The architecture remains a living system, but changes must be explicit and traceable.
