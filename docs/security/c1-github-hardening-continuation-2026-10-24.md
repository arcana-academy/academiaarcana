# SECURITY C1 (continuação) — Integridade do lockfile e hardening incremental do GitHub Free

Data: 2026-10-24 · Branch: `arena/151b639d-academiaarcana` · Base: `2b8c1829f03ce720b97752e07d2f64bd514445c6` (pós-#807)

Este documento **complementa** `docs/security/c1-github-hardening-2026-10-24.md` (PR #807, já
integrado à `main`). O relatório anterior cobre: matriz de configurações ativas (branch
protection/rulesets 403/ausentes, Actions perms 403, CodeQL advanced ativo, Dependabot ativo,
SECURITY.md/CODEOWNERS presentes), auditoria dos 19 workflows, varredura do histórico
(1.367 commits, sem segredos reais), bumps `fast-uri`/`undici`/`zod` e backlog administrativo
A1–A9. Nada disso é repetido aqui; abaixo estão apenas os achados **novos** desta sessão e as
correções aplicadas nesta branch isolada.

Nenhum recurso pago foi contratado. Nenhum merge, GHCR ou deploy foi executado. Mudanças
administrativas continuam **propostas, não aplicadas**.

## 1. Achados novos (não cobertos pelo #807)

### F1 — ALTA (corrigida): 373 entradas do lockfile sem `resolved`/`integrity`

- Evidência: `package-lock.json` na `main` (base `2b8c182`, já com os bumps do #807) possui
  **373 entradas** de pacotes sem os campos `resolved` e `integrity` (ex.: `zod` antes do bump,
  `@babel/*`, `@supabase/*`, `eslint`, `typescript`, `vitest`, `next` transitive deps).
- Impacto: sem `integrity`, o npm **não verifica o hash sha512** do tarball no install — a
  cadeia de suprimento fica sem verificação de integridade para esses pacotes; sem `resolved`,
  a URL de origem não fica fixada no lock. É uma lacuna silenciosa: `npm ci` instala
  normalmente e nenhum gate do repo falhava.
- Causa-raiz provável: edição/geração histórica do lock por ferramenta que omitiu os campos.
- O guard `scripts/verify-dependency-lifecycle-scripts.cjs` tinha um ponto cego: só rejeitava
  `resolved` presente com origem fora de `registry.npmjs.org`, ou `resolved` presente sem
  `integrity`. Entradas **sem nenhum dos dois** passavam.
- Correção aplicada (esta branch):
  1. **Cura cirúrgica do lockfile**: para cada uma das 373 entradas, `resolved`/`integrity`
     obtidos do metadata oficial `https://registry.npmjs.org/<pkg>/<version>` (`dist.tarball`,
     `dist.integrity`) e inseridos sem alterar mais nada. Diff vs. `main`: **746 inserções,
     0 remoções, 0 versões alteradas** (apenas os dois campos por entrada).
  2. **Guard endurecido**: entradas não-`link` sem `resolved`/`integrity` agora falham o
     verify (fail-closed); origem continua restrita a `registry.npmjs.org`.
- Verificações: `npm install --package-lock-only` com o npm canônico **11.19.1** é
  **byte-idempotente** sobre o lock curado (nenhuma reescrita); `npm ci --ignore-scripts`
  completa com sucesso (o npm valida o sha512 de **todos** os tarballs contra o lock curado);
  diff semântico vs. `main` = exclusivamente adição de `resolved`/`integrity`; teste negativo
  do novo guard contra o lock da `main` → `exit 1` com
  `Dependency entry is missing resolved or integrity metadata: node_modules/@adobe/css-tools`.

### F2 — MÉDIA (corrigida): `scorecard.yml` com `permissions: read-all` no nível do workflow

- O job `analysis` já declara permissões explícitas (override completo), mas o bloco
  workflow-level `read-all` concederia leitura ampla a qualquer job futuro sem bloco próprio.
- Correção: `permissions: contents: read` explícito no nível do workflow (menor privilégio;
  comportamento do job atual inalterado). Nenhum `read-all`/`write-all` resta nos 19
  workflows; `scripts/verify-supply-chain-workflows.cjs` continua PASS.

### F3 — BAIXA (corrigida): warnings de lint alimentando o loop do autofix.ci

- `src/proxy.test.ts` usa parâmetros de mock prefixados com `_` (convenção de
  "intencionalmente não usado"), mas o ESLint do repo não configurava `argsIgnorePattern`,
  gerando 3 warnings persistentes (`_request`, `_headers`, `_options`) — visíveis nas
  anotações dos runs do Quality Gate/autofix e associados ao ciclo de commits de bot que
  culminou em `refusing to patch repeated bot commits` no PR #761 (falha reproduzida do
  autofix.ci; a falha de E2E daquele PR é específica daquela branch — `main` está verde).
- Correção: regra `@typescript-eslint/no-unused-vars` (severidade `warn`, inalterada) com
  `argsIgnorePattern/varsIgnorePattern/caughtErrorsIgnorePattern/destructuredArrayIgnorePattern: "^_"`
  **apenas** para `src/**/*.{test,spec}.{ts,tsx}`. Resultado local: lint **0 erros, 0 avisos**.

### F4 — BAIXA (corrigida): `Dockerfile` fora da cobertura do Dependabot

- `dependabot.yml` cobria `npm` e `github-actions`, mas não o ecossistema `docker`
  (`FROM node:24-bookworm-slim` no `Dockerfile`).
- Correção: entrada `package-ecosystem: docker` (semanal, limite 2 PRs). O Dependabot
  existente foi **preservado** (nenhuma alteração nas entradas npm/github-actions).

### F5 — INFORMATIVA: guard de build fail-closed demonstrado em execução real

- `scripts/security/assert-build-secret-isolation-536.cjs` recusou corretamente o build neste
  sandbox ao detectar **por nome** (`GH_TOKEN`, `GITHUB_TOKEN`) variáveis com credenciais no
  ambiente; nenhum valor foi inspecionado ou logado. Build só prosseguiu com ambiente saneado.

### F6 — INFORMATIVA: push protection provavelmente ativo por padrão (confirmar — 403)

- Repo público de conta pessoal criado em **2026-08-30**, após o default-on de secret scanning
  + push protection para novos repositórios públicos (changelog GitHub 2024-03-11). A leitura
  via API segue `403` (token sem escopo admin) → manter A5 do relatório anterior: confirmar em
  Settings → Code security and analysis. Gitleaks (PR/push/cron diário, histórico completo)
  permanece como controle compensatório.

### F7 — FALHA REPRODUZIDA (fora de escopo desta branch): Production Smoke na `main`

- Runs `40028657326` (21:41Z) e `40030992403` (22:02Z) de 2026-10-23 falharam no step
  `Check health endpoint`: a produção (Render) não serviu o SHA esperado dentro da janela de
  polling. Não reproduzível neste sandbox (sem rota para `academiaarcana.onrender.com`);
  nenhuma ação de deploy foi executada (proibido no escopo). O PR aberto **#802**
  (`fix(deploy): stop gating the Render promotion on the post-de…`) já trata o gating de
  promoção; registrar aqui apenas para rastreabilidade. **BLOCKED**.

## 2. Configurações ativas — re-verificação nesta sessão (delta vs. #807)

| Superfície | Evidência (API, 2026-10-24) | Estado |
| --- | --- | --- |
| Rulesets | `GET /rulesets` → `[]`; `GET /rules/branches/main` → `[]` | **FAIL** (nada vigora) → A1 |
| Branch protection clássica | `GET /branches/main/protection` → `403` | **BLOCKED** → A1 |
| Actions permissions | `GET /actions/permissions{,/workflow,/selected-actions}` → `403` | **BLOCKED** → A2/A3 |
| CodeQL | advanced setup ativo (`codeql.yml`, JS/TS + `actions`, PR/push/semanal); runs recentes `success` na `main` | **PASS** (manter; não habilitar default setup — A9) |
| Code scanning default setup | `GET /code-scanning/default-setup` → `403` | **BLOCKED** (leitura), irrelevante se A9 mantido |
| Dependabot | `Dependabot Updates` runs `success` + PR #757 aberto; agora também `docker` (F4) | **PASS** |
| Dependabot alerts/security updates | `GET /dependabot/alerts` → `403` | **BLOCKED** → A4 |
| Secret scanning/push protection | `GET /secret-scanning/alerts` → `403`; default-on provável (F6) | **BLOCKED** → A5 |
| SECURITY.md | `isSecurityPolicyEnabled: true` (GraphQL); `securityPolicyUrl` ativo | **PASS** |
| CODEOWNERS | `.github/CODEOWNERS` presente; dono `@arcana-academy` = usuário dono do repo (válido); enforcement depende de A1 | **PASS** (arquivo) / **BLOCKED** (enforcement) |
| Environments | 13; `Production`/`Preview` sem protection rules; ~11 órfãos por PR; **`render-production-approval` (referenciado em `image-release.yml`) NÃO existe** | **FAIL** → A7/A8/**A10** |
| Visibilidade | público, não arquivado, default branch `main` | **PASS** (elegível a todos os recursos gratuitos) |

## 3. Testes executados nesta branch (Node 22.22.3 no sandbox; CI usa Node 24)

| Verificação | Resultado |
| --- | --- |
| `npm audit` (full) e `npm audit --omit=dev` sobre o lock curado | **PASS** — 0 vulnerabilidades |
| `npm ci --ignore-scripts` (valida sha512 de todos os tarballs contra o lock curado) | **PASS** |
| `npm install --package-lock-only` com npm 11.19.1 (idempotência do lock curado) | **PASS** — byte-idêntico |
| `verify-dependency-lifecycle-scripts.cjs` (endurecido) vs. lock curado | **PASS** |
| Teste negativo do guard vs. lock da `main` (373 entradas sem metadata) | **PASS** — falha como projetado (`exit 1`) |
| `verify-supply-chain-workflows.cjs` (19 workflows, pós-mudanças) | **PASS** |
| `verify-canonical-infrastructure.cjs` / `verify-deployment-platform.cjs` | **PASS** |
| `assert-build-secret-isolation-536.cjs` (positivo em ambiente saneado; negativo com `GH_TOKEN` presente) | **PASS** nos dois sentidos |
| ESLint (todo o repo) | **PASS** — 0 erros, **0 avisos** (eram 3 na base) |
| `tsc --noEmit` | **PASS** |
| Vitest (unit + a11y) | **PASS** — 196 arquivos, **1085/1085** testes |
| `next build --webpack` (produção, env sintético do CI, ambiente saneado) | **PASS** — build completo com tabela de rotas |
| Playwright E2E | **BLOCKED** no sandbox (download de navegadores fora do allowlist) → executado pelo Quality Gate canônico no PR |
| `docker build` + smoke de contêiner | **BLOCKED** no sandbox (sem Docker) → executado pelo Quality Gate canônico no PR |
| Leitura de branch protection/Actions/secret-scanning/Dependabot alerts | **BLOCKED** — `403` (token sem escopo admin) → §4 |

## 4. Pendências administrativas (NÃO aplicadas — requerem autorização explícita)

Mantêm-se **A1–A9** do relatório anterior (`c1-github-hardening-2026-10-24.md` §5), com os
seguintes acréscimos/ajustes:

- **A10 — Criar o environment `render-production-approval` ANTES do primeiro image release.**
  `image-release.yml` referencia `environment: render-production-approval`, que **não existe**
  no repo; na primeira execução ele seria auto-criado **sem nenhuma protection rule**, anulando
  o gate de aprovação humana do deploy. Criar com *required reviewers* e *deployment branches*
  restrito à `main` (Settings → Environments → New environment, ou
  `gh api -X PUT repos/arcana-academy/academiaarcana/environments/render-production-approval`
  com `prevent_external_reviewers` e `deployment_branch_policy` configurados na UI).
- **A11 — Confirmar push protection** (F6): Settings → Code security and analysis →
  *Secret scanning* e *Push protection* ativos; validar depois com
  `gh api repos/arcana-academy/academiaarcana/secret-scanning/alerts` (com token admin).
- **A12 — (Opcional) Conceder ao GitHub App usado pelas sessões automatizadas os escopos de
  leitura `Administration`, `Secret scanning alerts`, `Dependabot alerts` e `Code scanning
  alerts`**, para que futuras auditorias C1 não tenham superfícies `BLOCKED` por 403.
- **A13 — (Opcional, policy) Avaliar** `fail-on-severity: moderate` no `dependency-review.yml`
  e `--audit-level=moderate` no `quality.yml`: hoje um moderate de **produção** (como era o
  `fast-uri`) passa despercebido pelos gates. Mudança de policy nos workflows canônicos —
  **proposta, não aplicada**.
- **A14 — (Opcional, supply chain) Fixar a base do `Dockerfile` por digest**
  (`node:24-bookworm-slim@sha256:…`) com atualização via Dependabot (ecossistema `docker`
  agora habilitado por F4) — proposta, não aplicada, para não congelar patches de forma
  inadvertida antes de decisão do time.

## 5. Arquivos alterados nesta branch

- `package-lock.json` — cura de integridade: `resolved`+`integrity` restaurados em 373
  entradas a partir do registry oficial (746 inserções, 0 remoções, 0 mudanças de versão).
- `scripts/verify-dependency-lifecycle-scripts.cjs` — guard endurecido (fail-closed para
  metadata de integridade ausente; entradas `link` explicitamente isentas).
- `.github/workflows/scorecard.yml` — `permissions: read-all` → `contents: read` (least
  privilege explícito no nível do workflow).
- `eslint.config.mjs` — convenção `_` para bindings intencionalmente não usados em testes.
- `.github/dependabot.yml` — novo ecossistema `docker` (Dockerfile); npm/github-actions intactos.
- `docs/security/c1-github-hardening-continuation-2026-10-24.md` — este relatório.
