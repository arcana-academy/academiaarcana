# SECURITY C1 — Endurecimento do GitHub Free (evidências)

Data: 2026-10-24 · Branch: `arena/e7d2057e-academiaarcana` · Base: `9f902981fcd537a10ff8d6757379b450f656abf9`

Escopo: inspeção das configurações **realmente ativas** via API do GitHub (não presunção por
existência de arquivo), auditoria de workflows, dependências e histórico; correções de falhas
reproduzidas nesta branch isolada; pendências administrativas propostas **sem aplicação**.
Nenhum recurso pago foi contratado; nenhum merge/GHCR/deploy executado.

## 1. Metodologia

- Leituras via `gh api` (repo público `arcana-academy/academiaarcana`): branch protection,
  rulesets, regras aplicadas ao `main`, permissões de Actions, CodeQL, Dependabot, secret
  scanning, vulnerability alerts, secrets/variables, workflows, environments.
- O token desta sessão **não possui escopo admin** no repo: endpoints administrativos
  retornaram `403 Resource not accessible by integration` → estado marcado como **BLOCKED**
  e movido para pendências administrativas (§5). Nada foi presumido como ativo por existir arquivo.
- Varredura de segredos: 100% do histórico (`git rev-list --objects --all`, 1.367 commits,
  2.523 blobs únicos) com padrões de chaves de provedores, JWTs, chaves privadas e atribuições genéricas.
- Auditoria de dependências: `npm audit` (full e `--omit=dev`) sobre o `package-lock.json` canônico.
- Verificação com os guardas do próprio repo (`scripts/verify-*.cjs`) e suíte unitária.

## 2. Estado real inspecionado (evidências)

| Superfície | Evidência coletada | Estado |
| --- | --- | --- |
| Branch protection `main` | `GET /branches/main/protection` → `403` (sem escopo admin) | **BLOCKED** → pendência A1 · **retificado no §8**: proteção clássica EXISTE (review obrigatório) |
| Rulesets | `GET /repos/.../rulesets` → `[]` (nenhum ruleset) | ✅ confirmado — sem rulesets (proteção é clássica, ver §8) |
| Regras aplicadas a `main` | `GET /rules/branches/main` → `[]` (nenhuma regra **de ruleset** vigorando) | ✅ confirmado — endpoint cobre só rulesets; a proteção clássica não aparece nele (§8) |
| Permissões de Actions | `GET /actions/permissions`, `/permissions/workflow`, `/selected-actions` → `403` | **BLOCKED** → pendências A2/A3 |
| CodeQL | `GET /code-scanning/codeql/databases` → databases `javascript` e `actions` construídas pelo `codeql.yml` no HEAD `9f90298…`; workflow `CodeQL` ativo (PR, push, cron semanal) | **PASS** (advanced setup; default setup **não** habilitado para não duplicar) |
| Dependabot | `.github/dependabot.yml` (npm + github-actions, semanal, grupos); PRs abertos do bot (#757 dev-deps etc.); `dependabot/*` presente nos environments | **PASS** (preservado, sem alteração) |
| Dependabot alerts / security updates | `GET /dependabot/alerts`, `/automated-security-fixes`, `/vulnerability-alerts` → `403` | **BLOCKED** → pendência A4 |
| Secret scanning / push protection | `GET /secret-scanning/alerts` → `403` | **BLOCKED** → pendência A5 (grátis em repo público; gitleaks.yml existe como controle compensatório) |
| SECURITY.md | Existe na raiz, canal privado via Security area, sem dados sensíveis | **PASS** |
| CODEOWNERS | `.github/CODEOWNERS` cobre `/.github/`, `render.yaml`, lockfile e scripts de supply-chain; exigido por `verify-supply-chain-workflows.cjs` | **PASS** |
| Secrets/variables do repo | `GET /actions/secrets`, `/actions/variables` → `403` | **BLOCKED** (inventário pendente — A6) |
| Environments | `Production` e `Preview` **sem protection rules**; ~11 environments órfãos por PR (`arena/…`, `integration/…`, `fix/…`, `work/…`, `dependabot/…`) | **FAIL** → pendências A7/A8 |

## 3. Auditoria de workflows (19 arquivos no `main`)

- **PASS** — todas as actions pinadas a SHA completo de 40 hex (verificado por grep e por
  `scripts/verify-supply-chain-workflows.cjs`: 19/19 arquivos).
- **PASS** — `permissions:` top-level explícito em 100% dos workflows; permissões de escrita
  mínimas e justificadas: `security-events: write` (codeql.yml, scorecard.yml),
  `id-token: write` (scorecard.yml), `packages: write` (image-release.yml, atrás de
  proveniência de Quality Gate + `GHCR_PUBLISH_APPROVED_SHA` + verificação de main atual).
- **PASS** — `pull_request_target` ausente (proibido pelo guarda de supply-chain);
  `workflow_run` (image-release.yml, production-smoke.yml) validam repositório, branch,
  caminho do workflow, `run_attempt == 1`, conclusão e SHA de 40 hex — padrão fail-closed.
- **PASS** — `persist-credentials: false` em todos os `actions/checkout`; harden-runner
  presente nos workflows de varredura; nenhum `curl | bash`, `eval` ou download não verificado.
- **PASS** — triggers `pull_request` não referenciam segredos além de `GITHUB_TOKEN`
  (exigido pelo guarda); `RENDER_DEPLOY_HOOK_URL`/`RENDER_SERVICE_READ_API_KEY` usados só
  em job com `environment: render-production-approval` e dispatch manual.

## 4. Dependências e segredos

### 4.1 Vulnerabilidades reproduzidas (`npm audit` sobre o lockfile da base `9f90298`)

| Pacote | Versão na base | Severidade | Árvore | Advisories | Correção |
| --- | --- | --- | --- | --- | --- |
| `undici` | 8.11.2 | **high** | dev (via `jsdom`) | GHSA-4qv8-2p9j-2685, GHSA-f72v-6w45-q472, GHSA-xjj6-f33q-929c | 8.12.3 |
| `zod` | 4.6.4 | **high** | dev (peer de `eslint-plugin-react-hooks`) | GHSA-mrhx-c7xc-m3w5 | 4.6.7 |
| `fast-uri` | 3.1.8 | moderate | **prod** (via `ajv`) | GHSA-w74x-v6f9-j3xg, GHSA-xhq7-xmqj-769h, GHSA-wjr9-j795-jxcr, GHSA-333x-w4r6-6crp | 3.1.9 |

O gate canônico (`npm audit --omit=dev --audit-level=high` em quality.yml) **não** falhava
na base (altas eram dev-only; prod tinha só moderate) — corrigido mesmo assim nesta branch.
Os ranges em `package.json` já permitiam as versões corrigidas; apenas o lockfile mudou.

**Correção aplicada nesta branch** (commits próprios): `package-lock.json` com bump cirúrgico
`fast-uri 3.1.8→3.1.9`, `undici 8.11.2→8.12.3`, `zod 4.6.4→4.6.7` (diff vs. base: exatamente
3 versões; `package.json` intacto), regenerado com o npm canônico 11.19.1 para preservar os
metadados `libc`/`os`/`cpu` das 48 entradas de plataforma do lockfile. Dependabot permanece o canal canônico de updates — o PR
aberto #757 (grupo dev-deps) traria `undici ^8.12.1`, que **ainda está na faixa vulnerável**
(8.0.0–8.12.1); ao atualizar, o Dependabot convergirá para ≥8.12.2. Se #757 conflitar com
esta branch, preferir o lockfile que audita 0 vulnerabilidades.

### 4.2 Segredos no histórico

- 2.523 blobs únicos varridos no histórico completo: **nenhuma chave real** (AWS, GitHub
  token, Supabase secret/service-role, Slack, OpenAI, Google, chave privada, JWT).
- 25 achados de atribuição genérica, todos em testes/fixtures com valores sintéticos; o único
  em código não-teste é `autoComplete="current-password"` em `src/components/auth/AuthForm.tsx`
  (falso positivo confirmado).
- `.env.example`: somente placeholders. `.gitleaks.toml` permite apenas `sb_publishable_*`
  (credencial pública por design). Gitleaks roda em PR, push e cron diário.
- **PASS** — sem vazamento identificado; nenhum valor sensível foi transcrito neste relatório.

## 5. Pendências administrativas (NÃO aplicadas — requerem token admin/owner)

Confirmar/alterar só com autorização explícita. Comandos prontos:

- **A1 — Proteção do `main`.** RETIFICADO (§8): `main` já tem proteção clássica com review
  obrigatório (`reviewDecision: REVIEW_REQUIRED` no PR #807, merge só ocorreu com bypass
  admin). A ação correta é **completar** a proteção, não criá-la: com token admin, ler o
  estado atual (`GET /branches/main/protection`) e garantir required status checks
  (`Quality Gate`, strict), `enforce_admins`, CODEOWNERS review e `allow_force_pushes=false` /
  `allow_deletions=false`:
  `gh api -X PUT repos/arcana-academy/academiaarcana/branches/main/protection -F 'required_status_checks[strict]=true' -F 'required_status_checks[contexts][]=Quality Gate' -F 'enforce_admins=true' -F 'required_pull_request_reviews[require_code_owner_reviews]=true' -F 'required_pull_request_reviews[required_approving_review_count]=1' -F 'restrictions=null' -F 'allow_force_pushes=false' -F 'allow_deletions=false'`
  (preservando quaisquer campos já configurados).
- **A2 — Permissões de Actions:** restringir a *selected actions* (`actions/*` + criadores
  verificados + allowlist das actions já pinadas) e desabilitar "Allow GitHub Actions to
  create and approve pull requests":
  `gh api -X PUT repos/.../actions/permissions -f enabled=true -f allowed_actions=selected` e
  `.../actions/permissions/workflow -f default_workflow_permissions=read -f can_approve_pull_request_reviews=false`.
- **A3 — Verificar** `GET /actions/permissions` e `/selected-actions` após A2 (hoje 403).
- **A4 — Dependabot alerts + security updates:** confirmar ativados
  (`PUT /vulnerability-alerts`, `PUT /automated-security-fixes`) e revisar alertas abertos.
- **A5 — Secret scanning + push protection** (grátis em repo público): habilitar em
  Settings → Code security; depois validar `GET /secret-scanning/alerts`.
- **A6 — Inventariar** secrets/variables (`GET /actions/secrets`, `/actions/variables`) com
  token admin; conferir rotação de `RENDER_DEPLOY_HOOK_URL` e `RENDER_SERVICE_READ_API_KEY`.
- **A7 — Environments:** adicionar required reviewers em `Production`; avaliar protection
  rules em `Preview`.
- **A8 — Higiene:** remover os ~11 environments órfãos por PR (`arena/*`, `integration/*`,
  `fix/*`, `work/*`, `dependabot/*`) e os workflows registrados de branches antigos
  (C65–C108) que não existem no `main`.
- **A9 — CodeQL:** manter o advanced setup atual; **não** habilitar default setup (duplicaria).

## 6. Testes executados (nesta branch, com o lockfile corrigido)

| Verificação | Resultado |
| --- | --- |
| `node scripts/verify-supply-chain-workflows.cjs` (19 workflows) | **PASS** |
| `node scripts/verify-dependency-lifecycle-scripts.cjs` | **PASS** |
| `node scripts/verify-canonical-infrastructure.cjs` | **PASS** |
| `node scripts/verify-deployment-platform.cjs` | **PASS** |
| `node --test scripts/security/test-build-secret-isolation-536.test.cjs` (5 testes) | **PASS** |
| `npm ci --ignore-scripts` (lockfile corrigido) | **PASS** |
| `npm audit` (full e `--omit=dev`) | **PASS** — 0 vulnerabilidades |
| `npm test` (vitest) | **PASS** — 1085/1085 |
| `npm run typecheck` (tsc --noEmit) | **PASS** |
| `npm run lint` | **PASS** — 0 erros (3 avisos pré-existentes) |
| `npm run build`, E2E Playwright, database-tests (Supabase/Docker) | **BLOCKED** neste sandbox (Node 22 vs. devEngines 24.x, sem navegador/Docker); serão executados pelo Quality Gate canônico no PR |
| Branch protection / Actions perms / secret scanning / Dependabot alerts | **BLOCKED** — 403 (token sem escopo admin); ver §5 |

## 7. Arquivos alterados nesta branch

- `package-lock.json` — bumps de segurança (fast-uri, undici, zod).
- `docs/security/c1-github-hardening-2026-10-24.md` — este relatório.

## 8. C2 — Tentativa de aplicação A1–A9 (2026-10-24, pós-merge do PR #807)

O PR #807 foi mergeado em `main` como `2b8c1829f03ce720b97752e07d2f64bd514445c6` (squash,
com todos os gates verdes). A aplicação das pendências A1–A9 foi tentada com o token desta
sessão — que continua **sem privilégios administrativos** (`X-OAuth-Scopes` vazio; token
fine-grained de integração, expiração 2026-10-24 23:48 UTC).

### 8.1 Retificação importante (A1)

A afirmação original do §2 ("`main` não tem nenhuma regra") estava **parcialmente errada**.
Evidência nova: no PR #807, `reviewDecision = REVIEW_REQUIRED` e o merge comum foi recusado
("the base branch policy prohibits the merge"), exigindo bypass administrativo. Portanto
`main` **já possui branch protection clássica com review obrigatório** — os `GET` deste
token (403) e o `GET /rules/branches/main` (`[]`, que só enumera **rulesets**) não a exibem.
O dono do repo é uma conta de usuário (sem org → sem rulesets organizacionais). A1 muda de
"criar proteção" para "**completar a proteção existente**" (ler antes com token admin, para
não sobrescrever).

### 8.2 Matriz de aplicação (todas as operações retornaram 403; nada foi alterado)

| Item | Operação tentada (evidência) | Resultado |
| --- | --- | --- |
| A1 | `PUT /branches/main/protection` e `POST /rulesets` | **BLOCKED** — 403 |
| A2 | `PUT /actions/permissions` (`allowed_actions=selected`) e `PUT /actions/permissions/workflow` (`default_workflow_permissions=read`, `can_approve_pull_request_reviews=false`) | **BLOCKED** — 403 |
| A3 | `GET /actions/permissions` | **BLOCKED** — 403 |
| A4 | `PUT /vulnerability-alerts` e `PUT /automated-security-fixes` | **BLOCKED** — 403 |
| A5 | `PATCH /repos/...` com `security_and_analysis.secret_scanning{,_push_protection}=enabled` | **BLOCKED** — 403 |
| A6 | `GET /actions/secrets` e `GET /actions/variables` | **BLOCKED** — 403 |
| A7 | `PUT /environments/Production` (reviewer obrigatório: usuário `arcana-academy`, id 322877937) | **BLOCKED** — 403 |
| A8 | `DELETE /environments/arena%2F…PR%20%23799` (prova) | **BLOCKED** — 403 |
| A9 | `GET /code-scanning/codeql/databases` | **PASS** — `javascript` + `actions` ativos (advanced mantido; default setup não habilitado) |

### 8.3 Scorecard pós-endurecimento

- Run canônico no `main` pós-merge: **run 40108566017**, commit `2b8c182`, concluído
  **success** (12/12 steps; SARIF enviado ao code scanning e artefato `scorecard-results`
  gravado). Run anterior: 40029283125 em `9f90298`.
- `workflow_dispatch` manual: **BLOCKED** (403 — token sem `actions: write`).
- Pontuação numérica agregada: **BLOCKED neste sandbox** — os 4 canais de leitura estão
  inacessíveis daqui: artefatos (redirect p/ `blob.core.windows.net`), logs (redirect p/
  `results-receiver.actions.githubusercontent.com`), `api.scorecard.dev` (egress bloqueado)
  e `GET /code-scanning/analyses` (403). Para conferir: Security → Code scanning do repo,
  ou https://scorecard.dev/viewer/?uri=github.com/arcana-academy/academiaarcana.

### 8.4 O que é necessário para aplicar A1–A9

Reconectar o GitHub nesta sessão com token de **admin do repositório** (fine-grained com
*Administration: Read and write*, *Environments: Read and write*, *Secrets: Read*,
*Dependabot alerts: Read and write*, *Security events: Read*, *Actions: Read and write*),
ou executar os comandos do §5 localmente com `gh auth login` de uma conta admin. Nenhuma
mudança administrativa foi aplicada nesta sessão.
