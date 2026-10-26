# AA-SPEC-F2 — Modelo de domínio: entidades, agregados, estados e invariantes

**Projeto:** Academia Arcana
**Série de origem:** issues F2.1 – F2.8
**Estado:** canônico para a série F2
**Autoridade superior:** `docs/architecture/AA-ARCHITECTURE-1.0.md` §3–§8

## 0. Regra de transposição

A série F2 enuncia princípios genéricos e um inventário escrito para o enquadramento "Support Arcana"
(`Customer`, `Conversation`, `Ticket`, `Knowledge Article`…). A Academia Arcana **não possui** essas
entidades. O inventário abaixo é o **inventário efetivamente implementado**, derivado de código, e não de
intenção: cada linha aponta o arquivo que declara a entidade. Entidades do texto original sem equivalente
são registradas como lacuna (`GAP-F2-01`) e **não** são criadas por conveniência.

---

## F2.1 — Inventário de entidades de domínio

### Entidades implementadas

| Entidade | Domínio | Declaração |
|---|---|---|
| `Grimoire` | `learning` | `src/domains/learning/workspace.ts` |
| `Notebook` | `learning` | `src/domains/learning/workspace.ts` |
| `Chapter` | `learning` | `src/domains/learning/workspace.ts` |
| `Page` / `PageContent` | `learning` | `src/domains/learning/workspace.ts` |
| `PageProgress` | `learning` | `src/domains/learning/progress.ts` |
| `StudyTask` | `planning` | `src/domains/planning/contracts.ts` |
| `FocusSession` | `planning` | `src/domains/planning/contracts.ts` |
| `GamificationProfile` | `gamification` | `src/domains/gamification/contracts.ts` |
| `Mission` | `gamification` | `src/domains/gamification/contracts.ts` |
| `Achievement` (value object derivado) | `gamification` | `src/domains/gamification/progression.ts` |
| `FriendConnection` | `social` | `src/domains/social/contracts.ts` |
| `FeedbackResponse` | `trust` | `src/domains/trust/contracts.ts` |
| `PracticeAttempt` / `PracticeOutcome` | `education` | `src/domains/education/contracts.ts`, `objective.ts` |
| `ObjectiveScoringPolicy` (value object) | `education` | `src/domains/education/contracts.ts` |
| `EvidenceRecord` | `learning` | `src/domains/learning/evidence.ts`, `objective-evidence.ts` |
| `Recommendation` / `Adaptation` | `adaptive` | `src/domains/adaptive/p1.ts` |
| `IntelligenceRequest` | `intelligence` | `src/domains/intelligence/contracts.ts` |
| `FlontsState` | `flonts` | `src/domains/flonts/contracts.ts` |
| `SanctuarySnapshot` (leitura derivada) | `sanctuary` | `src/domains/sanctuary/contracts.ts` |
| `AccessRequest` / `AccessDecision` | `authorization` | `src/core/authorization/contracts.ts` |
| `ContextResource` | `context` | `src/core/context/` |
| `Identity` | `identity` | `src/core/identity/` |

### Entidades do texto original **sem** equivalente

`Customer`, `Conversation`, `Message`, `Ticket`, `Knowledge Article`, `Knowledge Version`, `Document`,
`AI Operation (persistida)`, `Notification`, `Analytics Report`, `Analytics Metric`, `Audit Event (persistido)`,
`Setting`.

**Decisão:** não são criadas. `GAP-F2-01` registra a ausência; a criação exige requisito de produto aprovado
(AA-PROD-002) e owner em `DATA_OWNERSHIP_POLICY`.

**Critérios obrigatórios por entidade** (nome canônico, finalidade, identidade, ownership, ciclo de vida,
invariantes, eventos): ver §F2.2 a §F2.7 abaixo.

**Estado:** **CANÔNICO** para as entidades implementadas; **LACUNA** para as ausentes.

---

## F2.2 — Identidade e ownership das entidades

- **Identificador:** UUID estável por entidade, nunca derivado de atributo mutável
  (`Grimoire.id`, `Page.id`, `StudyTask.id` etc. são `string` opacos; o formato é responsabilidade do adapter).
- **Ownership:** derivado de `DATA_OWNERSHIP_POLICY` (`src/core/architecture/data-ownership.ts`), 16 recursos,
  e não do módulo que consome. Verificação: `data-ownership.test.ts`.
- **Relação identidade → recurso → contexto:** `identity` prova *quem*; `context` resolve *onde/para quem*;
  `authorization` decide *se pode*. Nenhum dos três assume o papel do outro
  (`src/core/architecture/domain-policy.ts`).
- **Ownership de registro do usuário:** todo recurso de dados de usuário carrega `ownerId`/`user_id`
  no recurso, e o acesso é mediado por RLS — não por filtro de UI.
- **Estado:** **CANÔNICO**.

---

## F2.3 — Relacionamentos entre entidades

Relações de domínio explícitas, todas obrigatórias e verificadas:

```
Grimoire 1──N Notebook 1──N Chapter 1──N Page
Page 1──N PageProgress (por usuário)
Page ──(referência fraca)──> EvidenceRecord
StudyTask ──(contexto)──> Grimoire|Page      [opcional, por contrato]
FocusSession ──(referência fraca)──> StudyTask [opcional]
GamificationProfile 1──1 Identity
Mission N──1 GamificationProfile
FriendConnection N──N Identity (estado: pending|accepted|removed)
FeedbackResponse N──1 Identity (restrição de retenção: ver #588)
PracticeAttempt N──1 Page/Atividade
```

Regras preservadas:

1. Nenhuma relação é criada apenas para compartilhar dados; toda aresta tem significado de domínio.
2. Deleções são decididas por política de retenção, não por conveniência do `ON DELETE`:
   `docs/deployment/feedback-fk-remediation-536.md` registra a divergência `SET NULL` (hospedado) vs
   `CASCADE` (migração versionada) e mantém o tema sob decisão humana (#530/#588).
3. `Page.position` é único dentro do pai — imposto por
   `20261007230000_enforce_workspace_page_position_uniqueness.sql`.
4. `FriendConnection` só aceita inserção `pending` e só o destinatário altera o estado —
   `20261007170500_require_pending_friend_request_insert.sql` e
   `20261006162332_harden_friend_connection_recipient_updates.sql`.

**Estado:** **CANÔNICO**.

---

## F2.4 — Agregados e limites de consistência

| Agregado | Raiz | Invariantes protegidas pela raiz | Consistência |
|---|---|---|---|
| Workspace | `Grimoire` | hierarquia, posição única, ownership do grimoire | imediata dentro do grimoire |
| Progresso | `PageProgress` | progresso monotônico por página e usuário | imediata |
| Planejamento | `StudyTask` | ciclo de vida da tarefa; foco vinculado | imediata |
| Gamificação | `GamificationProfile` | XP não negativo, nível derivado, streak consistente | imediata no RPC `complete_study_task_with_reward` |
| Social | `FriendConnection` | transições do vínculo e destinatário autorizado | imediata |
| Educação | `PracticeAttempt` | política de pontuação aplicável, evidência não globalizada | imediata (RPC transacional) |
| Confiança | `FeedbackResponse` | autoria autenticada, retenção | imediata; exclusão depende de decisão |

Agregados **não** compartilham transação entre si: a coordenação entre `planning` e `gamification` ocorre via
RPC dedicado (`complete_study_task_with_reward`, owner `cross-domain`) e evento `task completed`.
Agregados grandes (workspace inteiro em uma transação) são proibidos.

**Estado:** **CANÔNICO**.

---

## F2.5 — Estados e ciclos de vida das entidades

| Entidade | Estados | Observação |
|---|---|---|
| `Identity` | `active` → `disabled` (e retorno controlado) | evento `identity lifecycle change` |
| `StudyTask` | `pending` → `in_progress` → `completed`; `pending`→`archived` | transições só via caso de uso |
| `FocusSession` | `running` → `completed` \| `abandoned` | duração não pode ser negativa |
| `FriendConnection` | `pending` → `accepted` \| `rejected` \| `removed` | inserção restrita a `pending` |
| `PracticeAttempt` | criado → avaliado (`strong` \| `insufficient`) | `PracticeOutcome` é derivado, não editável |
| `Grimoire`/`Notebook`/`Chapter`/`Page` | ativo → arquivado → excluído | exclusão em cascata interna ao agregado |
| `FeedbackResponse` | recebido → (retenção decidida por política) | decisão aberta #588 |
| `Mission` | disponível → concluída | conclusão idempotente |

Nenhum estado implícito: entidade sem estado válido é rejeitada na entrada do adapter, e valores numéricos
inválidos são normalizados antes da UI (`gamification/progression.ts`, `safeCounter`).

**Estado:** **CANÔNICO**.

---

## F2.6 — Transições de estado e regras de mudança

Fluxo obrigatório para toda transição:

```
solicitação → estado atual → validação → autorização → pré-condições → regra de domínio → novo estado → evento
```

Aplicação:

1. O consumidor **não** envia o próximo estado; envia a intenção (comando).
2. A autorização é avaliada por `authorization` (padrão negado sem política).
3. Pré-condições e regras de domínio vivem no domínio (`src/domains/*`), não no componente de UI.
4. O evento é emitido **somente** após a transição válida.
5. Concorrência: operações críticas usam RPC atômico
   (`20261002010809_educational_core_p1_atomic_attempt.sql`) e unicidade imposta no banco.

**Estado:** **CANÔNICO**.

---

## F2.7 — Invariantes de domínio

| ID | Invariante | Onde é imposta |
|---|---|---|
| INV-01 | Todo recurso tem exatamente um owner lógico | `data-ownership.ts` |
| INV-02 | Nenhum módulo muta estado de outro sem contrato | `architecture.test.ts`, `import-boundaries.test.ts` |
| INV-03 | Sem política de autorização, a decisão é `policy-denied` | `src/core/authorization/contracts.ts` |
| INV-04 | XP e contadores são inteiros ≥ 0 e finitos | `gamification/progression.ts` |
| INV-05 | Progresso não regride por operação normal | `learning/progress.ts` |
| INV-06 | `Page.position` é única por pai | migração 20261007230000 |
| INV-07 | Solicitação de amizade nasce `pending` | migração 20261007170500 |
| INV-08 | Evidência objetiva é sobre a tarefa, nunca conclusão global | `education/objective.ts` (mensagem canônica) |
| INV-09 | Nenhum segredo em código/versionamento | `gitleaks.yml`, `.gitleaks.toml`, `runtime-secrets.ts` |
| INV-10 | Toda exclusão com dado pessoal exige política de retenção registrada | `docs/superpowers/specs/2026-09-12-sec-007-data-lifecycle-and-privacy-design.md` |

**Estado:** **CANÔNICO**.

---

## F2.8 — Regras de negócio por domínio

> Operação tecnicamente possível ≠ operação válida.

| Domínio | Regras consolidadas |
|---|---|
| `learning` | progresso pertence ao usuário autenticado; hierarquia grimoire→notebook→chapter→page é obrigatória; mover página não pode duplicar posição (`public.move_workspace_page`) |
| `planning` | tarefa pertence ao dono; concluir tarefa pode conceder recompensa apenas via RPC `complete_study_task_with_reward`; sessão de foco não atravessa tarefa alheia |
| `gamification` | nível = `100·(n-1)²` XP; contadores normalizados; conquista é derivada, não persistida à parte |
| `education` | avaliação só existe sob política suportada (`normalized-exact-match`); qualquer outra política lança erro `Política objetiva não suportada.`; feedback não generaliza desempenho |
| `social` | usuário não aceita a própria solicitação; apenas o destinatário altera o vínculo; compartilhamento respeita preferências |
| `trust` | feedback exige autoria autenticada (`feedback_hub_require_authenticated_owner`); retenção sob decisão de Produto/Privacidade |
| `intelligence` | IA é assistiva; nunca decide acesso; consumo limitado por rate limit durável |
| `sanctuary` | visão derivada e somente leitura; não cria estado próprio |

**Estado:** **CANÔNICO**.

---

## Lacunas

`GAP-F2-01` — entidades do texto original sem equivalente na Academia Arcana (Customer, Conversation, Message,
Ticket, Knowledge Article/Version, Document, Notification, Analytics Report/Metric, Audit Event, Setting).
Ver `docs/specs/AA-SPEC-GAP-REGISTER.md`.
