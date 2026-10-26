# AA-SPEC-F3 — Contratos: commands, queries, eventos, erros e compatibilidade

**Projeto:** Academia Arcana
**Série de origem:** issues F3.1 – F3.16
**Estado:** canônico para a série F3
**Autoridade superior:** `docs/architecture/AA-ARCHITECTURE-1.0.md` §6–§7

## 0. Regra de transposição

A série F3 foi escrita para o enquadramento "Support Arcana". Os contratos aqui descritos são os
**efetivamente implementados** na Academia Arcana; onde o texto original pressupõe capacidade inexistente
(webhooks de entrada, mensageria assíncrona, notificações) o fato é registrado como lacuna e o contrato **não**
é declarado existente.

---

## F3.1 — Princípios e arquitetura dos contratos

1. Contrato público é o único ponto de entrada de um domínio: `src/domains/<dominio>/index.ts` e
   `src/domains/<dominio>/contracts.ts`.
2. Domínio não conhece UI, framework nem cliente de banco (`prohibitedDependencies` em
   `src/core/architecture/domain-policy.ts`).
3. Comunicação entre domínios é `query | command | event`
   (`DOMAIN_COMMUNICATION_KINDS`, `src/core/architecture/domain-communication.ts`).
4. Contrato é tipado em TypeScript estrito; nada de `any` para atravessar fronteira.
5. Estado interno nunca é exportado por referência mutável.
6. Todo contrato tem teste correspondente (`*.contracts.test.ts`).

**Estado:** **CANÔNICO**.

---

## F3.2 — Commands (intenção e alteração de estado)

Forma canônica de comando: **caso de uso explícito** em `src/application/<dominio>/`, recebendo entrada
validada e devolvendo resultado tipado ou erro de contrato.

Exemplos implementados:

| Domínio | Comando | Arquivo |
|---|---|---|
| `learning` | registrar progresso | `src/application/learning/` |
| `planning` | concluir tarefa com recompensa | RPC `complete_study_task_with_reward` + `src/application/planning/` |
| `social` | solicitar/responder amizade | `src/app/amigos/actions.ts` + `src/infrastructure/supabase/social/social-repository.ts` |
| `trust` | criar feedback | `src/app/api/feedback/route.ts` → `createFeedback` (`src/infrastructure/supabase/feedback-repository.ts`) |
| `education` | avaliar tentativa objetiva | `src/domains/education/objective.ts` (atômico no banco) |

Regras: comando não retorna estado parcial; falha é erro de contrato, nunca `null` silencioso; efeito é
idempotente quando repetível (ver F3.9).

**Estado:** **CANÔNICO**.

---

## F3.3 — Queries (consulta sem efeito)

- Queries são síncronas, somente leitura e não emitem eventos.
- Leitura derivada (`sanctuary`, `/estatisticas`) não cria autoridade sobre o recurso consultado.
- Repositórios expõem leitura por contrato (ex.: `StudyTaskRepository.listUpcoming(ownerId, now, limit?)`,
  `getById`), sempre com escopo de dono explícito.
- Filtro de dono é aplicado no servidor/RLS, nunca apenas na UI.

**Estado:** **CANÔNICO**.

---

## F3.4 — Events (contrato de evento de domínio)

Catálogo canônico: ver `AA-SPEC-F1` §F1.15 (14 domínios, 27 eventos declarados).
Envelope mínimo de evento:

```
{ name, version, aggregateId, actorId, contextId, occurredAt, payload, idempotencyKey }
```

Regra: produtor do estado é o único que emite o evento; consumidores não mutam o estado de origem.
**Estado:** **PARCIAL** — catálogo e envelope definidos; **não existe broker/fila**: entrega real é
`GAP-F3-04`. Nenhuma afirmação de entrega assíncrona é feita sem transporte.

---

## F3.5 — Requests e Responses

- Rotas em `src/app/api/**` são o contrato HTTP.
- Entrada validada na borda com **zod** (ex.: `FeedbackSchema`: `name` ≤120 opcional, `email` válido ≤320,
  `feedback` 1–2000) antes de consumir cota.
- Respostas usam `NextResponse.json` com `Cache-Control: no-store` em dados pessoais.
- Status usados: `200/201` sucesso, `400` entrada inválida, `401` autenticação ausente, `429` limite,
  `503` indisponibilidade — sem vazar detalhe interno.
- Contratos de serviço: `/api/health`, `/api/ready`, `/api/v1/status`, `/api/integrations/status`.
- Integrações expõem `connect`/`callback`/`status`/`disconnect` por provedor (asana, github, microsoft-sharepoint,
  notion, outlook, todoist, trello) em `src/app/api/integrations/**`.

**Estado:** **CANÔNICO**.

---

## F3.6 — Contratos de erro

- Erros de domínio são tipos nomeados (`FeedbackAuthenticationError`,
  `AccessibilityPreferencesErrorCode = "PERSISTENCE_FAILED"`), não strings soltas.
- A decisão de autorização sem política é `policy-denied` — **negado por padrão**.
- Nenhuma resposta HTTP inclui stack trace, SQL, nome de tabela ou segredo.
- O cliente recebe mensagem acionável em português; o log/servidor recebe detalhe técnico.
- Erros de limite de requisição padronizam `Retry-After` inteiro ≥ 1 e `Cache-Control: no-store`
  (`src/lib/http/api-rate-limit-response.ts`).

**Estado:** **CANÔNICO**.

---

## F3.7 — Validação de entrada

- Zod na borda HTTP; validação de domínio no caso de uso; invariantes no agregado.
- Nunca confiar em validação de cliente.
- Entrada inválida **não** consome cota nem grava estado.
- Strings têm limite máximo explícito; e-mails são normalizados; campos opcionais vazios viram `null`.
- Padrões perigosos (URLs externas) passam por `src/lib/security/external-url.ts`.

**Estado:** **CANÔNICO**.

---

## F3.8 — Autorização nos casos de uso

- Toda operação sensível avalia `authorization` no servidor.
- `identity` prova o sujeito; `context` resolve o escopo; `authorization` decide.
- RLS no banco é a segunda barreira, não a primeira.
- Rotas privadas são protegidas antes do shell de streaming (PR #808), evitando vazamento de UI.
- Rate limit por rota sensível (`20261024181000_api_rate_limit.sql`).

**Estado:** **CANÔNICO**.

---

## F3.9 — Idempotência

| Operação | Mecanismo |
|---|---|
| Conclusão de tarefa com recompensa | RPC atômico `complete_study_task_with_reward` (uma concessão por tarefa) |
| Tentativa educacional | RPC atômico (`20261002010809_educational_core_p1_atomic_attempt.sql`) |
| Conclusão de missão | derivada do estado, não incrementada cegamente |
| Feedback | criação única por submissão autenticada; sem retry automático |

Chaves de idempotência são obrigatórias em qualquer integração futura com terceiros (ver F3.14).
**Estado:** **CANÔNICO** para as operações existentes; **PARCIAL** para integrações externas.

---

## F3.10 — Paginação, filtros e ordenação

- Listagens têm limite máximo explícito (`listUpcoming(..., limit?)`) e ordenação determinística.
- Ordenação de hierarquia usa `position` inteira única por pai.
- Filtros nunca ampliam visibilidade: filtram dentro do escopo do dono.
- Paginação por cursor é preferível a offset para listas mutáveis; quando não implementada, o limite é
  pequeno e documentado no contrato.

**Estado:** **CANÔNICO** (limite/ordenação); **PARCIAL** (paginação por cursor ainda não generalizada).

---

## F3.11 — Versionamento e compatibilidade dos contratos

- Contratos internos evoluem por adição compatível; remoção exige migração de todos os consumidores no
  mesmo PR.
- Contratos HTTP versionados por caminho quando públicos (`/api/v1/...`).
- Eventos carregam `version`; consumidor deve ignorar campos desconhecidos.
- Migrações SQL são versionadas (`supabase/migrations/`, 22 arquivos), aplicadas em ordem, e nunca editadas
  depois de aplicadas em produção.
- Compatibilidade de build é verificada por `scripts/verify-canonical-infrastructure.cjs` e
  `scripts/verify-deployment-platform.cjs` no `prebuild`.

**Estado:** **CANÔNICO**.

---

## F3.12 — Contratos com infraestrutura e adapters

Padrão port/adapter: o domínio declara a interface (ex.: `StudyTaskRepository`, `FocusSessionRepository`), a
infraestrutura implementa (`src/infrastructure/supabase/`). Nenhum domínio importa `@supabase/*`.

Adapters existentes: `supabase`, `openai`, `exa`, `parallel`, `web-research`, `integrations`, `social`,
`trust`, `sanctuary`, `intelligence`, `data`, e `runtime-secrets` para credenciais.
Política de provedor: `src/core/architecture/provider-policy.ts`.

**Estado:** **CANÔNICO**.

---

## F3.13 — Contratos assíncronos

Não existe runtime assíncrono (fila/worker/broker) na Academia Arcana. Nada é declarado como "assíncrono"
sem transporte. O contrato assíncrono está **desenhado** (envelope de evento + idempotency key) mas sem
implementação. **Estado:** **LACUNA** (`GAP-F3-13`).

---

## F3.14 — Webhooks e integrações externas

- Chamadas de saída passam por adapter com allowlist de provedor e URL validada
  (`src/lib/security/external-url.ts`).
- Segredos de integração nunca chegam ao cliente; vivem em `runtime-secrets` / `/etc/secrets`.
- Callbacks **OAuth** de entrada existem (`/api/integrations/<provedor>/callback`) e são tratados como
  superfície sensível: validam estado/`code`, não refletem entrada do usuário em HTML e não devolvem detalhe
  interno. Verificações dedicadas: `.github/workflows/cp04-asana-review-regression.yml`,
  `cp05-asana-json-boundary.yml`, `cp06-asana-parser-review.yml`, `cp11-sharepoint-test-quality.yml`.
- Webhooks **de evento** (push do provedor para a aplicação) não são uma superfície implementada: não há rota
  pública de webhook. Uma futura entrada exigirá: verificação de assinatura, idempotency key, limite de
  tamanho, resposta sem detalhe interno e teste dedicado.
- Estado das integrações é lido por `/api/integrations` e documentado em
  `docs/engineering/project-integrations.md` e `docs/integrations/*`.

**Estado:** **PARCIAL** — saída canônica; entrada é **LACUNA** (`GAP-F3-14`).

---

## F3.15 — Contratos públicos e privados

| Superfície | Público? | Regra |
|---|---|---|
| `src/domains/*/index.ts` | interno ao monólito | superfície mínima |
| `/api/health`, `/api/ready` | público | sem dado sensível, com revision |
| `/api/feedback` | autenticado | zod + rate limit |
| `/api/v1/status` | público | contrato de status |
| `/api/integrations` | autenticado | estado de integrações |
| `/api/agent/mestre-arcano`, `/api/ia-aberta`, `/api/search/relewise` | autenticado + rate limit | IA assistiva |
| `/api/integrations/<provedor>/{connect,callback,status,disconnect}` | autenticado | OAuth de integrações |

Regra: nada de exportar internals "por conveniência"; contrato privado que vira público precisa de
documentação e teste de compatibilidade.

**Estado:** **CANÔNICO**.

---

## F3.16 — Matriz final de contratos

| Contrato | Tipo | Owner | Implementação | Teste |
|---|---|---|---|---|
| `AccessRequest`/`AccessDecision` | query | `authorization` | `src/core/authorization/contracts.ts` | `core/authorization/*.test.ts` |
| `StudyTaskRepository` | command+query | `planning` | `src/infrastructure/supabase/` | `planning/contracts.test.ts` |
| `FocusSessionRepository` | command | `planning` | `src/infrastructure/supabase/` | `planning/contracts.test.ts` |
| `Grimoire/Notebook/Chapter/Page` | command+query | `learning` | `src/domains/learning/workspace.ts` | `learning/workspace.test.ts` |
| progresso | command+query | `learning` | `src/domains/learning/progress.ts` | `learning/*.test.ts` |
| evidência objetiva | query | `learning` | `src/domains/learning/objective-evidence.ts` | `learning/objective-evidence.test.ts` |
| `GamificationProfile`/`Mission` | query+derivado | `gamification` | `src/domains/gamification/` | `gamification/*.test.ts` |
| `FriendConnection` | command+query | `social` | `src/domains/social/contracts.ts` | `social/contracts.test.ts` |
| `FeedbackResponse` | command | `trust` | `src/infrastructure/supabase/feedback-repository.ts` | `src/app/api/feedback` |
| `PracticeAttempt` | command | `education` | `src/domains/education/` | `education/*.test.ts` |
| `Recommendation`/`Adaptation` | query | `adaptive` | `src/domains/adaptive/p1.ts` | `adaptive/p1.test.ts` |
| `IntelligenceRequest` | command | `intelligence` | `src/infrastructure/openai/` | `intelligence/contracts.test.ts` |
| `SanctuarySnapshot` | query derivada | `sanctuary` | `src/domains/sanctuary/` | `sanctuary/*.test.ts` |
| rate limit de API | command | `security` (application) | `src/application/security/api-rate-limit.ts` | `src/lib/http/*.test.ts` |
| saúde/prontidão | query | infraestrutura | `src/app/api/health`, `/api/ready` | smoke de produção |

**Estado:** **CANÔNICO**.

---

## Lacunas

`GAP-F3-04` (entrega de eventos), `GAP-F3-13` (runtime assíncrono), `GAP-F3-14` (webhooks de entrada).
