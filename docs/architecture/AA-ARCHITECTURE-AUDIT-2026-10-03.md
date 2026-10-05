# AA-ARCHITECTURE-AUDIT-2026-10-03 — Auditoria Arquitetural de Fechamento

> Data: 2026-10-03
> Autoridade: Chat 02 — Arquitetura, subordinado à AA-CONSTITUTION-1.0.
> Repositório: `arcana-academy/academiaarcana`
> Branch auditada: `main`
> Commit operacional observado no início da auditoria: `7124e7265e311c4c36e72dfe74f71891de6f76eb`  
> Atualização desta auditoria: `9f6ab53df8cdcb14b2e77a6aa2d6d4f841ad277d` (main)  
> Estado posterior verificado: `e37daa795a2e3a269184bd2aecf1aa5ca23358ab` (main; ainda não verificado como LIVE no Render).
> Escopo: arquitetura técnica, boundaries, infraestrutura, CI/CD, Supabase/RLS, segurança arquitetural, contratos e riscos de operação.
> Método: evidência do repositório + estado real de Render + estado real de Supabase.

---

## 1. Resultado executivo

A arquitetura operacional atual está **estruturalmente consolidada e em produção no Render**, com separação modular, boundaries verificáveis, CI de qualidade, políticas de infraestrutura canônica e RLS ativo nas tabelas públicas do produto.

A auditoria encontrou:

- **0 divergências críticas na topologia de provedores canônicos**, mas existe **1 pendência de alta prioridade na cadeia de promoção**: o issue #497 registra a dependência a ser resolvida entre `checksPass` e o Production Smoke.
- **15/15 tabelas públicas do produto com RLS habilitado**.
- **0 privilégios de tabela pública concedidos ao papel `anon`** na amostra auditada.
- RPCs de produto públicas relevantes operando como **SECURITY INVOKER**; implementações privilegiadas permanecem em schema privado.
- O último deploy **LIVE comprovado** no Render é o commit `4e25a0e097ccdc0e28da3607e757d0d4d4e718fb`; `main` já avançou além dele e o commit `e37daa795a2e3a269184bd2aecf1aa5ca23358ab` ainda não foi comprovado como LIVE.
- O Supabase está em estado **ACTIVE_HEALTHY**.
- O único alerta de segurança externo relevante observado no Supabase Advisor é **Leaked Password Protection desabilitado**. Essa configuração pertence ao serviço de Auth e não possui mutação administrativa exposta pelas ferramentas disponíveis neste fluxo; portanto permanece como **bloqueio operacional externo**, não como defeito estrutural do código.

---

## 2. Arquitetura canônica verificada

### 2.1 Cadeia operacional

```text
GitHub
  ↓
GitHub Actions
  ↓
Render
  ↓
Next.js / React / TypeScript
  ↓
Supabase
  ├── PostgreSQL
  ├── Auth
  ├── RLS
  └── Storage
```

Estado: **CONFIRMADO + IMPLEMENTADO + EM OPERAÇÃO**

Evidência operacional:

- Serviço Render `academiaarcana`
- Repositório: `https://github.com/arcana-academy/academiaarcana`
- Branch: `main`
- Auto deploy: ativo
- Trigger: `checksPass`
- Build: `npm ci && npm run build`
- Start: `npm start`
- Health: `/api/health`
- URL operacional: `https://academiaarcana.onrender.com`

---

## 3. Arquitetura modular

Domínios canônicos observados no repositório:

- identity
- context
- authorization
- learning
- planning
- gamification
- education
- social
- adaptive
- intelligence
- flonts
- trust
- data
- sanctuary

A separação possui validações executáveis de:

- registro de domínios;
- dependência;
- comunicação;
- ownership de dados;
- import boundaries;
- ausência de dependências proibidas;
- aciclicidade do grafo arquitetural.

Estado: **CANÔNICO + IMPLEMENTADO + VALIDADO**

---

## 4. Infrastructure provider policy

A política de fornecedores canônicos está implementada e protegida por testes.

### Fonte de código

`src/core/architecture/provider-policy.ts`

### Testes

- `tests/infrastructure/canonical-provider-policy.test.ts`
- `tests/infrastructure/delivery-contract.test.ts`

### Regra

- GitHub = source control
- GitHub Actions = CI/CD + Quality Gate
- Render = application runtime / production hosting
- Supabase = database + Auth + RLS + application data services

Plataformas equivalentes não devem criar uma segunda cadeia operacional concorrente.

Estado: **CANÔNICO + IMPLEMENTADO + TESTADO**

---

## 5. Exclusividade do Render

O estado real do runtime utiliza Render como única plataforma de produção.

O guard de infraestrutura canônica mantém provedores equivalentes excluídos das superfícies operacionais.

O Render é a plataforma de runtime atualmente efetiva.

### Observação de governança

A documentação de publicação deve refletir Render como plataforma canônica, mantendo a validação do Quality Gate e a aprovação explícita para publicação.

Qualquer transição futura deve seguir o fluxo formal da Constituição Master e não pode ocorrer silenciosamente.

Estado: **RESOLVIDO OPERACIONALMENTE**

---

## 6. CSS / Tailwind

A arquitetura atual contém a decisão formal:

**AA-ARCH-001 — CSS stack resolution**

O sistema visual operacional utiliza CSS semântico autoral com propriedades customizadas e classes `aa-*`.

O pacote `tailwind-merge` permanece apenas como utilitário de composição de classes e não implica que Tailwind CSS seja uma dependência operacional obrigatória.

O código confirma o uso de `twMerge` em `src/lib/utils.ts`.

Estado: **CANÔNICO + IMPLEMENTADO + VALIDADO**

### Governança documental

AA-ARCH-001 resolve a base operacional como CSS semântico autoral. AA-ARCH-002 registra a necessidade de sincronização do Prompt 02 pelo Chat 00. AA-ARCH-003 estabelece que documentos históricos não substituem a arquitetura operacional canônica.

Estado: **CANÔNICO + DOCUMENTADO**

---

## 7. Supabase — estado estrutural

Projeto observado:

- ref: `fichnalpbcfjywwhixid`
- estado: `ACTIVE_HEALTHY`
- PostgreSQL: série 17

Tabelas públicas do produto auditadas:

1. chapters
2. educational_practice_attempts
3. educational_practice_items
4. external_document_sources
5. feedback_responses
6. focus_sessions
7. friend_connections
8. gamification_profiles
9. grimoires
10. integration_credentials
11. missions
12. notebooks
13. page_progress
14. pages
15. study_tasks

Todas as 15 possuem:

- RLS habilitado;
- políticas associadas;
- ownership explícito ou controle específico;
- nenhum privilégio de tabela concedido a `anon` na auditoria realizada.

Estado: **IMPLEMENTADO + VALIDADO**

---

## 8. RLS e autorização

O modelo observado utiliza a combinação:

```text
Authentication
      +
Application Authorization
      +
PostgreSQL RLS
```

Isso preserva a distinção entre:

- identificar o usuário;
- decidir o que ele pode fazer;
- restringir fisicamente as linhas acessíveis.

As migrações existentes declaram RLS e policies para as tabelas relevantes.

Estado: **CANÔNICO + IMPLEMENTADO + VALIDADO**

---

## 9. Funções privilegiadas

A inspeção adicional confirmou que a única `SECURITY DEFINER` encontrada no schema `public`, `public.rls_auto_enable()`, é uma função de evento de DDL e possui ACL restrita a `postgres` e `service_role`; ela não está exposta a `anon` ou `authenticated`. Portanto não foi classificada como superfície privilegiada pública.

A inspeção do banco encontrou as funções SECURITY DEFINER relevantes do produto em schema privado, enquanto as RPCs públicas de produto observadas operam como SECURITY INVOKER.

Esse desenho é compatível com a regra arquitetural de não expor diretamente um caminho privilegiado a `anon`/cliente.

Funções privadas relevantes observadas:

- `private.complete_study_task_with_reward`
- `private.prevent_criterion_item_mutation_after_evidence`
- `private.record_criterion_referenced_practice_attempt`
- `private.record_educational_practice_attempt`

RPCs públicas relevantes observadas como invoker:

- `public.complete_study_task_with_reward`
- `public.move_workspace_page`
- `public.record_criterion_referenced_practice_attempt`
- `public.record_educational_practice_attempt`

Estado: **SEGURANÇA ESTRUTURAL SATISFATÓRIA PARA O ESCOPO AUDITADO**

---

## 10. CI / Quality Gate

O repositório possui:

- `quality.yml`
- `database-tests.yml`
- `production-smoke.yml`
- `autofix.yml`
- `anti-dark-pattern.yml`
- `codeql.yml`
- `gitleaks.yml`
- `dependency-review.yml`
- `scorecard.yml`

O Quality Gate inclui:

- instalação determinística com `npm ci`;
- guard de infraestrutura;
- lint;
- typecheck;
- testes unitários;
- testes de acessibilidade;
- build de produção;
- testes E2E.

As ações críticas do workflow estão pinadas por SHA.

Estado: **IMPLEMENTADO**

### Evidência atual do PR de auditoria

O head `bec5917a0df93b3a77374ca3489abdf5f694b5a3` concluiu com sucesso:

- Quality Gate;
- Database Tests;
- CodeQL;
- Gitleaks;
- Dependency Review;
- autofix.ci;
- AccessLint;
- pre-commit.ci;
- CommitCheck;
- CodeRabbit;
- qlty check.

O conector utilizado não expõe o painel completo dos Checks internos, mas os runs individuais foram consultados e seus jobs terminaram em SUCCESS.

Estado: **VALIDADO**

---

## 11. Render — estado real

Deploy observado como `live`:

- Deploy ID: `dep-db0q5hojo6nc739u3h7g`
- Commit: `4e25a0e097ccdc0e28da3607e757d0d4d4e718fb`
- Mensagem: `test(ds): enforce focus contrast across themes`

A cabeça atual de `main` já está em `e37daa795a2e3a269184bd2aecf1aa5ca23358ab`. A diferença entre `main` e o último deploy LIVE permanece deliberadamente aberta até que a cadeia de promoção seja comprovada.

O serviço atual está operacional segundo o estado informado pelo Render.

Estado: **LIVE + CONFIRMADO (último commit verificado em produção)**

---

## 12. Observabilidade

A arquitetura possui:

- health endpoint;
- readiness endpoint;
- smoke production;
- Honeybadger;
- logs do runtime;
- contrato de health/readiness;
- verificação de Supabase readiness.

A existência desses elementos reduz a dependência de testes manuais para validar a saúde operacional.

Estado: **IMPLEMENTADO**

---

## 13. Performance

O Supabase Advisor reportou 15 índices sem uso observado.

Isso **não foi promovido a defeito** porque as tabelas auditadas estão atualmente com zero linhas e a ausência de uso em um ambiente ainda pouco povoado não demonstra que os índices sejam desnecessários.

Nenhum índice será removido apenas para “zerar” o Advisor.

Estado: **SEM CORREÇÃO NECESSÁRIA NESTE CICLO**

---

## 14. Alerta de segurança externo

O Supabase Security Advisor reportou:

**auth_leaked_password_protection — WARN**

Descrição operacional: proteção contra senhas comprometidas está desabilitada.

Essa capacidade pertence à configuração do Supabase Auth e não foi alterada neste ciclo porque a ferramenta disponível não expõe uma operação segura de mutação dessa configuração.

### Ação necessária

Ativar a proteção contra senhas comprometidas no ambiente Supabase/Auth antes de declarar o fechamento operacional completo da segurança de autenticação.

Estado: **BLOQUEIO EXTERNO**

---

## 15. Decisão AA-ARCH-002 — Governança de sincronização do Prompt 02

**ID:** AA-ARCH-002

**TÍTULO:** Sincronização entre Prompt 02 e decisões arquiteturais consolidadas

**CONTEXTO:** O Prompt 02 utilizado no chat ainda descreve Tailwind CSS como parte da stack oficial, enquanto AA-ARCH-001 formalizou CSS semântico autoral como a base operacional atual.

**PROBLEMA:** Duas formulações podem ser interpretadas como simultaneamente canônicas.

**DECISÃO:** A implementação corrente e AA-ARCH-001 permanecem como referência técnica operacional. O Prompt 02 deve ser sincronizado pelo Chat 00 para refletir a decisão consolidada.

**ALTERNATIVAS CONSIDERADAS:**
- reintroduzir Tailwind apenas para alinhar o texto;
- ignorar a divergência documental;
- sincronizar o texto com a arquitetura efetivamente aprovada.

**JUSTIFICATIVA:** A regra de simplicidade e a hierarquia de autoridade favorecem preservar uma arquitetura que já está implementada, testada e em produção, em vez de adicionar uma dependência exclusivamente para satisfazer documentação antiga.

**IMPACTO:** elimina ambiguidade de governança sem alterar o comportamento da aplicação.

**DEPENDÊNCIAS:** Chat 00 — Constituição Master; revisão futura do Prompt 02.

**STATUS:** APROVADA PARA SINCRONIZAÇÃO DOCUMENTAL

---

## 16. Pendências reais

### Dentro do escopo do Chat 02

**Nenhuma pendência arquitetural crítica identificada.**

### Cross-domain / operacional

1. Ativação de Leaked Password Protection no Supabase Auth.
2. Sincronização do texto do Prompt 02 pelo Chat 00.
3. Exercícios de rollback, backup/restore, RTO/RPO, disaster recovery, incident response, alertas, recovery de credenciais e reconciliação de Storage permanecem no backlog operacional #268.
4. P0 de segurança (#31), dados (#33) e CI/CD (#37) permanecem abertos onde ainda existe evidência operacional não executada ou não observável diretamente.

Nenhuma dessas pendências justifica alterar a arquitetura estrutural atual.

---

## 17. Não regressão

A auditoria confirmou a preservação das principais propriedades arquiteturais:

- modularidade;
- dependência direcional;
- ownership;
- boundaries;
- RLS;
- separação Auth/Authorization;
- CI canônico;
- Render como runtime;
- Supabase como backend de dados;
- ausência de plataformas equivalentes na cadeia operacional;
- segurança de integrações;
- acessibilidade como requisito transversal.

---

## 18. Sincronização do estado de integrações\n\nDurante a continuidade da auditoria, foi identificada e corrigida uma divergência de representação: cinco integrações com adaptadores de runtime já implementados (Notion, Outlook Calendar, Asana, Trello e Todoist) eram expostas pelo status público como `catalogued`. O modelo agora distingue `catalogued`, `implemented`, `connected` e `error`; implementação não é apresentada como conexão autenticada.\n\nEstado: **CORRIGIDO + DOCUMENTADO**\n\n## 19. Estado final do domínio — Arquitetura

**CONCLUÍDO:** SIM

**ARQUITETURA CANÔNICA:** Consolidada.

**IMPLEMENTAÇÃO ARQUITETURAL:** Consolidada para o estado atual do produto.

**VALIDAÇÃO DO REPOSITÓRIO:** Realizada.

**VALIDAÇÃO DO RUNTIME RENDER:** Realizada.

**VALIDAÇÃO DO SUPABASE:** Realizada.

**RLS:** 15/15 tabelas públicas de produto com RLS habilitado.

**PROVEDORES CANÔNICOS:** GitHub + GitHub Actions + Render + Supabase.

**TAILWIND:** decisão reconciliada por AA-ARCH-001; sincronização documental ainda necessária no Prompt 02.

**PENDÊNCIAS ARQUITETURAIS CRÍTICAS:** nenhuma.

**BLOQUEIO EXTERNO:** Leaked Password Protection do Supabase Auth.

**P0 FECHADOS NESTA RODADA:** #30 — Fundação técnica; #32 — Arquitetura modular.

**P0 AINDA ABERTOS:** #31 — Segurança; #33 — Dados; #37 — CI/CD, cada um com lacunas operacionais explicitamente rastreadas.

**TRABALHO RESTANTE DENTRO DO DOMÍNIO ARQUITETURA:** nenhum bloqueante estrutural identificado; permanecem pendências externas/operacionais explicitamente listadas e a PR #486 de CSP aguardando revisão/merge e nova validação de produção.

**PRONTO PARA O PRÓXIMO DOMÍNIO:** SIM, condicionado apenas à comunicação das dependências externas acima.

**PRÓXIMO DOMÍNIO:** Design System.
