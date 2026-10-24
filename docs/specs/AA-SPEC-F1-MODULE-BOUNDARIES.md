# AA-SPEC-F1 — Fronteiras de módulo, contratos e configuração

**Projeto:** Academia Arcana
**Série de origem:** issues F1.1 – F1.26 (abertas em 2026-09-09)
**Estado deste documento:** canônico para a série F1
**Autoridade superior:** `docs/architecture/AA-ARCHITECTURE-1.0.md` e `docs/product/AA-PRODUCT-1.0.md`

## 0. Regra de transposição

A série F1 foi originalmente redigida sobre um enquadramento genérico chamado **"Support Arcana"**
(`identity`, `customers`, `conversations`, `tickets`, `knowledge`, `documents`, `ai`, `notifications`,
`analytics`, `audit`, `settings`). A Academia Arcana **não** adota essa nomenclatura: os módulos canônicos
são os de `src/core/architecture/domains.ts` (`CORE_DOMAINS`):

```
identity · context · authorization · learning · planning · gamification · education ·
social · adaptive · intelligence · flonts · trust · data · sanctuary
```

Cada requisito da série F1 é, portanto, **transposto** para o domínio canônico equivalente, e onde não há
equivalente o fato é registrado como lacuna explícita em `docs/specs/AA-SPEC-GAP-REGISTER.md`.
Nenhuma capacidade é declarada existente por existir uma rota ou uma pasta — a regra AA-PROD-002 do
produto continua valendo.

Legenda de estado usada nas seções: **CANÔNICO** (decisão registrada e aplicada no código),
**PARCIAL** (existe contrato mas falta implementação/adapter), **LACUNA** (não existe; rastreado no
registro de lacunas).

---

## F1.1 — `identity` · issue #77

- **Responsabilidade transposta:** identidade estável do sujeito e seu ciclo de vida, sem decisão de acesso.
- **Fonte de verdade no repositório:** `src/core/architecture/domain-policy.ts`, entrada `identity`
  (`owns: subject identity, identity status, authentication integration boundary`;
  `excludes: authorization, full profile, context membership, UI preferences, gamification`).
- **Módulos correlatos:** `src/core/identity/` (core transversal) e `src/application/identity/`.
- **Integração de autenticação:** `src/infrastructure/supabase/` (adapter) e `src/proxy.ts` (gate de sessão).
- **Regra mantida:** `identity` **não** decide autorização; quem decide é `authorization`
  (`src/core/authorization/contracts.ts`). Sem `AuthorizationPolicy`, `evaluateAuthorization` retorna
  `policy-denied` (comportamento negado por padrão).
- **Evento:** `identity lifecycle change` (`DOMAIN_POLICIES.identity.events`).
- **Estado:** **CANÔNICO**.

## F1.2 — `authorization` · issue #78

- **Responsabilidade transposta:** decidir se um ator pode executar uma ação sobre um recurso em um contexto.
- **Evidência:** `DOMAIN_POLICIES.authorization` — entidades `AccessRequest` e `AccessDecision`;
  dependências permitidas apenas `identity` e `context`.
- **Implementação:** `src/core/authorization/contracts.ts`; testes de autorização em `src/core/authorization/`.
- **Fronteira negativa:** proibido `React`, `Next.js UI`, `Supabase client`, `component state` — verificado por
  `src/core/architecture/import-boundaries.test.ts`.
- **Estado:** **CANÔNICO**.

## F1.3 — `customers` · issue #79

- **Transposição:** não existe módulo de "clientes". O equivalente semântico é **`context`** (membership e
  semântica de visibilidade de um recurso) apoiado por `trust` (consentimento, auditoria, governança).
- **Evidência:** `DOMAIN_POLICIES.context` — `owns: context identity, membership context, visibility semantics`;
  `excludes: authorization decisions, authentication, UI rendering`.
- **Nota de produto:** AA-PROD-002 registra que gestão institucional/cliente não está comprovada por rota;
  cadastro institucional depende de DEP-C17-01/02 (`docs/architecture/AA-ARCH-C18-DECISION-REGISTER.md`).
- **Estado:** **PARCIAL** — domínio `context` canônico; entidade de "customer" inexistente por decisão de produto.

## F1.4 — `conversations` · issue #80

- **Transposição:** conversa como interação assistida pertence a **`intelligence`** (Mestre Arcano e operações
  de IA) com `context` fornecendo o contexto autorizado. Conversa social pertence a `social`.
- **Evidência:** `src/domains/intelligence/`, `src/infrastructure/openai/`, `src/infrastructure/intelligence/`,
  `src/application/intelligence/`.
- **Fronteira:** conteúdo de conversa **não** é fonte de verdade de conhecimento; fontes oficiais são `education`.
- **Estado:** **PARCIAL** — orquestração existe; persistência de histórico de conversa não é canônica.

## F1.5 — `tickets` · issue #81

- **Transposição:** não existe "ticket" de atendimento. O análogo mais próximo é o **feedback do usuário**
  (`public.feedback_responses`, proprietário `trust`) e o ciclo de suporte documentado em
  `docs/deployment/feedback-fk-remediation-536.md`.
- **Rastreamento de política:** retenção e exclusão de feedback são a decisão aberta #588/#530.
- **Estado:** **PARCIAL** — entidade de feedback existe; fluxo de ticket/atendimento não é capacidade do produto.

## F1.6 — `knowledge` · issue #82

- **Transposição:** base de conhecimento = **`education`** (conteúdo e estruturas educacionais) com `learning`
  consumindo por contrato. Artigos/versões não existem como entidade própria.
- **Evidência:** `DOMAIN_POLICIES.education` (`owns: educational content and structures`, evento
  `content published` / `content updated`); migrações `20261002010057_educational_core_p1.sql` e
  `20261002190600_p1_5_objective_evidence_v1.sql`.
- **Estado:** **CANÔNICO** para conteúdo; versionamento editorial de artigo é **LACUNA**.

## F1.7 — `documents` · issue #83

- **Transposição:** documentos externos são **adapters de infraestrutura**, não domínio:
  `public.external_document_sources` é owned por `infrastructure` em
  `src/core/architecture/data-ownership.ts`; migrações `20260929172005_create_external_document_sources.sql`
  e `20260929220739_revoke_excess_external_document_source_privileges.sql`.
- **Portabilidade:** eventos `persistence operation completed` / `portability operation completed` no domínio `data`.
- **Estado:** **PARCIAL** — ingestão externa registrada; processamento/extração documental não implementado.

## F1.8 — `ai` · issue #84

- **Transposição:** **`intelligence`** (operações de IA) + **`adaptive`** (recomendação e adaptação).
- **Evidência:** `DOMAIN_POLICIES.intelligence` (`intelligence request completed`, `suggestion produced`);
  `DOMAIN_POLICIES.adaptive` (`recommendation generated`, `adaptation applied`);
  adapters em `src/infrastructure/openai/`, `src/infrastructure/exa/`, `src/infrastructure/parallel/`,
  `src/infrastructure/web-research/`.
- **Limite de autoridade:** IA é assistiva; não substitui autenticação, autorização nem `education` como fonte.
  Ver `docs/architecture/AA-ARCHITECTURE-1.0.md` §13 (AI safety and authority).
- **Controle de consumo:** limite de requisições durável (`20261024180000_durable_open_source_ai_rate_limit.sql`,
  `20261024181000_api_rate_limit.sql`) e `src/lib/security/` — evidência do PR #818.
- **Estado:** **CANÔNICO**.

## F1.9 — `notifications` · issue #85

- **Transposição:** **não existe** domínio de notificações na Academia Arcana. Não há tabela, fila ou worker.
- **Decisão:** não criar infraestrutura de notificação sem requisito de produto aprovado (AA-PROD-002).
- **Estado:** **LACUNA** — registrada como `GAP-F1-09` no registro de lacunas.

## F1.10 — `analytics` · issue #86

- **Transposição:** não existe domínio de analytics. A superfície `/estatisticas` é **leitura derivada** de
  `learning`, `planning` e `gamification`, exibida por `src/app/estatisticas/`.
- **Regra:** domínio proprietário permanece dono do estado; agregação não cria autoridade.
- **Estado:** **PARCIAL** — leitura derivada existe; persistência analítica é `GAP-F1-10`.

## F1.11 — `audit` · issue #87

- **Transposição:** **`trust`** governa consentimento, auditoria e sinais de confiança
  (`DOMAIN_POLICIES.trust`, eventos `consent recorded`, `governance event recorded`, `trust signal changed`).
- **Complemento:** `authorization` emite `access decision recorded when audit is required`.
- **Estado:** **PARCIAL** — eventos declarados e contrato de decisão negado por padrão; trilha de auditoria
  persistente é `GAP-F1-11`.

## F1.12 — `settings` · issue #88

- **Transposição:** configuração **não** é domínio. Divide-se em:
  1. configuração de build/runtime → `src/config/`, `src/lib/`, `scripts/verify-public-runtime-config.mjs`;
  2. preferências de acessibilidade do usuário → `src/core/accessibility-preferences/` e
     `src/application/accessibility-preferences/`;
  3. navegação → `src/config/navigation.ts`.
- **Estado:** **CANÔNICO** para as três superfícies acima; "settings service" genérico é **LACUNA** intencional.

## F1.13 — Matriz de dependências entre módulos · issue #89

Fonte única: `DOMAIN_DEPENDENCY_MATRIX` em `src/core/architecture/domain-policy.ts`, derivada de
`allowedDependencies` de cada `DomainPolicy`, e consumida por
`src/core/architecture/domain-communication.ts` (`allowedTargets`).

Regra aplicada: dependência só por contrato público; `prohibitedDependencies` são verificadas por
`src/core/architecture/import-boundaries.test.ts` (React, Next.js UI, Supabase client e similares).
Ciclos são proibidos por `src/core/architecture/architecture.test.ts`.
**Estado:** **CANÔNICO**.

## F1.14 — Contratos entre módulos · issue #90

- Barrels públicos em `src/domains/*/index.ts` são a única superfície exportada.
- `DOMAIN_COMMUNICATION_KINDS = query | command | event`, com `directKinds` fixo em `query`/`command`.
- Verificação: `src/core/architecture/domain-communication.test.ts`.
- **Estado:** **CANÔNICO**.

## F1.15 — Matriz de eventos entre módulos · issue #91

Eventos canônicos (produtor → evento), extraídos de `DOMAIN_POLICIES`:

| Produtor | Eventos |
|---|---|
| `identity` | identity lifecycle change |
| `context` | context changed · sharing state changed |
| `authorization` | access decision recorded when audit is required |
| `learning` | progress recorded · learning session completed |
| `planning` | task completed · plan changed · focus session completed |
| `gamification` | XP awarded · achievement unlocked · mission completed · streak changed |
| `education` | content published · content updated |
| `social` | invitation sent · relationship changed · social share created |
| `adaptive` | recommendation generated · adaptation applied |
| `intelligence` | intelligence request completed · suggestion produced |
| `flonts` | Flonts state changed · Flonts interaction executed |
| `trust` | consent recorded · governance event recorded · trust signal changed |
| `data` | persistence operation completed · portability operation completed |
| `sanctuary` | continue learning resolved · sanctuary snapshot refreshed |

**Estado:** **CANÔNICO** como catálogo declarado; barramento de eventos é `GAP-F1-15`.

## F1.16 — Contrato e ciclo de vida dos eventos · issue #92 (duplicata: #93)

Ciclo declarado: `produzido → publicado → entregue → consumido → (falha) → reprocessado|descartado`.
Contrato mínimo: nome estável, agregado de origem, identidade do ator, contexto, ocorrido-em, versão e
idempotency key. Nenhum consumidor muta o estado de origem.
**Estado:** **CANÔNICO** como contrato documentado; entrega real é `GAP-F1-16` (sem broker).

## F1.17 — Matriz de propriedade dos dados e recursos · issue #94

Fonte única: `DATA_OWNERSHIP_POLICY` (`src/core/architecture/data-ownership.ts`), **16 recursos** registrados:

| Recurso | Tipo | Owner | Supporting |
|---|---|---|---|
| public.grimoires | table | learning | — |
| public.notebooks | table | learning | — |
| public.chapters | table | learning | — |
| public.pages | table | learning | — |
| public.page_progress | table | learning | — |
| public.study_tasks | table | planning | learning |
| public.gamification_profiles | table | gamification | — |
| public.missions | table | gamification | — |
| public.focus_sessions | table | planning | — |
| public.friend_connections | table | social | — |
| public.feedback_responses | table | trust | — |
| public.integration_credentials | table | infrastructure | — |
| public.external_document_sources | table | infrastructure | — |
| public.complete_study_task_with_reward | database-rpc | cross-domain | — |
| public.move_workspace_page | database-rpc | learning | — |
| storage.grimoire-covers | storage-bucket | learning | — |

Verificação: `src/core/architecture/data-ownership.test.ts`.
**Estado:** **CANÔNICO**.

## F1.18 — Matriz de leitura, escrita e mutação por módulo · issue #95 (duplicata: #96)

Regra: leitura não concede mutação; o proprietário é a autoridade de mutação.

| Domínio | Leitura | Criação | Mutação | Exclusão |
|---|---|---|---|---|
| `identity` | própria identidade | ✅ | ✅ | controlada (`trust`) |
| `context` | contextos autorizados | ✅ | ✅ | controlada |
| `authorization` | identidade + contexto | ✅ | ✅ | política/auditoria |
| `learning` | progresso próprio | ✅ | ✅ | controlada |
| `planning` | tarefas/foco próprios | ✅ | ✅ | controlada |
| `gamification` | estado próprio | derivado | derivado | não |
| `education` | conteúdo autorizado | ✅ | ✅ | publicação/retirada |
| `social` | conexões autorizadas | ✅ | ✅ | ✅ controlada |
| `adaptive` | sinais autorizados | derivado | derivado | não |
| `intelligence` | contexto autorizado | ✅ | ✅ | controlada |
| `flonts` | estado próprio | ✅ | ✅ | controlada |
| `trust` | consentimento/auditoria | ✅ | ✅ | retenção específica |
| `data` | operações de persistência | ✅ | ✅ | política de retenção |
| `sanctuary` | visão derivada | derivado | não | não |

**Estado:** **CANÔNICO** (contratos); enforcement real é por RLS + guards de servidor (`src/lib/security/`).

## F1.19 — Matriz de comandos, consultas e eventos por módulo · issue #97

Derivada de `DomainPolicy.useCases` + `events`:

| Domínio | Comandos/casos de uso | Eventos |
|---|---|---|
| `identity` | resolve identity · change identity lifecycle state | identity lifecycle change |
| `context` | resolve active context · resolve resource visibility | context/sharing changed |
| `authorization` | evaluate access · enforce policy | access decision recorded |
| `learning` | record progress · start learning session · record review | progress recorded |
| `planning` | (ver `src/application/planning/`) | task/plan/focus events |
| `gamification` | (ver `src/application/gamification/`) | XP/achievement/mission/streak |
| `education` | (ver `src/application/education/`) | content published/updated |
| `social` | (ver `src/application/social/`) | invitation/relationship/share |
| `intelligence` | (ver `src/application/intelligence/`) | request completed · suggestion produced |
| `sanctuary` | continue learning | continue learning resolved |

Queries são síncronas e sem efeito de estado de negócio; commands emitem eventos apenas após validação.
**Estado:** **PARCIAL** — inventário completo por caso de uso em `AA-SPEC-F5` seção F5.2.

## F1.20 — Fronteiras e prevenção de dependências circulares · issue #98

- Superfície pública mínima: `src/domains/<dominio>/index.ts`.
- Testes: `foundation-structure.test.ts`, `architecture.test.ts`, `import-boundaries.test.ts`,
  `domain-communication.test.ts`, todos em `src/core/architecture/`.
- Guarda adicional: `scripts/verify-canonical-infrastructure.cjs` no `prebuild`.
**Estado:** **CANÔNICO**.

## F1.21 — Isolamento Domínio / Aplicação / Infraestrutura · issue #99

- Domínio: `src/domains/*` (sem React/Next/Supabase client).
- Aplicação: `src/application/*` (orquestração; 39 arquivos TS).
- Infraestrutura: `src/infrastructure/*` (supabase, openai, exa, parallel, integrations, web-research, social,
  trust, sanctuary, intelligence, data) e `src/infrastructure/runtime-secrets.ts`.
- Ports: contratos declarados pelos domínios e consumidos pela aplicação.
- UI: `src/app/*` (App Router).
**Estado:** **CANÔNICO**, verificado por `import-boundaries.test.ts`.

## F1.22 — Contratos de dependências externas e Adapters · issue #100

| Capacidade | Port/contrato | Adapter | Política |
|---|---|---|---|
| Persistência | repositórios de domínio | `src/infrastructure/supabase/` | `src/core/architecture/provider-policy.ts` |
| IA | operação de inteligência | `src/infrastructure/openai/` | allowlist em `provider-policy.ts` |
| Busca web | pesquisa | `src/infrastructure/exa/`, `src/infrastructure/parallel/`, `src/infrastructure/web-research/` | idem |
| Integrações | hub de integrações | `src/infrastructure/integrations/` | `docs/engineering/project-integrations.md` |
| Segredos | `runtime-secrets.ts` | `/etc/secrets/<KEY>` → env (fallback) | `docs/deployment/build-secret-isolation-536.md` |

**Estado:** **CANÔNICO**.

## F1.23 — Configuração, Secrets e Variáveis de Ambiente · issue #101

- Contrato público: `.env.example` (único arquivo de ambiente versionado; `.gitignore` bloqueia `.env*`).
- Verificação: `scripts/verify-public-runtime-config.mjs` (roda no `prebuild`).
- Segredos de runtime: `src/infrastructure/runtime-secrets.ts` — prefere `/etc/secrets/<KEY>`;
  fallback de ambiente mantido apenas para migração/local/teste (PR #539).
- Regra de build: `scripts/security/assert-build-secret-isolation-536.cjs` no `prebuild` (issue #536).
**Estado:** **CANÔNICO** (repositório); isolamento no provedor é a pendência externa de #536.

## F1.24 — Ciclo de vida e versionamento das configurações · issue #102

Ciclo: `draft → validated → approved → active → updated → superseded → retired`.
Aplicação no repositório: configuração é versionada em Git; mudança entra por PR com revisão de CODEOWNERS
(`/.github/`, `/render.yaml`, `/package.json`, `/package-lock.json`, scripts de supply-chain); reversão é
`git revert`; aposentadoria remove a variável de `.env.example` e do verificador correspondente.
**Estado:** **CANÔNICO**.

## F1.25 — Matriz de classificação das configurações · issue #103

| Classe | Exemplos no repositório | Controle mínimo |
|---|---|---|
| Pública | `NEXT_PUBLIC_*` (Supabase URL/publishable key), tema, idioma | validação de formato + contrato de build |
| Operacional | limites de rate limit, flags de rota, `navigation.ts` | revisão de PR + testes |
| Sensível | chaves OpenAI/Exa/Parallel, OAuth secrets, `SUPABASE_SERVICE_ROLE_KEY` | Secret Files `/etc/secrets`, nunca `NEXT_PUBLIC_`, nunca em log |
| Crítica de build | `NPM_CONFIG_IGNORE_SCRIPTS`, guardas de `prebuild` | guard verificado em CI (`build-secret-isolation-contract-536.yml`) |

Nenhum valor sensível é registrado no repositório; a classificação é aplicada por prefixo e por verificador.
**Estado:** **CANÔNICO**.

## F1.26 — Escopo das configurações · issue #104

Escopos: `sistema → ambiente → módulo → usuário → operação`.
Aplicação: sistema/ambiente por variáveis de ambiente e `render.yaml`; módulo por contratos em
`src/application/*/`; usuário por `src/core/accessibility-preferences/`; operação por parâmetros de caso de uso.
Uma configuração de escopo menor nunca sobrescreve silenciosamente um escopo maior.
**Estado:** **CANÔNICO**.

---

## Verificação

- `npm run typecheck` e `npm run lint` verdes no HEAD desta entrega.
- `src/core/architecture/*.test.ts` cobrem as afirmações estruturais acima.
- Lacunas desta série: `GAP-F1-09`, `GAP-F1-10`, `GAP-F1-11`, `GAP-F1-15`, `GAP-F1-16`
  em `docs/specs/AA-SPEC-GAP-REGISTER.md`.
