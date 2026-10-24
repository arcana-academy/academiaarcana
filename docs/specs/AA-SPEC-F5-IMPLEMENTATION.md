# AA-SPEC-F5 — Implementação, ordem, rollout e rastreabilidade

**Projeto:** Academia Arcana
**Série de origem:** issues F5.1 – F5.17
**Estado:** canônico para a série F5
**Autoridade superior:** `docs/architecture/AA-ARCHITECTURE-1.0.md` §9–§10, §17

## 0. Unidades de implementação realmente existentes

`src/application/` (orquestração, 21 arquivos de produção):

```
identity/IdentityResolver.ts            identity/contracts.ts
learning/workspace/service.ts           learning/workspace/state.ts
planning/study-tasks.ts                 planning/focus-sessions.ts
gamification/complete-study-task.ts
education/{p1,block-sequencing,cloze-practice,concept-comparison,review-queue,study-itinerary}.ts
intelligence/execute-mestre-arcano.ts
sanctuary/{get-sanctuary,sanctuary-projection-port,sanctuary-repository,sanctuary-view-model}.ts
security/api-rate-limit.ts
teaching/list-classrooms-draft.ts       accessibility-preferences/hooks/hooks.ts
```

`src/domains/` (regras e contratos, 14 domínios), `src/infrastructure/` (adapters),
`src/app/` (App Router). Tudo o que não está nessa lista **não** está implementado, mesmo que exista rota.

---

## F5.1 — Princípios e estratégia de implementação

1. Domínio antes de infraestrutura; contrato antes de adapter.
2. Nada de implementação especulativa: diretórios placeholder permanecem vazios por decisão
   (`src/application/social/README.md` e `src/infrastructure/social/README.md` documentam isso).
3. Cada unidade entra com teste no mesmo PR.
4. Feature só é "entregue" com Quality Gate verde em log real.
5. Recurso com dado pessoal exige owner em `DATA_OWNERSHIP_POLICY` e política de retenção.
**Estado:** **CANÔNICO**.

## F5.2 — Decomposição em unidades de implementação

| Unidade | Camada | Contratos | Testes |
|---|---|---|---|
| Resolução de identidade | application + core | `IdentityResolver` | `src/core/identity/*.test.ts` |
| Workspace (grimório→página) | application + domain + infra | `learning/workspace` | service/state/workspace + E2E |
| Planejamento e foco | application + domain + infra | `planning/*` | study-tasks/focus-sessions |
| Gamificação atômica | application + RPC | `complete-study-task` | `gamification_atomic.test.sql` |
| Núcleo educacional P1/P1.5 | domain + RPC | `education/*` | 6 suítes + pgTAP |
| Mestre Arcano (IA) | application + infra | `execute-mestre-arcano` | provider policy + rate limit |
| Santuário (projeção) | application + domain | `get-sanctuary` | 13 testes + E2E |
| Amizades | app actions + infra social | `social/contracts.ts` | actions + RLS pgTAP |
| Feedback (trust) | API + infra | `trust/contracts.ts` | rota + pgTAP |
| Integrações externas | infra + API | `integrations/*` | 34 arquivos + E2E |
| Acessibilidade/UI | core + app | `accessibility-preferences` | 10 arquivos + a11y |

**Estado:** **CANÔNICO**.

## F5.3 — Ordem e dependências de implementação

```
core (identity, context, authorization)
   ↓
domains (education, learning, planning, gamification, social, trust, adaptive, intelligence, flonts, sanctuary, data)
   ↓
application (casos de uso)
   ↓
infrastructure (adapters supabase/openai/exa/...)
   ↓
app (rotas e telas) → gates (testes, build, smoke)
```

Regra: nenhuma seta sobe. `import-boundaries.test.ts` e `architecture.test.ts` falham em caso de inversão
ou ciclo. **Estado:** **CANÔNICO**.

## F5.4 — Implementação por módulo

Cada módulo entrega, no mínimo: `contracts.ts` + `index.ts` + testes + entrada em `DOMAIN_POLICIES`.
Módulos com implementação completa: identity, context, authorization, education, learning, planning,
gamification, social, trust, adaptive, intelligence, sanctuary.
Módulo com contrato e projeção parcial: `data`, `flonts`.
**Estado:** **PARCIAL** — `data`/`flonts` sem caso de uso dedicado.

## F5.5 — Implementação do domínio

Regras puras, sem I/O, sem framework; validado por
`prohibitedDependencies` e pela proibição de importar `@supabase/*` em `src/domains`.
Cálculos sensíveis normalizam entrada (`progression.ts`), mensagens de domínio são canônicas
(`objective.ts`). **Estado:** **CANÔNICO**.

## F5.6 — Implementação dos casos de uso

Cada caso de uso recebe entrada já validada, resolve identidade/contexto, delega autorização, chama o domínio
e devolve resultado tipado. Efeitos externos só via port. Exemplos ver §0.
**Estado:** **CANÔNICO**.

## F5.7 — Implementação dos contratos

Tipos em `contracts.ts`, superfície mínima em `index.ts`, sem export de internals.
Teste de contrato por domínio (`*.contracts.test.ts`) — 12 suítes. **Estado:** **CANÔNICO**.

## F5.8 — Implementação da persistência

- Migrações versionadas em `supabase/migrations/` (22 arquivos), aplicadas em ordem.
- RLS habilitado nas tabelas de domínio; privilégios reduzidos por migração dedicada
  (`revoke_*` explícitos).
- RPCs atômicos para operações compostas.
- Nenhum acesso direto do domínio ao banco.
**Estado:** **CANÔNICO**.

## F5.9 — Implementação de eventos

Eventos são nomes de domínio e contrato (envelope em `AA-SPEC-F3` §F3.4). Não há publicação real.
Efeitos derivados hoje são **síncronos e explícitos** (ex.: conclusão de tarefa → RPC de recompensa).
**Estado:** **LACUNA** para transporte (`GAP-F3-04`).

## F5.10 — Implementação assíncrona

Não existe. Nenhuma fila, worker, cron ou broker. Jobs de CI não contam como runtime assíncrono.
**Estado:** **LACUNA** (`GAP-F3-13`).

## F5.11 — Implementação de integrações e adapters

`src/infrastructure/{asana-equivalentes via integrations, openai, exa, parallel, web-research}`;
credenciais isoladas (`integration_credentials`, `external_document_sources`, RLS + revoke);
OAuth `connect/callback/status/disconnect` por provedor; allowlist em `provider-policy.ts`.
**Estado:** **CANÔNICO**.

## F5.12 — Implementação de segurança

CSP com nonce (`src/lib/security/csp.ts`), rotas privadas antes do shell, rate limit durável,
segredos por `/etc/secrets` com fallback controlado, guardas de build (`assert-build-secret-isolation-536.cjs`),
gitleaks, codeql, dependency review, scorecard, pinagem de actions por SHA.
**Estado:** **CANÔNICO** no repositório; pendências de provedor em #536/#534/#537.

## F5.13 — Implementação de observabilidade

Existe: `/api/health` (com revision), `/api/ready` (prontidão com Supabase), smoke de produção,
Honeybadger (browser/server/edge) e workflow de smoke por deploy.
Não existe: métricas de negócio, tracing distribuído, dashboards, alertas com SLO.
**Estado:** **PARCIAL** (`GAP-F6-12`).

## F5.15 — Estratégia de rollout e rollback · issues #167 e #168 (duplicata)

- Rollout: `main` protegido → PR → Quality Gate obrigatório → Render `autoDeployTrigger: checksPass` →
  Production Smoke; promoção de imagem em `image-release.yml` exige SHA aprovado e main atual.
- Rollback: `git revert` + redeploy do commit anterior; imagem GHCR retida com digest; migração nova é
  sempre aditiva quando há dado em produção (reversão por migração compensatória).
- Nenhum deploy de produção é feito por agente sem autorização humana explícita.
**Estado:** **CANÔNICO** para o fluxo; execução de produção é humana.

## F5.16 — Rastreabilidade requisito → implementação

Cadeia obrigatória: requisito (`docs/product/AA-PRODUCT-REQUIREMENTS-1.0.md`) → critério → contrato
(`src/domains/*/contracts.ts`) → caso de uso (`src/application/*`) → teste → evidência CI.
Tabela consolidada em `AA-SPEC-F4` §F4.17 e em `docs/superpowers/reports/f6-20-requirement-infrastructure-matrix.md`.
Requisito sem elo é lacuna, não "feito". **Estado:** **CANÔNICO**.

## F5.17 — Matriz final de implementação

| Domínio | Contrato | Caso de uso | Adapter | DB | Teste | Estado |
|---|---|---|---|---|---|---|
| identity | ✅ | ✅ | ✅ | ✅ | ✅ | implementado |
| context | ✅ | parcial | ✅ | ✅ | ✅ | parcial |
| authorization | ✅ | ✅ | ✅ | ✅ | ✅ | implementado |
| learning | ✅ | ✅ | ✅ | ✅ | ✅ | implementado |
| planning | ✅ | ✅ | ✅ | ✅ | ✅ | implementado |
| gamification | ✅ | ✅ | ✅ | ✅ | ✅ | implementado |
| education | ✅ | ✅ | ✅ | ✅ | ✅ | implementado |
| social | ✅ | parcial | ✅ | ✅ | ✅ | parcial |
| trust | ✅ | parcial | ✅ | ✅ | ✅ | parcial |
| adaptive | ✅ | parcial | — | — | ✅ | contrato + regra |
| intelligence | ✅ | ✅ | ✅ | parcial | ✅ | parcial |
| flonts | ✅ | — | — | — | ✅ | contrato |
| sanctuary | ✅ | ✅ | ✅ | leitura | ✅ | implementado |
| data | ✅ | — | ✅ | ✅ | ✅ | contrato |

**Estado:** **CANÔNICO**.
