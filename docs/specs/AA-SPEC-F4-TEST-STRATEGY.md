# AA-SPEC-F4 — Estratégia, níveis e gates de teste

**Projeto:** Academia Arcana
**Série de origem:** issues F4.1 – F4.19
**Estado:** canônico para a série F4
**Autoridade superior:** `docs/architecture/AA-ARCHITECTURE-1.0.md`; execução real em `.github/workflows/quality.yml`

## 0. Inventário verificado no HEAD

| Nível | Ferramenta | Volume | Comando |
|---|---|---|---|
| Unitário/integração de módulo | Vitest (`jsdom`) | **285 arquivos** `*.test.ts(x)` em `src/` | `npm test` |
| Acessibilidade | Vitest + Testing Library | 8 suítes dedicadas | `npm run test:a11y` |
| Banco (RLS/privilégios/RPC) | pgTAP via Supabase CLI | **17 arquivos** em `supabase/tests/database/` | workflow `database-tests.yml` |
| End-to-end / visual | Playwright (chromium) | 18 specs + baselines JSON | `npm run test:e2e` |
| Contratos de infraestrutura | node:test / scripts | `scripts/verify-*.cjs`, `scripts/qa/`, `scripts/security/*.test.*` | `prebuild` + CI |
| Produção | smoke pós-deploy | `production-smoke.yml` | automático |

A série F4 é absorbida por esse inventário. Não há suíte "aspiracional": cada seção abaixo aponta o
mecanismo **existente**.

---

## F4.1 — Princípios e estratégia de testes

> Testar comportamento e risco, não apenas cobertura.

Pirâmide aplicada: unitário de domínio (maior volume) → integração de adapter/repositório → banco (pgTAP) →
E2E/visual (menor volume, determinístico). Nenhum teste depende de produção; banco destrutivo só em Supabase
local descartável. Teste que exige decisão humana é marcado `NO-GO` e não vira aprovação.
**Estado:** **CANÔNICO**.

## F4.2 — Critérios de aceitação

Formato: **dado / quando / então**, ligado a invariante (`INV-*` em `AA-SPEC-F2` §F2.7) e a requisito AA-PROD.
Critério sem teste correspondente é registrado como lacuna na matriz F4.17 — não é considerado "aceito".
**Estado:** **CANÔNICO**.

## F4.3 — Testes de domínio e invariantes

Invariantes INV-01…INV-10 têm verificação direta:
`src/core/architecture/{architecture,domain-policy,domain-communication,data-ownership,import-boundaries,foundation-structure}.test.ts`
mais `src/domains/*/{contracts,progression,progress,objective,p1,policies}.test.ts`.
**Estado:** **CANÔNICO**.

## F4.4 — Testes de Commands

Cada caso de uso tem teste de sucesso, entrada inválida e efeito colateral:
`src/application/planning/study-tasks.test.ts`, `focus-sessions.test.ts`,
`src/application/learning/workspace/service.test.ts` e `state.test.ts`,
`src/app/amigos/actions.test.ts`, `src/app/api/feedback/route.test.ts`.
**Estado:** **CANÔNICO**.

## F4.5 — Testes de Queries

Leitura é verificada por contrato de repositório (escopo de dono, ordenação, limite) e por testes de página
que não podem expor dado de outra conta. Ver `src/infrastructure/supabase/*/*.test.ts`.
**Estado:** **CANÔNICO**.

## F4.6 — Testes de Events

O catálogo é verificado estruturalmente (`domain-communication.test.ts`), não por entrega real — não há broker.
Teste de transporte é **LACUNA** (`GAP-F3-04`).
**Estado:** **PARCIAL**.

## F4.7 — Testes de Requests e Responses

Rotas cobrem: corpo inválido → 400, não autenticado → 401, excedido → 429 com `Retry-After` inteiro,
sucesso → 200/201 com `no-store`. Ver `src/lib/http/api-rate-limit-response.test.ts` e testes de rota.
**Estado:** **CANÔNICO**.

## F4.8 — Testes de erros

Erros nomeados de domínio, mensagem ao usuário sem detalhe interno e ausência de vazamento em resposta
(`FeedbackAuthenticationError`, `PERSISTENCE_FAILED`, `policy-denied`).
**Estado:** **CANÔNICO**.

## F4.9 — Testes de autorização

Três camadas testadas: contrato (`policy-denied` padrão), RLS em banco
(`authorization_rls_p0.test.sql`, `friend_request_insert_rls.test.sql`,
`educational_core_p1_rls.test.sql`, `grimoire_covers_storage_rls.test.sql`, `focus_social_privileges.test.sql`)
e borda HTTP (307 antes do shell, PR #808).
**Estado:** **CANÔNICO**.

## F4.10 — Testes de idempotência e concorrência

`gamification_atomic.test.sql` (uma concessão por tarefa), `move_workspace_page_test.sql` (posição única),
`educational_core_p1_atomic_attempt.sql` + teste de privilégios, `api_rate_limit.test.sql`.
**Estado:** **CANÔNICO**.

## F4.11 — Testes assíncronos · issues #139 e #140 (duplicata)

Não há runtime assíncrono implementado. Testes de fila/worker/retry são **impossíveis** e não são simulados.
`GAP-F3-13`. **Estado:** **LACUNA** — a duplicata #140 é encerrada apontando para #139, e #139 permanece
aberta como rastreamento até existir transporte real.

## F4.12 — Testes de webhooks e integrações

Integrações cobertas: `tests/e2e/{asana,github,tarot,integration-hub}-integration.spec.ts`;
regressões de contrato em `cp04`, `cp05`, `cp06`, `cp11` workflows; isolamento de credenciais em
`integration_credentials_security.test.sql` e `external_document_sources_privileges.test.sql`.
Webhook **de evento** (entrada) não existe → sem teste. **Estado:** **PARCIAL**.

## F4.13 — Testes de IA

- Guardas de provedor: `src/core/architecture/provider-policy.ts` + testes.
- Limite de consumo: `open_source_ai_rate_limits.test.sql`, `api_rate_limit.test.sql`.
- Ausência de segredo no bundle: `scripts/verify-public-runtime-config.mjs`.
- Autoridade assistiva (IA não decide acesso) é invariante arquitetural testada.
Não existe avaliação de qualidade de resposta por benchmark — **LACUNA** (`GAP-F4-13`).
**Estado:** **PARCIAL**.

## F4.14 — Testes de privacidade e segurança · issues #143 e #144 (duplicata)

- Varredura de segredos: `gitleaks.yml` + `.gitleaks.toml`.
- Isolamento de build: `build-secret-isolation-contract-536.yml` + `scripts/security/probe-build-runtime-boundary-536.mjs`.
- Intercontas: testes pgTAP negativos de RLS.
- Proteção de senha vazada: pendência externa do Security Advisor (#31).
**Estado:** **PARCIAL** (tudo que é local está coberto; dependências externas rastreadas).

## F4.15 — Testes de UI e acessibilidade · issues #145 e #146 (duplicata)

`npm run test:a11y` cobre button, card, icon-button, `/pratica`, Workspace, WorkspaceTree,
StudyTaskBoard e StatisticsView; `tests/e2e/design-system-a11y.spec.ts` e `design-system-visual.spec.ts`
cobrem o design system; baselines visuais por rota em `tests/e2e/*baselines.json`.
WCAG 2.2 AA é critério de aceitação, não sugestão. **Estado:** **CANÔNICO**.

## F4.16 — Testes de regressão

Regressões nomeadas vivem em workflows dedicados: `friend-request-authorization-regression.yml`,
`cp04/05/06/11`, `fallback-*-536.yml`, `c96-browser-contrast.yml`, `anti-dark-pattern.yml`.
Bug corrigido sem teste de regressão não é considerado corrigido.
**Estado:** **CANÔNICO**.

## F4.17 — Matriz requisito → teste

Requisitos AA-PROD mapeados para suíte:

| Requisito | Teste |
|---|---|
| AA-PROD-R018 contexto mínimo/autorizado | `authorization_rls_p0.test.sql`, `src/core/context/*.test.ts` |
| AA-PROD-R019 estados de ausência/erro | `src/app/error.test.tsx`, `global-error.test.tsx`, `not-found` |
| Core educacional P1 | `educational_core_p1_*.test.sql`, `src/domains/education/*.test.ts` |
| Evidência objetiva P1.5 | `educational_objective_evidence_p15_*.test.sql`, `learning/objective-evidence.test.ts` |
| Gamificação atômica | `gamification_atomic.test.sql` |
| Workspace/grimórios | `tests/e2e/grimoires-workspace.spec.ts`, `learning/workspace.test.ts` |
| Acessibilidade | `npm run test:a11y` |
| Segurança de build | `build-secret-isolation-contract-536.yml` |
| Integrações | `tests/e2e/*-integration.spec.ts` |

Requisitos sem teste: notificações, analytics persistente, gestão institucional (dependem de decisão).
**Estado:** **CANÔNICO** para o que existe.

## F4.18 — Quality Gates de teste

`quality.yml` executa, em ordem e fail-closed: verificação de supply-chain → allowlist de lifecycle →
verificação de runtime → `npm ci --ignore-scripts` → `npm audit --omit=dev --audit-level=high` →
guarda de infraestrutura → lint → typecheck → unit → a11y → build → Playwright → config pública → imagem.
O gate é **obrigatório** para não-admins no `main`. Nenhum "PASS" é alegado sem log.
**Estado:** **CANÔNICO**.

## F4.19 — Matriz final de cobertura

| Área | Unit | Banco | E2E | Lacuna |
|---|---|---|---|---|
| identity/auth | ✅ | ✅ | ✅ | — |
| authorization/RLS | ✅ | ✅ | ✅ | — |
| learning/workspace | ✅ | ✅ | ✅ | — |
| planning/foco | ✅ | ✅ | ✅ | — |
| gamification | ✅ | ✅ | ✅ | — |
| education P1/P1.5 | ✅ | ✅ | ✅ | — |
| social | ✅ | ✅ | parcial | UI social além de amizades |
| trust/feedback | ✅ | ✅ | parcial | retenção (#588) |
| intelligence/IA | ✅ | ✅ | parcial | avaliação de qualidade |
| integrations | ✅ | ✅ | ✅ | webhook de entrada |
| observabilidade | — | — | smoke | `GAP-F6-12` |
| notificações/analytics | — | — | — | `GAP-F1-09/10` |

**Estado:** **CANÔNICO** como matriz; lacunas explicitamente não cobertas.
