# AA-SPEC-F6 — Infraestrutura e operação: estado verificado e lacunas

**Projeto:** Academia Arcana
**Série de origem:** issues F6.1 – F6.19 e #268 (Operational Evidence)
**Estado:** canônico para a série F6 **aberta**
**Regra central deste documento (herdada de #268):**

> documentação não é evidência de execução.

Estados usados: **VERIFIED** (evidência reproduzível, datada e vinculada a commit/recurso),
**DOCUMENTED** (contrato escrito, sem prova de execução), **EXTERNAL** (depende de ação em provedor ou de
decisão humana — não pode ser fechado por agente).

Já encerrados antes desta revisão: F6.15 (#187/#188), F6.16, F6.20 (#193), F6.21 (#194), F6.14 (#185).
Runbooks existentes: `docs/superpowers/reports/f6-13…f6-21-*.md`.

---

## F6.1 — Princípios e estratégia de infraestrutura · #171

Infraestrutura serve ao produto. Stack verificada: Next.js 16 no Render (Free, Ohio), Supabase (auth + dados),
GitHub Actions (CI), GHCR (imagens), Honeybadger (erro). Nenhum serviço pago é pré-requisito.
**Estado:** **DOCUMENTED** → fechável como definição (seção canônica).

## F6.2 — Ambientes e configuração · #172

Ambientes: `local`, `preview`, `production`. Configuração por ambiente em `.env.example` (único versionado),
`render.yaml` (produção) e GitHub Environments (`Production`, `Preview`). Guardas:
`verify-public-runtime-config.mjs`, `verify-deployment-platform.cjs`, `verify-canonical-infrastructure.cjs`.
Sem proteção por revisores nos environments — pendência administrativa A7/A8 de
`docs/security/c1-github-hardening-2026-10-24.md`.
**Estado:** **DOCUMENTED** (config) + **EXTERNAL** (protection rules).

## F6.3 — Banco e persistência · #173

PostgreSQL 17 via Supabase; 22 migrações versionadas; RLS em todas as tabelas de domínio; pgTAP em 17 suítes;
plano Free **sem backup automático** (`docs/superpowers/reports/f6-13-backup-recovery-runbook.md`).
**Estado:** **DOCUMENTED**; backup verificado é **EXTERNAL**.

## F6.4 — Storage e arquivos · #174

Bucket `storage.grimoire-covers` (owner `learning`) com políticas em
`20260928190328_grimoire_covers_storage.sql` e `20261021201427_restrict_grimoire_cover_move_folder.sql`;
teste `grimoire_covers_storage_rls.test.sql`. Sem CDN/transformação de imagem gerenciada.
**Estado:** **VERIFIED** (RLS testada em banco local).

## F6.5 — Filas, jobs e workers · #175

Não existem. Nenhum worker, fila ou scheduler de aplicação. **Estado:** **DOCUMENTED** como ausência
deliberada; qualquer necessidade futura exige ADR.

## F6.6 — Eventos e mensageria · #176

Não existe broker. Eventos são contrato (`AA-SPEC-F1` §F1.15). **Estado:** **DOCUMENTED** (ausência).

## F6.7 — Integrações externas · #177

OAuth por provedor (asana, github, notion, outlook, microsoft-sharepoint, todoist, trello), credenciais em
`integration_credentials` com RLS e revoke; fontes documentais externas isoladas;
`/api/integrations/status`; allowlist de provedor. **Estado:** **VERIFIED** (testes de privilégio + E2E).

## F6.8 — Autenticação e identidade operacional · #178

Supabase Auth; sessão validada em `src/proxy.ts` antes do shell; rotas privadas negadas antes do streaming
(PR #808); exercício de revogação de sessão em `local-auth-revocation.yml`.
Proteção de senha vazada permanece `WARN/EXTERNAL` no Security Advisor (rastreado em #31).
**Estado:** **VERIFIED** local; item de senha vazada é **EXTERNAL**.

## F6.9 — Segurança de infraestrutura · #179

CSP com nonce e Report-Only em dev; cabeçalhos; pinagem de actions por SHA; `pull_request_target` proibido;
`persist-credentials: false`; harden-runner; gitleaks; codeql; dependency review; scorecard.
**Estado:** **VERIFIED** no repositório; permissões de Apps e branch protection são **EXTERNAL**
(#534/#537).

## F6.10 — Secrets e gestão de credenciais · #181

`src/infrastructure/runtime-secrets.ts` prefere `/etc/secrets/<KEY>`; fallback de env só para migração/local;
`assert-build-secret-isolation-536.cjs` no `prebuild`; contrato CI
`build-secret-isolation-contract-536.yml`.
**Estado:** **VERIFIED** no repositório; migração no Render é **EXTERNAL** (#536).

## F6.11 — Observabilidade e monitoramento · #182

Existe: `/api/health`, `/api/ready`, Production Smoke, Honeybadger.
Não existe: métricas, SLO, alertas, dashboards. **Estado:** **DOCUMENTED**; lacuna `GAP-F6-11`.

## F6.12 — Logs, métricas e tracing · #183

Logs de plataforma (Render) e eventos de erro (Honeybadger). Sem tracing distribuído, sem retenção
declarada de logs, sem correlação de requisição. **Estado:** **DOCUMENTED**; lacuna `GAP-F6-12`.

## F6.13 — Backups e recuperação · #184

Runbook completo em `docs/superpowers/reports/f6-13-backup-recovery-runbook.md`; export lógico off-site,
roles/schema/data separados, retenção, checksum, restore de teste.
Prova de execução: **ausente** (plano Free, sem backup automático; nenhum dump versionável permitido).
**Estado:** **DOCUMENTED** — **não fechável** sem exercício de restore datado (rastreado em #268).

## F6.14 — Resiliência e disponibilidade · #186

Runbook: `f6-14-resilience-availability-runbook.md`. Disponibilidade real de produção não é medida por SLO;
sem redundância multi-AZ contratada; dependência de um único serviço Render.
**Estado:** **DOCUMENTED**; #185 (duplicata anterior) permanece a referência histórica fechada.

## F6.17 — Disaster Recovery e continuidade · #190

Runbook: `f6-17-disaster-recovery-continuity.md`; custódia OCI independente com dois digests é a dependência
**EXTERNAL** rastreada em #594. **Estado:** **DOCUMENTED** / **EXTERNAL**.

## F6.18 — Operação, incidentes e resposta · #191

Runbook: `f6-18-operations-incidents-response.md`. Não há plantão, canal de incidente formal, SLA ou
postmortem registrado. **Estado:** **DOCUMENTED**; lacuna `GAP-F6-18` (organizacional).

## F6.19 — Gestão de mudanças e configuração operacional · #192

Runbook: `f6-19-change-configuration-operational.md`. Aplicado: mudança por PR, CODEOWNERS nas superfícies
sensíveis, revisão obrigatória, reversão por `git revert`, migrações imutáveis após aplicação.
Exceção: nenhum registro formal de aprovação de mudança para deploys (depende de Release humano).
**Estado:** **DOCUMENTED**; lacuna de registro formal `GAP-F6-19`.

---

## #268 — Operational Evidence

`docs/superpowers/reports/operational-evidence-baseline.md` fixa a regra: capacidade só migra para
VERIFIED com evidência reproduzível. Nenhuma capacidade de F6.13–F6.20 foi promovida a VERIFIED desde então.
Este documento não promove nenhuma: apenas alinha o mapa.
**Estado:** permanece aberta como rastreador por decisão do próprio documento de baseline.

---

## Resumo de estados

| Item | Estado | Fechável por agente? |
|---|---|---|
| F6.1, F6.2, F6.3, F6.5, F6.6 | DOCUMENTED | não (config/ambiente externo no caso de F6.2) |
| F6.4, F6.7, F6.8, F6.9, F6.10 | VERIFIED (repo/local) | não quando o critério exige prova em produção |
| F6.11, F6.12 | DOCUMENTED + lacuna | não |
| F6.13, F6.14, F6.17, F6.18, F6.19 | DOCUMENTED / EXTERNAL | não |
| #268 | rastreador | não |

Nenhum item F6 desta lista é fechado nesta entrega, exceto duplicatas explícitas.
