# SECURITY C2 — Execução administrativa + convergência Dependabot (evidências)

Data: 2026-10-24 · Branch: `arena/8e4818d1-academiaarcana` · Base: `8ae161b` (`main` pós-#811/#816)

Autorização: o prompt C2 do owner autorizou explicitamente **aplicar** as pendências
administrativas A1–A11 com token admin e **fechar o PR #813**. Regras respeitadas: nenhum
merge de PR (além do autorizado #813 → fechado, não mergeado), nenhum GHCR/deploy, nenhum
recurso pago, nenhum valor sensível transcrito. Itens que o token disponível não permitiu
foram registrados como **BLOCKED** com a evidência da chamada (código HTTP) e o comando exato
para o owner executar — nada foi presumido como aplicado.

## 1. Capacidade real do token (descoberta-chave desta sessão)

O token das sessões automatizadas é uma **instalação de GitHub App** cujo *role* no repo é
admin (`permissions.admin: true` no payload do repo) — foi capaz de mergear o #811 com
`--admin` — mas a instalação **não possui os escopos de permissão** `Administration`,
`Dependabot alerts`, `Secret scanning alerts`, `Code scanning alerts`, `Actions` (write) e
`Environments/Deployments` (write). Resultado: toda mutação administrativa retorna
`403 Resource not accessible by integration`.

**Consequência:** A12 (ajustar as permissões da instalação do App) é **pré-requisito** para
executar A1–A8 via API em sessões futuras. Procedimento: GitHub → Settings → Applications →
GitHub Apps → (app da integração) → Repository permissions → marcar:
`Administration: Read & write`, `Dependabot alerts: Read & write`, `Environments: Read &
write`, `Secret scanning alerts: Read`, `Code scanning alerts: Read`, `Actions: Read & write`
(mínimo necessário para este backlog).

## 2. Matriz antes/depois por item (A1–A14)

| Item | Chamada executada (2026-10-24 ~16:45–16:55 UTC) | HTTP | Estado |
| --- | --- | --- | --- |
| A1 leitura | `GET /branches/main/protection` | `403` | BLOCKED |
| A1 alternativo | `POST /rulesets` (payload completo em `docs/security/rulesets/main-c2-hardening.json`) | `403` | BLOCKED |
| A2 | `PUT /actions/permissions` `{enabled:true, allowed_actions:"all"}` (fase 1 não-disruptiva) | `403` | BLOCKED |
| A2b | `PUT /actions/permissions/workflow` `{default_workflow_permissions:"read", can_approve_pull_request_reviews:false}` | `403` | BLOCKED |
| A4 | `PUT /vulnerability-alerts` | `403` | BLOCKED |
| A4b | `PUT /automated-security-fixes` | `403` | BLOCKED |
| A5/A11 | `PATCH /repos/{o}/{r}` `{security_and_analysis:{secret_scanning:enabled, secret_scanning_push_protection:enabled}}` | `403` | BLOCKED |
| A6 | `GET /actions/secrets`, `GET /actions/variables` | `403` | BLOCKED |
| A7 | `PUT /environments/Production`, `PUT /environments/Preview` (reviewers + branch policy) | `403` | BLOCKED |
| A8 | `DELETE /environments/<órfão>` (probe com 1 dos 20) | `403` | BLOCKED |
| A10 | `PUT /environments/render-production-approval` (reviewer owner + `protected_branches`) | `403` | BLOCKED — environment continua **inexistente** (listagem: 24 environments, nenhum com esse nome) |
| A9 | (sem mutação) CodeQL advanced ativo: run `push` na `main` 16:34Z `success`; checks do PR verdes | `200` | **PASS — mantido** |
| A13 | proposta (diff abaixo), **não aplicada** | — | PROPOSTA |
| A14 | proposta; aplicação impossível do sandbox (Docker Hub fora do allowlist de rede) | — | PROPOSTA/BLOCKED |
| F4-C2 | `.github/dependabot.yml`: `ignore` de major para `node` no ecossistema `docker` | — | **APLICADO nesta branch** |
| #813 | `gh pr close 813` com justificativa de política Node 24 | `200` | **APLICADO (fechado)** |

### Evidências indiretas da proteção clássica da `main` (A1 — leitura 403, mas comportamento observado)

1. `reviewDecision: REVIEW_REQUIRED` no #811 (GraphQL) ⇒ **required reviews ≥ 1 ativo**.
2. Erro de merge `the head branch is not up to date with the base branch` ⇒ **strict required
   status checks ativo**.
3. `gh pr merge 811 --squash --admin` **funcionou** ⇒ **`enforce_admins: false`** (admin
   contorna a proteção) — registrado conforme solicitado.
4. `GET /rulesets` → `[]` e `GET /rules/branches/main` → `[]` ⇒ a proteção vem **só** de
   branch protection clássica; não há rulesets.

### Comandos prontos para o owner (copiar/colar; exigem token admin)

```bash
R=repos/arcana-academy/academiaarcana

# A1 — ruleset equivalente (recomendado; empilha com a clássica; payload revisado:
# CODEOWNERS review, 6 contextos canônicos verificados nos runs reais, admin bypass preservado)
gh api -X POST $R/rulesets --input docs/security/rulesets/main-c2-hardening.json

# A2/A3 — Actions: 3 passos (ordem importa: allowlist antes de ativar "selected")
gh api -X PUT $R/actions/permissions/selected-actions --input - <<'JSON'
{"github_owned_allowed":true,"verified_allowed":true,
 "patterns_allowed":["actions/*","github/codeql-action","step-security/*","gitleaks/*",
                     "ossf/*","supabase/*","erayaha/*","autofix-ci/*"]}
JSON
gh api -X PUT $R/actions/permissions -f enabled=true -f allowed_actions=selected
gh api -X PUT $R/actions/permissions/workflow \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false
gh api $R/actions/permissions && gh api $R/actions/permissions/selected-actions  # verificar

# A4 — Dependabot alerts + security updates + triagem
gh api -X PUT $R/vulnerability-alerts
gh api -X PUT $R/automated-security-fixes
gh api "$R/dependabot/alerts?state=open" --jq '.[].security_advisory.summary'

# A5/A11 — secret scanning + push protection (repo público criado 2026-08-30 ⇒ default-on
# provável; PATCH é idempotente) e verificação
gh api -X PATCH $R --input - <<'JSON'
{"security_and_analysis":{"secret_scanning":{"status":"enabled"},
                          "secret_scanning_push_protection":{"status":"enabled"}}}
JSON
gh api "$R/secret-scanning/alerts?per_page=5"

# A10 — environment do deploy de produção (ANTES de qualquer image release)
gh api -X PUT $R/environments/render-production-approval --input - <<'JSON'
{"wait_timer":0,"prevent_external_reviewers":false,
 "reviewers":[{"type":"User","id":322877937}],
 "deployment_branch_policy":"protected_branches"}
JSON

# A6 — inventário (nomes e datas; valores NUNCA são expostos pela API)
gh api $R/actions/secrets   --jq '.secrets[]   | [.name,.created_at,.updated_at] | @tsv'
gh api $R/actions/variables --jq '.variables[] | [.name,.created_at,.updated_at] | @tsv'
# rotação RENDER_*: comparar updated_at com a data de criação; rotacionar se > 90 dias

# A7 — protection rules nos environments legados
gh api -X PUT $R/environments/Production --input - <<'JSON'
{"reviewers":[{"type":"User","id":322877937}],"deployment_branch_policy":"protected_branches"}
JSON
gh api -X PUT $R/environments/Preview --input - <<'JSON'
{"reviewers":[{"type":"User","id":322877937}],"deployment_branch_policy":"all"}
JSON

# A8 — limpar os 20 environments órfãos por PR (mantém github-pages/Production/Preview/render-production-approval)
gh api "$R/environments?per_page=100" --jq '.environments[].name' \
  | grep -- ' - academiaarcana PR #' | while IFS= read -r name; do
      enc=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=''))" "$name")
      gh api -X DELETE "$R/environments/$enc"
    done
```

## 3. Dependabot — convergência aplicada nesta branch

- **`dependabot.yml` (ecossistema `docker`)**: adicionado `ignore` para `node` com
  `update-types: [version-update:semver-major]`. Política: runtime Node **24.x**
  (`engines`/`devEngines` com `onFail: error`, `.nvmrc`, devcontainer, `Dockerfile`);
  major da base vira decisão manual coordenada. Ecossistema `docker` permanece ativo
  (minor/patch continuam cobertos).
- **PR #813** (`node 24-bookworm-slim → 25-bookworm-slim`): **FECHADO** com justificativa
  pública apontando a ignore rule e o procedimento de migração manual de major.

## 4. Triagem dos PRs Dependabot abertos (nenhum mergeado)

| PR | Conteúdo | CI | Risco | Recomendação |
| --- | --- | --- | --- | --- |
| **#815** | Grupo github-actions (5 pins): `codeql-action v4.38.3→v4.39.1`, `harden-runner v2.22.1→v2.22.2`, `setup-node v7.0.0→v7.1.0` (unifica o SHA duplo do repo) — 9 workflows, comentários de versão preservados | 18 pass / **1 fail** = `Start local Supabase` (step de infra do Friend Request; steps dos actions bumpados ✓; rerun negado ao token — `403`) | **BAIXO** (minor/patch de pins) | Owner: `gh run rerun 40112576216 --failed`; após verde + rebase (strict), **mergear primeiro** |
| **#757** | Grupo dev-deps (lock+manifest) | **17 pass / 0 fail** | **BAIXO-MÉDIO**; `mergeStateStatus: BEHIND` (diverged 4×); lock gerado antes da cura #811 — o diff não remove as 373 entradas curadas (verificado: `MERGEABLE` sem conflito), mas **rebase é obrigatório** (strict) | Comentar `@dependabot rebase`; após verde, **mergear em segundo** |
| **#814** | `@honeybadger-io/nextjs 5.11.6→6.0.4` (**major**) | **2 fail**: Quality Gate + Isolated Auth/RLS | **ALTO** (breaking em runtime de observabilidade usado em `next.config.ts`/middleware) | **Não mergear**; exige adaptação de `honeybadger.*.config.*` + testes (há suíte dedicada `honeybadger.config.test.*`) |
| **#692** | `@vitejs/plugin-react 5.2.0→6.1.2` (**major**, dev) | **3 fail**: Quality Gate + RLS + autofix | **MÉDIO** (dev-only, mas quebra gates) | **Não mergear** sem adaptação da config do vitest |
| **#694** | `actions/download-artifact 4.3.0→8.0.2` (**major**) em `image-release.yml` + `production-smoke.yml` | 16 pass / 0 fail — **porém o CI de PR não exercita esses steps** (rodam só em `workflow_run`/`dispatch`) | **ALTO apesar do verde** (canônicos de release; validação real impossível via PR) | **Segurar**; validar via `workflow_dispatch` controlado do production-smoke após A10; considerar fechar se #815 evoluir a action em grupo |

Ordem recomendada: **#815 → #757 → (adaptações) #814/#692 → #694 por último, com validação manual**.

## 5. Propostas não aplicadas (A13/A14 — aguardando OK)

### A13 — política de severidade dos gates (diff proposto, NÃO aplicado)

```diff
--- .github/workflows/dependency-review.yml
-          fail-on-severity: high
+          fail-on-severity: moderate
--- .github/workflows/quality.yml
-        run: npm audit --omit=dev --audit-level=high
+        run: npm audit --omit=dev --audit-level=moderate
```

Justificativa: o `fast-uri` (moderate, **produção**, pré-#807) passava despercebido pelos dois
gates. Contraponto: moderate dev-only pode aumentar bloqueios de PR; decidir em conjunto com a
política de grupos do Dependabot.

### A14 — pin da base do Dockerfile por digest (aplicação BLOCKED no sandbox)

`docker buildx imagetools inspect`/`crane digest` exigem `registry-1.docker.io`, fora do
allowlist de rede desta sessão. Procedimento para aplicação (owner ou sessão com rede):

```bash
DIGEST=$(docker buildx imagetools inspect node:24-bookworm-slim --format '{{json .Manifest}}' | jq -r '.digest')
# Dockerfile (2 linhas FROM):
#   FROM --platform=linux/amd64 node:24-bookworm-slim@${DIGEST} AS builder
#   FROM --platform=linux/amd64 node:24-bookworm-slim@${DIGEST} AS runtime
```

O ecossistema `docker` do Dependabot (ativo desde o C1, agora com ignore de major) atualiza
digests automaticamente. Aplicar somente com os gates verdes (Quality Gate já exercita
`docker build` + smoke de contêiner a cada PR).

## 6. Testes nesta branch

| Verificação | Resultado |
| --- | --- |
| `verify-supply-chain-workflows.cjs` (19 workflows) | **PASS** |
| `verify-dependency-lifecycle-scripts.cjs` (lock curado) | **PASS** |
| `verify-canonical-infrastructure.cjs` / `verify-deployment-platform.cjs` | **PASS** |
| Sanidade do `dependabot.yml` (3 ecossistemas + bloco ignore) | **PASS** |
| `npm audit` (full/prod), `npm ci`, lint, tsc, vitest, build | **inalterados** — lock/manifest não tocados nesta branch; última evidência: #811 CI all-green + `main` push 16:34Z all-green |
| Mutação administrativa via API (A1–A8, A10) | **BLOCKED** — `403` (12 chamadas documentadas na §2) |
| Rerun de job (#815) | **BLOCKED** — `403` (sem `actions:write`) |
| A14 aplicar digest | **BLOCKED** — rede do sandbox sem Docker Hub |

## 7. Arquivos alterados nesta branch

- `.github/dependabot.yml` — ignore de major para `node` (ecossistema docker).
- `docs/security/rulesets/main-c2-hardening.json` — payload A1 pronto para `gh api --input`.
- `docs/security/c2-admin-execution-2026-10-24.md` — este relatório.

Ações externas: PR **#813 fechado** (autorizado); nenhum outro PR alterado/mergeado.

## 8. Pendências remanescentes

1. **A12 (pré-requisito)**: ampliar permissões da instalação do GitHub App (§1) — sem isso,
   A1–A8/A10 seguem BLOCKED via API.
2. Executar os comandos da §2 (owner) ou reexecutar C2 com token de escopo admin.
3. Decidir A13/A14 (§5).
4. Seguir a ordem de merges da §4 (rerun do #815 é o primeiro desbloqueio).
5. Production Smoke: monitorar run 16:41Z na `main` e o PR #802 (deploy, fora do escopo C2).
