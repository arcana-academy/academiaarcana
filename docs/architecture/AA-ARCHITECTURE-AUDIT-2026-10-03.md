# AA-ARCHITECTURE-AUDIT-2026-10-03 — Auditoria Arquitetural de Fechamento

> Data: 2026-10-03
> Autoridade: Chat 02 — Arquitetura, subordinado à AA-CONSTITUTION-1.0.
> Repositório: `arcana-academy/academiaarcana`
> Branch auditada: `main`
> Commit operacional observado: `7124e7265e311c4c36e72dfe74f71891de6f76eb`
> Escopo: arquitetura técnica, boundaries, infraestrutura, CI/CD, Supabase/RLS, segurança arquitetural, contratos e riscos de operação.
> Método: evidência do repositório + estado real de Render + estado real de Supabase.

---

## 1. Resultado executivo

A arquitetura operacional atual está **estruturalmente consolidada e em produção no Render**, com separação modular, boundaries verificáveis, CI de qualidade, políticas de infraestrutura canônica e RLS ativo nas tabelas públicas do produto.

A auditoria encontrou:

- **0 divergências críticas de infraestrutura operacional** entre GitHub, GitHub Actions, Render e Supabase.
- **15/15 tabelas públicas do produto com RLS habilitado**.
- **0 privilégios de tabela pública concedidos ao papel `anon`** na amostra auditada.
- RPCs de produto públicas relevantes operando como **SECURITY INVOKER**; implementações privilegiadas permanecem em schema privado.
- Deploy atual do Render em estado **live**, usando o repositório GitHub correto, branch `main`, `autoDeployTrigger: checksPass`, build `npm ci && npm run build`, start `npm start` e health check `/api/health`.
- O Supabase está em estado **ACTIVE_HEALTHY**.
- O único alerta de segurança externo relevante observado no Supabase Advisor é **Leaked Password Protection desabilitado**. Essa configuração pertence ao serviço de Auth e não possui mutação exposta pela ferramenta disponível neste fluxo; portanto permanece como **bloqueio operacional externo**, não como defeito estrutural do código.

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

## 5. Vercel e Netlify

O estado real do runtime não utiliza Vercel nem Netlify como plataforma concorrente de produção.

O guard de infraestrutura canônica mantém provedores equivalentes excluídos das superfícies operacionais.

O Render é a plataforma de runtime atualmente efetiva.

### Observação de governança

A Constituição Master historicamente descreve a Vercel como etapa final de deploy. Isso não deve ser interpretado como autorização para substituir o Render durante a construção ou operação corrente.

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

### Divergência documental residual

O Prompt 02 fornecido para este chat ainda lista “Tailwind CSS” na stack oficial. A decisão AA-ARCH-001 do repositório é mais específica e é a referência técnica atual.

Isso deve ser sincronizado pelo Chat 00 na próxima revisão do Prompt 02, para evitar duas descrições canônicas concorrentes.

Estado: **PENDÊNCIA DOCUMENTAL, NÃO TÉCNICA**

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
- `production-smoke.yml`
- `autofix.yml`
- `anti-dark-pattern.yml`

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

### Limitação de evidência

A interface do conector GitHub utilizada nesta auditoria expôs o status de commit do pre-commit.ci, mas não o painel completo de Checks do GitHub Actions.

Portanto:

- existência e conteúdo dos workflows: **CONFIRMADOS**;
- existência do deploy Render correspondente: **CONFIRMADA**;
- sucesso de cada job do Quality Gate no commit operacional: **não inferido sem evidência direta do painel de Checks**.

Isso não invalida o CI; apenas impede uma falsa afirmação de “PASS” para cada job sem a evidência apropriada.

Estado: **VALIDAÇÃO PARCIAL DE EVIDÊNCIA**

---

## 11. Render — estado real

Deploy observado como `live`:

- Deploy ID: `dep-db0in8tckfvc73crtog0`
- Commit: `7124e7265e311c4c36e72dfe74f71891de6f76eb`
- Mensagem: `docs(architecture): record AA-ARCH-001 CSS stack decision`

O serviço atual está operacional segundo o estado informado pelo Render.

Estado: **LIVE + CONFIRMADO**

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

### Fora do alcance direto deste ciclo

1. Ativação de Leaked Password Protection no Supabase Auth.
2. Sincronização do texto do Prompt 02 pelo Chat 00.
3. Evidência completa dos Checks do GitHub Actions, por limitação do conector utilizado.

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

## 18. Estado final do domínio — Arquitetura

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

**TRABALHO RESTANTE DENTRO DO DOMÍNIO ARQUITETURA:** nenhum bloqueante identificado.

**PRONTO PARA O PRÓXIMO DOMÍNIO:** SIM, condicionado apenas à comunicação das dependências externas acima.

**PRÓXIMO DOMÍNIO:** Design System.
