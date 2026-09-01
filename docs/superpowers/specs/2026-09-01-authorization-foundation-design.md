# Academia Arcana — Authorization Foundation Design

**Date:** 2026-09-01  
**Stage:** MASTER 05 — Autorização / Segurança  
**Status:** Design approved in conversation; implementation pending user review of this spec

## 1. Objective

Establish the minimum authorization foundation for the Academia Arcana without inventing product roles, permissions, resources, ownership models, or database schema that do not yet exist.

The authorization boundary answers:

> Can this actor perform this action on this resource in this context?

Authorization is distinct from identity, authentication, context, and persistence security.

## 2. Scope

This stage covers:

- a small, domain-level authorization contract;
- explicit `allow` / `deny` decisions;
- default deny behavior;
- server-side enforcement as the effective application security boundary;
- resistance to client-controlled ownership and identifier manipulation;
- authorization-focused tests;
- documentation of the boundary and its limitations;
- audit of Supabase Auth, RLS readiness, functions/RPC, grants, privileged credentials, environment exposure, and related security concerns.

This stage does **not** create:

- business roles or RBAC;
- enterprise IAM;
- product-specific permissions;
- speculative resources or ownership relationships;
- speculative database tables;
- speculative RLS policies;
- authorization-specific migrations without a real persistence requirement;
- AI/Mestre Arcano authorization behavior;
- Flonts authorization behavior.

## 3. Architectural Placement

The project remains a modular monolith.

The dependency direction is:

```text
UI → Application → Domain → Ports ← Infrastructure
```

The `authorization` domain owns authorization concepts and decisions. It must not directly depend on React, Next.js UI APIs, Supabase client APIs, or concrete infrastructure.

The domain authorization layer remains independent of persistence. Infrastructure may later provide facts or persistence adapters through ports when real product resources require them.

## 4. Authorization Guard

The foundation uses a **minimal central authorization guard**.

Responsibilities:

1. Receive an authorization request.
2. Evaluate an explicit policy.
3. Return an explicit decision.
4. Deny when authorization is absent.
5. Avoid revealing sensitive internal policy or resource information through the decision/error surface.

The guard is not a product permission registry and does not attempt to model every future resource.

The existing authorization vocabulary may be retained where it is already part of the foundation, but concrete business meaning must only be introduced when the corresponding product capability exists.

## 5. Decision Model

An authorization request may contain:

- actor identity;
- action;
- resource identifier;
- context identifier when relevant;
- purpose when relevant.

Conceptually:

```text
actor + action + resource + context + relevant relationship/state
                         ↓
                  explicit policy
                         ↓
                   ALLOW / DENY
```

`allowed: true` is valid only when an applicable policy explicitly authorizes the operation.

Absence of an applicable authorization is a denial.

Denials use controlled reasons such as unauthenticated, missing permission, wrong context, not explicitly shared, or policy denied. These reasons must not disclose whether another user's private resource exists or expose implementation details.

## 6. Server-Side Enforcement

Authorization is enforced at the server/application boundary before protected operations execute.

Protected operations include, when they exist:

- private reads;
- mutations;
- exports;
- sharing operations;
- other sensitive actions.

The following are not security boundaries by themselves:

- frontend visibility;
- hidden form fields;
- local storage;
- URL parameters;
- `proxy.ts` redirects or route protection;
- client-provided `userId` or `ownerId`.

The authenticated actor used for authorization must come from server-side authentication/session state, not from a client-supplied identity field.

Resource identifiers and ownership claims supplied by a client are untrusted input and must be validated against authoritative server-side facts before an operation is permitted.

## 7. IDOR and Privilege Escalation

The foundation explicitly guards against:

### Horizontal escalation

Actor A must not read or mutate a private resource belonging to actor B merely by replacing an identifier.

### Vertical escalation

An actor must not execute an operation outside an authorization granted by the applicable policy.

Because no real product roles or persisted product resources exist at this stage, the implementation will not invent role hierarchies or fake business entities solely for testing.

## 8. Supabase and RLS Boundary

Application authorization and persistence authorization are complementary.

The application layer determines whether an operation is allowed to proceed. Supabase RLS, when real product tables exist, provides an additional database-level protection boundary.

For future sensitive product tables, the expected baseline is:

- RLS enabled;
- explicit policies for required operations;
- ownership/context rules based on authoritative identity/context data;
- no implicit public access;
- least-privilege grants;
- tests proving that database access matches the real authorization model.

No product tables or speculative RLS policies are introduced during this stage because the audited database contains no product resources requiring them.

## 9. Functions, RPC and Privileged Operations

Any existing or future database function/RPC used by protected flows must be reviewed for:

- `SECURITY DEFINER` versus `SECURITY INVOKER` semantics;
- safe `search_path` handling;
- `EXECUTE` grants;
- public exposure;
- privilege scope;
- interaction with RLS.

A privileged database credential such as `service_role` is never an authorization decision. It is an infrastructure capability that must remain backend-only and must not be exposed through public environment variables or client bundles.

No speculative function or privileged bypass is introduced by this design.

## 10. Error and Information Disclosure Policy

Authorization failures must fail closed and expose only the minimum information necessary to the caller.

Errors must not disclose:

- tokens or secrets;
- internal stack traces;
- table names;
- RLS policy definitions;
- internal policy implementation;
- private resource existence;
- other users' identifiers or data.

Authentication failures and authorization failures must not create an account/resource enumeration channel.

## 11. Testing Strategy

Tests must verify behavior rather than merely the existence of types.

Minimum scenarios:

- explicitly authorized operation → allowed;
- unauthenticated actor → denied;
- no applicable policy → denied;
- actor A accessing actor B's private resource → denied;
- actor A mutating actor B's private resource → denied;
- direct invocation of a protected operation without authorization → denied;
- client manipulation of `userId`/`ownerId` → does not grant access;
- incompatible context → denied;
- authorization/authentication failure → no sensitive information leakage;
- architecture boundary remains intact.

When real product persistence exists, corresponding RLS tests must be added against the actual schema rather than speculative fixtures.

## 12. Documentation Requirements

The stage documentation must explain:

- identity vs authentication vs authorization;
- the authorization decision model;
- default deny;
- server-side enforcement;
- ownership validation principles;
- context as an authorization input, not an identity substitute;
- RLS as persistence-level defense in depth;
- the role and limits of `proxy.ts`;
- current limitations because product resources do not yet exist;
- future extension points without prematurely defining business permissions.

## 13. Non-Goals and Future Evolution

The foundation intentionally leaves room for future policy composition or a policy registry if real product complexity demands it.

Such evolution requires evidence from actual resources and use cases. It must not be introduced merely because the architecture may eventually become complex.

Future resources should introduce their authorization rules at the appropriate application/domain boundary and corresponding RLS boundary when persisted.

## 14. Acceptance Criteria

The stage is architecturally acceptable when:

1. authorization defaults to deny;
2. authorization decisions are independent of React/Next.js/Supabase client implementation;
3. protected server operations cannot rely on client-controlled identity or ownership claims;
4. horizontal and vertical escalation principles are covered by tests appropriate to the current resource model;
5. no speculative product schema, roles, permissions, or RLS policies are introduced;
6. Supabase privileged access remains backend-only;
7. error surfaces fail closed without sensitive information leakage;
8. architecture tests continue to enforce domain boundaries;
9. the complete Quality Gate passes after implementation;
10. documentation accurately states current guarantees and limitations.

## 15. Quality Gate

After implementation, the stage must run and record evidence for:

- Git status and diff;
- TypeScript typecheck;
- ESLint;
- unit tests;
- authorization/security tests;
- architecture tests;
- accessibility smoke;
- production build;
- Gitleaks;
- Supabase security/RLS review;
- environment/secret review;
- CI workflow;
- documentation completeness.

A green result is required before the stage can be considered technically complete. This stage does not merge or advance the project to MASTER 06.
