# Auditoria de integridade do site — 2026-10-23

Registro técnico das correções aplicadas sobre a aplicação Next.js 16 (App Router) da Academia Arcana.
O objetivo foi encontrar recursos bloqueados, links quebrados, dependências desatualizadas, caminhos
incorretos e conteúdo de espaço reservado que impediam o funcionamento correto do site.

## Método

1. Leitura de `package.json`, `next.config.ts`, `src/proxy.ts`, CSP, layout raiz e rotas.
2. Instalação limpa (`npm ci`), `tsc --noEmit`, `eslint .`, `vitest run` e `next build --webpack`.
3. Execução real dos servidores de desenvolvimento e de produção e varredura de todas as rotas
   públicas/autenticadas com `curl` (status HTTP, tamanho, cabeçalhos e HTML).
4. Crawler de links internos a partir das páginas públicas + verificação HTTP de todos os links externos
   alcançáveis (domínios `github.com`).
5. Conferência de que todo caminho em `public/assets/**` referenciado no código existe em disco.
6. Revisão dos adaptadores de terceiros (Supabase, Todoist, Notion, Trello, Asana, Microsoft Graph,
   OpenAI Agents, Adobe Fonts, Relevise, DataCamp, Exa/Parallel, Honeybadger).

## Defeitos encontrados e correções aplicadas

### 1. CSP bloqueava todos os estilos inline (quebra visual em várias páginas)

`src/lib/security/csp.ts` declarava `style-src` com nonce, mas sem `style-src-attr`. Pela especificação
CSP, `style-src-attr` cai de volta em `style-src`; como a lista continha nonce e nenhum `'unsafe-inline'`,
todo atributo `style="…"` gerado por React era descartado pelo navegador. A página `/integracoes` sozinha
tem **524** atributos `style` — grades, espaçamentos e cores deixavam de ser aplicados.

Correção: diretiva dedicada `style-src-attr 'unsafe-inline'`, mantendo `style-src` com nonce para
elementos `<style>`/`<link>`. Atributos de estilo não aceitam nonce, portanto essa é a diretiva correta e
de menor privilégio.

O contrato de smoke de produção (`.github/workflows/production-smoke.yml`) proibia o token
`'unsafe-inline'` em qualquer posição do cabeçalho, o que passaria a falhar com essa correção. A
verificação foi reescrita para analisar diretiva por diretiva, mantendo (e reforçando) as garantias reais:

- `script-src` sem `'unsafe-inline'` e com nonce obrigatório;
- `'unsafe-eval'` proibido em qualquer diretiva;
- `style-src` sem `'unsafe-inline'` e com nonce obrigatório;
- `style-src-attr` deve conter `'unsafe-inline'` (necessário para props `style` do React).

Como a correção faz os estilos voltarem a ser aplicados, as capturas determinísticas de referência
(`tests/e2e/*baselines.json`) precisaram ser regeradas — elas registravam exatamente o layout com os
atributos `style` descartados. Foram atualizadas 55 entradas (40 temas do design system, Cronograma, Foco,
superfícies de prova e Estatísticas) a partir das hashes impressas pelo próprio Playwright na execução do
Quality Gate, sem tocar em nenhuma regra de negócio.

### 2. CSP bloqueava o JavaScript do ambiente de desenvolvimento

O `next dev` usa o devtool `eval-source-map` (os chunks contêm `eval(`), mas a política não permitia
`'unsafe-eval'`. Além disso, `upgrade-insecure-requests` em HTTP local e a ausência de `ws:` no
`connect-src` atrapalhavam HMR. Resultado: erros de CSP no console e hidratação incompleta em dev.

A tentativa de trocar o `devtool` em `next.config.ts` não é viável: o Next.js reverte alterações de
`devtool` em desenvolvimento (`Warning: Reverting webpack devtool…`) e os chunks continuam com `eval(`.

Correção: em desenvolvimento o proxy passa a enviar a política como
`Content-Security-Policy-Report-Only`, via `getContentSecurityPolicyHeaderName`. As violações continuam
aparecendo no console, mas nada é bloqueado, então HMR/Fast Refresh seguem funcionando. Produção continua
**enforce** e sem nenhum relaxamento de script.

### 3. `npm run dev` quebrava imediatamente

Next.js 16 ativa Turbopack por padrão, mas o plugin do Honeybadger injeta configuração de webpack. O
comando falhava com:

```
ERROR: This build is using Turbopack, with a `webpack` config and no `turbopack` config.
```

O `build` já passava `--webpack`; o `dev` não. Correção: `"dev": "next dev --webpack"`.

### 4. Favicon ausente (404 em todas as páginas)

Não existia `favicon.ico`, `icon.svg` nem metadado de ícone; o navegador registrava 404 em cada visita.
Correção: `src/app/icon.svg` (selo institucional em formato de ícone), servido em `/icon.svg` e declarado
automaticamente por `<link rel="icon">`.

### 5. Link externo sem página correspondente

O botão “Abrir OpenAI Agents” apontava para `https://platform.openai.com/agents`, que não é uma página
documentada. Correção: `https://platform.openai.com/docs/guides/agents` e rótulo explícito
(“Abrir documentação do OpenAI Agents”). Teste de página atualizado.

### 6. Conteúdo de espaço reservado em rotas já implementadas

Seis `README.md` de rotas ainda diziam “Architectural route placeholder … no route implementation is
introduced”, apesar de as páginas estarem implementadas e testadas (`amigos`, `configuracoes`,
`estatisticas`, `foco`, `perfil`, `streak`). Foram reescritos descrevendo o comportamento real de cada
rota. Também foi removido o link fictício `https://example.com/outlook-event` do harness de piloto do
Cronograma, substituído pelo endereço real do Outlook Web.

Os `README.md` de diretórios de camada realmente vazios (`src/application/*`, `src/components/*`,
`src/infrastructure/*`) foram mantidos: eles descrevem corretamente limites arquiteturais ainda sem
implementação.

### 7. Configuração de ambiente incompleta (fontes Adobe, OAuth e modelo)

Variáveis usadas pelo código não existiam no `.env.example` e/ou ficavam fora do pipeline de imagem:

| Variável | Uso | Onde foi incluída |
| --- | --- | --- |
| `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID` | Kit Adobe Fonts (`use.typekit.net`) | `.env.example`, `render.yaml`, `Dockerfile`, `quality.yml` |
| `NEXT_PUBLIC_APP_URL` | Base dos redirect URIs OAuth | `.env.example`, `render.yaml`, `Dockerfile`, `quality.yml` |
| `OPENAI_API_KEY` / `OPENAI_AGENT_MODEL` | Mestre Arcano | `.env.example` |
| `NEXT_PUBLIC_APP_ENV` | Ambiente público | `.env.example` |

Sem isso, o kit de fontes nunca seria carregado no deploy baseado em imagem (variáveis `NEXT_PUBLIC_*` são
embutidas em tempo de build) e a tipografia cairia no fallback do sistema.

### 8. Dependências desatualizadas (delegadas ao Dependabot)

A auditoria encontrou versões desatualizadas, mas **não** alterou `package.json`/`package-lock.json`: o
repositório já mantém PRs agrupados do Dependabot abertos para exatamente esses pacotes, e mesclar um
lockfile reescrito à mão criaria conflito com eles.

| Pacote | Atual | Disponível | Onde está sendo tratado |
| --- | --- | --- | --- |
| `next` | 16.4.3 | 16.4.3 | já aplicado na `main` pelo patch de segurança do PR #788 |
| `react` / `react-dom` | 19.3.0 | 19.3.1 | PR #793 (grupo de produção) |
| `@supabase/supabase-js` | 2.117.2 | 2.118.0 | PR #793 |
| `lucide-react` | 1.52.0 | 1.61.0 | PR #793 (propõe 1.60.0) |
| `@honeybadger-io/react` | 6.1.36 | 6.1.38 | PR #793 |
| `vite` | 7.3.7 | 8.3.5 | fora da política: major, requer migração |
| `vitest` / `jsdom` / `@playwright/test` / `@types/node` / `eslint-config-next` | — | minors/patches | dependabot (grupo de desenvolvimento) |

O que a auditoria verificou de fato sobre dependências:

- `npm audit` com o lockfile atual: **0 vulnerabilidades** (0 low, 0 moderate, 0 high, 0 critical).
- GitHub Advisory Database consultada para os 26 pacotes diretos e transitivos candidatos a atualização:
  nenhum novo advisory passa a incidir sobre as versões propostas.
- Pacotes com faixas de atualização aberta (`^`) resolvem versões já publicadas; nada aponta para
  registry alternativo, tarball remoto ou dependência não publicada.
- `next` está fixado em 16.4.3 exatamente porque a política do repositório exige pin exato para runtime
  e toolchain críticos; esse pin já contempla os advisories corrigidos em #788.

Majors (`typescript` 7, `eslint` 10, `vite` 8, `@honeybadger-io/nextjs` 6 — esta última exige novos peer
deps de OpenTelemetry) permanecem fora de escopo: exigem migração própria, e o Dependabot já ignora
TypeScript 7.x por política do repositório.

## Verificações executadas

- `tsc --noEmit`: sem erros.
- `eslint .`: sem erros.
- `vitest run`: **891 testes / 185 arquivos** aprovados (contagem após o rebase sobre a `main`, que
  incorporou a suíte de SEO do PR #796).
- `next build --webpack` (Next 16.4.3): build de produção concluído.
- `playwright test` (Quality Gate): as 5 suítes de referência visual falhavam apenas por hash
  desatualizado logo após a correção de CSP; com as referências regeradas, a matriz volta a comparar
  renderização real (50 testes já passavam, incluindo acessibilidade, a11y e fluxos autenticados).
- Varredura de rotas em produção local: todas as públicas em 200, autenticadas em 307 (redirecionamento
  esperado para `/login` sem sessão Supabase), `/icon.svg` em 200.
- Cabeçalho CSP de produção: `Content-Security-Policy` (enforce), `script-src` e `style-src` com nonce
  por requisição, `style-src-attr 'unsafe-inline'`, sem `'unsafe-eval'`, com `upgrade-insecure-requests`.
- Cabeçalho CSP de desenvolvimento: `Content-Security-Policy-Report-Only` (não bloqueia o tooling).
- Assets: todos os 10 caminhos `/assets/**` usados no código existem em `public/`.
- Links internos: nenhum 404 (apenas `/nao-existe`, rota inexistente usada para validar o 404).
- Links externos verificáveis: 26 URLs do GitHub retornaram 200; domínios vendorizados restantes
  (`ollama.com`, `vllm.ai`, `weaviate.io`, etc.) não são alcançáveis pelo sandbox de auditoria.
- APIs de terceiros revisadas contra a documentação vigente: Todoist `api/v1` + `api.todoist.com/oauth/access_token`,
  Notion `2026-03-11`, Trello OAuth 2.0 via `auth.atlassian.com`, Asana `api/1.0`, Microsoft Graph `v1.0`,
  modelo `gpt-5.6-sol` confirmado como válido.

## Limitações do ambiente de auditoria (não são defeitos do código)

- `/api/ready` responde 503 porque o projeto Supabase de exemplo não é alcançável a partir do sandbox;
  o contrato de readiness está correto e retorna 503 quando o serviço upstream falha.
- `/api/integrations/github/verify` responde 502 porque o `fetch` do Node não consegue sair do sandbox
  (o `curl` para `api.github.com` retorna 200 para `arcana-academy/academiaarcana`). Em produção o
  verificador funciona e ainda possui fallback para HTML do GitHub em 403/429.
- Links `chatgpt.com/plugins/...` e domínios de vendors não listados não podem ser resolvidos pelo
  sandbox; não foram alterados porque fazem parte do catálogo de integrações.

## Ações de configuração necessárias no deploy

1. Definir `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID` (Render → variável; imagem → `vars` do GitHub Actions) para
   ativar a tipografia Adobe.
2. Confirmar `NEXT_PUBLIC_APP_URL` com a origem pública real usada nos redirect URIs OAuth.
3. Manter `OPENAI_API_KEY` como Secret File/ambiente de runtime (nunca em `NEXT_PUBLIC_*`).

## Adendo — itens complementares desta revisão

A auditoria acima cobriu CSP, dev server, configuração de integrações e conteúdo. Esta revisão
acrescentou três pontos que ficaram de fora:

### Favicon binário

`src/app/icon.svg` já era servido em `/icon.svg`, mas `/favicon.ico` continuava retornando 404 para
navegadores e crawlers que pedem o caminho convencional. Foi adicionado `src/app/favicon.ico`
(32×32, derivado do selo institucional); o Next.js declara os dois em `<link rel="icon">` e ambos
respondem 200 com o `Content-Type` correto.

### Janela de espera do smoke de produção

O run `40001118764` (commit `c985f03`) falhou em *Check health endpoint*: a raiz já respondia 200 na
revisão anterior e a verificação da revisão esperada desistia após 12 × 10 s, antes de o Render
concluir o deploy. A espera passou para 30 × 10 s e o `timeout-minutes` do job para 18.

### Regeneração dos manifestos visuais

A correção de CSP faz os atributos `style` voltarem a valer, o que altera os screenshots das páginas
que montam layout com `style`. Os manifestos (`tests/e2e/*-baselines.json`) precisam ser regravados
pelo **mesmo build de Chromium da CI**. As specs passaram a honrar `AA_VISUAL_BASELINES_WRITE=1`, e o
workflow `autofix` habilita esse modo somente para PRs com o label `refresh-visual-baselines`,
commitando os manifestos regravados para revisão normal. Fora desse label, toda execução continua
assertando. Os cinco manifestos foram regravados dessa forma e o resultado é idêntico ao já
publicado em `main`.
