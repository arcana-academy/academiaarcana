# F6.21 — Matriz final de infraestrutura e operação

**Base documental:** `main` — matriz originalmente consolidada antes das verificações operacionais de setembro de 2026.

**Atualização operacional:** esta matriz foi reconciliada com as evidências posteriores registradas no Issue #268, incluindo o deployment de produção `dpl_8EEhVtKQgAdga2GdsCVxdgy3Kdka` em estado `READY` e o smoke test autenticado/anonimamente redirecionado do Santuário.  
**Escopo:** consolidar a visão operacional da Academia Arcana a partir de evidências presentes no repositório e de estados externos explicitamente verificados.

> Esta matriz distingue fatos comprovados no código/configuração versionada de controles que existem fora do repositório e ainda precisam de verificação operacional independente.

## 1. Legenda de estado

| Estado | Significado |
| --- | --- |
| **VERIFICADO** | Evidência direta no repositório ou em uma execução observada. |
| **EXTERNO** | Capacidade depende de serviço/configuração fora do repositório. |
| **PENDENTE** | Não há evidência suficiente para declarar a capacidade operacionalmente pronta. |

## 2. Matriz operacional

| Requirement / capacidade | Domain / contract | Implementation | Infrastructure | Security / identity | Observability | Delivery / recovery | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Identidade do usuário | `identity`, `authorization`, `context` | Autenticação server-side e contratos transversais | Supabase Auth | Sessão autenticada; RLS no acesso aos dados | Logs/erros da aplicação devem evitar exposição de credenciais | Recuperação depende da disponibilidade do provedor | **EXTERNO** |
| Persistência do Workspace | `learning` + ports/repositories | Repositórios Supabase e operações de Workspace | Supabase Postgres | Ownership + RLS; mutations autenticadas | Falhas devem ser tratadas no application layer | Backups/restore não são comprovados somente pelo repositório | **EXTERNO / PENDENTE** |
| Hierarquia de aprendizado | `learning` | Grimório → notebook → capítulo → página | Supabase Postgres | Ownership preservado | Estado carregado no Workspace/Santuário | Recuperação funcional via reload; recuperação de infraestrutura depende do banco | **VERIFICADO** |
| Santuário autenticado | `sanctuary` | View-model, políticas determinísticas, estados de disponibilidade e UI resiliente | Next.js + Supabase | Rota autenticada; dados do usuário | Estados de loading/empty/error | Fallback para estado vazio; teste E2E autenticado condicionado a credenciais dedicadas | **VERIFICADO** |
| Workspace autenticado | `learning` | Shell de navegação + ações server-side | Next.js App Router | `requireAuthenticatedUser()` nas mutations | Feedback de loading/erro na UI | Deploy via GitHub → Vercel | **VERIFICADO** |
| Ordenação de páginas | `learning` | Troca persistente de posições vizinhas + estado local imediato | Supabase + Next.js | Auth + RLS existentes | Erro recuperável na UI | Quality Gate completo no PR #257/#258 | **VERIFICADO** |
| Renomeação da hierarquia | `learning` | Mutations autenticadas para grimórios, notebooks e capítulos | Supabase + Next.js | Auth + RLS | Feedback de salvamento/erro | Quality Gate validado no histórico dos PRs | **VERIFICADO** |
| Edição/persistência de página | `learning` | `PageEditor` + action server-side + repository | Supabase + Next.js | Auth + RLS | Estado salvo/erro exposto sem detalhes internos | Recuperação via nova tentativa | **VERIFICADO** |
| CI de qualidade | Contratos arquiteturais e testes | GitHub Actions | Ubuntu + Node 22 + npm | `permissions: contents: read` | Status de workflows/checks | Reexecução de jobs disponível pelo GitHub | **VERIFICADO** |
| Typecheck / lint / unit / a11y / build / E2E | Quality Gate | `.github/workflows/quality.yml` | GitHub Actions + Playwright | Segredos E2E não versionados | Check status por workflow | Falha bloqueia o fluxo de validação | **VERIFICADO** |
| Code scanning | Segurança do repositório | CodeQL | GitHub Actions | Permissões mínimas | Resultado no PR/commit | Reexecução do workflow | **VERIFICADO** |
| Secret scanning | Segurança do repositório | Gitleaks + DeepSource Secrets | GitHub / DeepSource | Detecta exposição acidental | Checks por commit/PR | Corrigir antes de merge | **VERIFICADO** |
| SQL analysis | Integridade de persistência | DeepSource SQL | DeepSource | Analisa alterações SQL | Check por commit/PR | Falha retorna ao ciclo de correção | **VERIFICADO** |
| JavaScript/TypeScript analysis | Qualidade de código | DeepSource JavaScript + qlty | DeepSource / qlty | Sem exposição de segredos | Checks por commit/PR | PR #258 eliminou os findings observados | **VERIFICADO** |
| Error monitoring | `trust` / infraestrutura transversal | Honeybadger browser/server/edge | Honeybadger | API key somente por ambiente | Erros de runtime e contexto | Recovery é operacional, conforme provedor | **EXTERNO** |
| Produção | Delivery | Vercel | Vercel project `academiaarcana` | Configuração de ambiente externa | Deployment status + runtime logs disponíveis | Rollback/promotion suportados pela plataforma | **EXTERNO** |
| Produção atual verificada | Delivery | GitHub → Vercel | Vercel | Configuração externa | Deployment state + smoke test + runtime logs | `dpl_8EEhVtKQgAdga2GdsCVxdgy3Kdka` READY; smoke test `/santuario` HTTP 200; sem runtime errors no período verificado | **VERIFICADO / EXTERNO** |
| Web Analytics | Observabilidade de produto | PR #245 mantém a implementação proposta | Vercel Analytics | Configuração depende do projeto Vercel | Page views / insights após ativação | Ativação deve ocorrer no dashboard | **EXTERNO / PENDENTE** |
| Backups e recuperação | `data` / operação | Estratégia definida em F6, execução fora do app | Supabase / provedores operacionais | Retenção, acesso e restauração dependem da configuração externa | Restore deve ser validado por teste operacional | RTO/RPO exigem evidência externa | **PENDENTE** |
| Resiliência e disponibilidade | Infraestrutura | Aplicação desenhada para estados parciais em algumas superfícies | Vercel + Supabase | Failures não devem ampliar autorização | Monitoring/alerts dependem dos provedores | Não declarar disponibilidade sem evidência de teste | **PENDENTE** |
| Logs, métricas e tracing | Observabilidade | Hooks de monitoramento e logs da plataforma | Vercel + Honeybadger + demais serviços | Redação de dados sensíveis obrigatória | Runtime logs e error monitoring | Diagnóstico orientado por correlação | **EXTERNO / PENDENTE** |
| Secrets e credenciais | `trust` / segurança | Environment variables e credenciais externas | Vercel / GitHub / Supabase | Nunca versionar secrets | Secret scanning | Rotação/revogação precisam de procedimento externo | **EXTERNO** |
| Dependency governance | Segurança / Supply Chain | npm lockfile + Dependency Review | GitHub Actions | Revisão de mudanças de dependência | Checks no PR | Atualização deve ser validada pelo Quality Gate | **VERIFICADO** |

## 3. Runtime e build

O repositório fixa o runtime de desenvolvimento/CI em Node 22 por meio de `.nvmrc` e do workflow de qualidade. O projeto utiliza npm, com `packageManager: npm@11.19.1`.

O pipeline de qualidade executa, nesta ordem:

1. instalação com `npm ci --legacy-peer-deps`;
2. typecheck;
3. lint;
4. testes unitários;
5. testes de acessibilidade;
6. build de produção;
7. instalação dos browsers do Playwright;
8. testes E2E.

O contrato arquitetural de domínio segue a direção:

```text
UI -> application -> domain -> ports <- infrastructure
```

Infraestrutura não deve atravessar a API pública dos domínios.

## 4. Identidade, segurança e ownership

As operações de mutação do Workspace observadas nos merges recentes exigem autenticação server-side e reutilizam os repositórios existentes. A persistência de dados de aprendizado permanece sujeita às políticas de RLS e ao ownership do usuário.

O arquivo `.env.example` contém somente placeholders para:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

O `SECURITY.md` exige que vulnerabilidades sejam reportadas privadamente e orienta a não enviar senhas, API keys, service-role keys, credenciais de banco ou dados pessoais em issues/PRs.

## 5. Delivery e recuperação

### Estado confirmado

O deployment de produção anterior ao merge do PR #258 foi observado como `READY` no Vercel e apontava para o merge do PR #257 (`f24b72c…`).

O merge do PR #258 criou o commit:

```text
6f2a51016b8337dbeb36ac686a6cf458384566f3
```

A matriz original registrava o bloqueio `build-rate-limit` para uma versão anterior. Esse estado não deve ser usado como descrição da produção atual: posteriormente foi confirmado um deployment de produção `READY`, com smoke test do Santuário e ausência de runtime errors no período observado. O bloqueio de quota do Vercel continua sendo uma limitação operacional possível para novos deployments e não deve ser confundido com falha do código.

### Regra operacional

Não declarar a produção atualizada somente porque o commit está em `main`. O estado de produção precisa ser confirmado pelo objeto de deployment do Vercel.

A plataforma oferece mecanismos de:

- criação de deployment;
- promoção de deployment existente;
- rollback para deployment anterior.

Essas ações dependem de acesso operacional ao Vercel.

## 6. Quality Gates

Para alterações de aplicação, o conjunto mínimo de evidência é:

- Typecheck;
- Lint;
- Unit tests;
- Accessibility;
- Production build;
- E2E.

Para mudanças sensíveis de infraestrutura/código, também são observados:

- CodeQL;
- Gitleaks;
- Dependency Review;
- DeepSource Secrets;
- DeepSource SQL;
- DeepSource JavaScript;
- qlty;
- AccessLint;
- pre-commit.ci.

O PR #258 foi mesclado somente após o Quality Gate terminar com sucesso e após o DeepSource JavaScript deixar o estado de failure observado no PR #257.

## 7. Lacunas operacionais que permanecem abertas

Estas lacunas não devem ser mascaradas pela existência de código:

- comprovação de backup restaurável e teste periódico de restore;
- definição e teste de RTO/RPO por classe de recurso;
- evidência de alertas operacionais com responsáveis;
- evidência de tracing/correlação ponta a ponta;
- confirmação de ativação e coleta do Web Analytics no projeto de produção;
- confirmação operacional de cada novo deployment após releases; o deployment atualmente evidenciado já possui estado `READY` e smoke test registrado;
- procedimento operacional documentado para renovar/rotacionar credenciais externas;
- verificação de disponibilidade/resiliência em ambiente de produção.

## 8. Critério de fechamento da F6.21

A F6.21 pode ser considerada documentalmente consolidada quando cada capacidade operacional tiver:

- finalidade rastreável;
- implementação identificada;
- infraestrutura identificada;
- controle de identidade/segurança;
- sinal de observabilidade;
- caminho de deployment;
- caminho de recuperação;
- responsável operacional;
- dependências explícitas;
- Quality Gate correspondente;
- estado claramente classificado como verificado, externo ou pendente.

**Conclusão:** a matriz fecha a visão conhecida de implementação e operação, mas mantém como pendentes as capacidades externas ainda não exercitadas — especialmente backup/restore, RTO/RPO, DR, incident response, rollback real, alertas/métricas, Storage reconciliation e credential recovery. O deployment de produção atualmente evidenciado está separado dessas lacunas e não é usado como prova indevida de recovery.
