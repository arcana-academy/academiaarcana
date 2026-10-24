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
| Branch protection `main` | `GET /branches/main/protection` → `403` (sem escopo admin) | **BLOCKED** → pendência A1 |
| Rulesets | `GET /repos/.../rulesets` → `[]` (nenhum ruleset) | **FAIL** → pendência A1 |
| Regras aplicadas a `main` | `GET /rules/branches/main` → `[]` (nenhuma regra vigorando) | **FAIL** → pendência A1 |
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

**Correção aplicada nesta branch** (commit próprio): `package-lock.json` com bump cirúrgico
`fast-uri 3.1.8→3.1.9`, `undici 8.11.2→8.12.3`, `zod 4.6.4→4.6.7` (diff: 3 entradas de
pacote; `package.json` intacto). Dependabot permanece o canal canônico de updates — o PR
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

- **A1 — Proteção do `main` (crítico; hoje `main` não tem nenhuma regra).** Sugerido (regras
  clássicas, grátis):
  `gh api -X PUT repos/arcana-academy/academiaarcana/branches/main/protection -F 'required_status_checks[strict]=true' -F 'required_status_checks[contexts][]=Quality Gate' -F 'enforce_admins=true' -F 'required_pull_request_reviews[require_code_owner_reviews]=true' -F 'required_pull_request_reviews[required_approving_review_count]=1' -F 'restrictions=null' -F 'allow_force_pushes=false' -F 'allow_deletions=false'`
  (ou ruleset equivalente; exigir review de CODEOWNERS para `.github/`, lockfile e render.yaml).
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
