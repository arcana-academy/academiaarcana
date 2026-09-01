# Domains

`src/domains` is the home for business-domain modules of the Academia Arcana modular monolith.

The official domains are defined centrally in `src/core/architecture/domains.ts` and their architectural policy in `src/core/architecture/domain-policy.ts`.

## Module boundary

A domain module may expose explicit domain/application contracts and use cases. It must not expose infrastructure details as part of its public contract.

The intended direction is:

```text
UI -> application -> domain -> ports <- infrastructure
```

Cross-domain collaboration should use explicit contracts, application services, ports or events when direct coupling would make ownership ambiguous. No domain is a universal owner of another domain's data.

## Official domains

- identity — stable identity and identity lifecycle
- context — action/resource context and visibility
- authorization — access decisions and policies
- learning — learning process and progress
- planning — study planning and productivity
- gamification — XP, levels, streaks, missions and rewards
- education — educational content and structure
- social — relationships, groups and social interaction
- adaptive — bounded adaptive personalization
- intelligence — authorized Master Arcane orchestration
- flonts — scoped Flonts runtime/product layer
- trust — trust, safety and governance mechanisms
- data — persistence and portability infrastructure

Do not create a new domain solely to organize files. A new domain requires an independently owned business responsibility and an explicit architectural decision.
