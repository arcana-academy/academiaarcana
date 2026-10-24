# Academia Arcana — prévia incremental privada (23/10/2026)

**Estado atual: PREPARAÇÃO / NÃO PUBLICADA / SEM ACESSO DE ESTUDANTES.**

## Objetivo e aprovação

A proprietária aprovou publicar por pequenas entregas para visualizar e testar a aplicação em um endereço reservado, **sem lançamento público, sem dados de estudantes, sem inscrições e sem credenciais produtivas**. Uma aprovação de prévia NÃO autoriza merge em `main`, GHCR, cutover do Render oficial, liberação de cadastro ou dispensa dos gates do release público.

## Estado verificado

- Repositório: `arcana-academy/academiaarcana`.
- `main` protegida no início: `9f902981fcd537a10ff8d6757379b450f656abf9`.
- Candidata isolada: `work/aa360-private-preview-foundation-20261023`. **Não incorporar na main.**
- Render oficial: `srv-dauor697lnhs739cicag`, Git-backed em `main`, Free, Auto Deploy OFF, aberto à internet.
- O Render oficial está configurado com prévias automáticas de pull requests; **não abrir PR contra `main` antes de comprovadamente isolar o ambiente de prévia e o processo de build**.
- A aplicação usa `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no build; usar somente ambiente Supabase de teste explicitamente separado e sem dados reais. Não reutilizar produção.
- Proteção inicial adicionada nesta branch: `src/lib/security/private-preview-gate.ts` (Basic sobre HTTPS), `src/proxy.ts` (rotas e assets), `scripts/security/start-private-preview.cjs` (verificação de entrada) e testes associados.
- **C110 validado em checkout isolado:** 18/18 Vitest PASS, 16/16 Node PASS, typecheck PASS e ESLint sem erros (3 warnings). Nenhum desses resultados equivale a proteção HTTP/hospedagem homologada.
- `AA_PRIVATE_PREVIEW` não deve ser definido como `disabled` no serviço de prévia. O gate fecha por padrão se ausente; iniciar somente com `AA_PRIVATE_PREVIEW=required`, senha aleatória exclusiva com pelo menos 32 bytes e o script `node scripts/security/start-private-preview.cjs`.
- Nunca armazenar senha, tokens, chaves ou dados reais neste repositório ou no relatório.

## Condições antes do primeiro deploy

1. Definir hospedagem **separada** do serviço Render oficial, sem segredos produtivos e sem custo novo não autorizado. Bloquear/evitar preview automático que herde ambiente ou segredos produtivos.
2. Criar configuração **somente de teste** para Supabase e demonstrar isolamento de Auth/RLS; não executar migrações hospedadas contra produção.
3. Validar com testes direcionados o bloqueio de páginas, API, JS, imagens e caminhos alternativos (401 sem senha; autorizado somente com senha forte), política CSP, ausência de redirecionamento inseguro e ausência de credenciais nos logs. Verificar restrição de acesso no serviço efetivamente implantado, não apenas em teste unitário.
4. Manter `/api/health` não sensível para monitoração; verificar que expõe somente saúde básica, sem dados internos.
5. Não disponibilizar links publicamente, indexação ou inscrições; confirmar cabeçalhos `noindex`, sem confundi-los com proteção de acesso.
6. Vincular cada promoção a SHA, escopo, testes aplicáveis, smoke privado e rollback. Se qualquer controle falhar: **BLOCKED**, sem promover.

## Entregas cumulativas (não são PASS até testadas)

| Etapa | Escopo | Evidência de aceite |
| --- | --- | --- |
| P0 | Estrutura, identidade oficial, Santuário e navegação | Desktop/mobile, acesso privado, links, CSP |
| P1 | Academia, Grimórios, Capítulos e Páginas | Fluxos reais com identidades e dados **sintéticos** segregados |
| P2 | Missões, Cronograma e Perfil | Persistência isolada, integração e regressão direcionada |
| P3+ | Ajustes visuais, acessibilidade, desempenho e qualidade | QA somente do delta, sem repetir PASS aplicáveis |
| Release público | Estudantes e produção | Gates completos de segurança/governança/privacidade e revisão independente |

## Registro das publicações

**Nenhuma publicação de prévia executada até o momento.** Para cada publicação, anexar: `data UTC | URL privada (sem segredo) | SHA | escopo | checks | smoke | rollback | responsável`.

**NO-GO do lançamento oficial preservado:** #536, #594, #595, C03/ORG02 e demais requisitos aplicáveis. O uso de uma prévia de teste não equivale a passar esses gates.

## C111 — evidências operacionais de 23/10/2026 (local UTC: 24/10)

**Revisão-alvo de código: `22edaf74b91e1a36011cdcb46073a05c1e3dcd59`.**

### Evidências preservadas

- SHA da branch e do checkout local reconciliados no começo da operação; `main` mantida em `9f902981fcd537a10ff8d6757379b450f656abf9`.
- Evidências aprovadas C110 reutilizadas integralmente: 34 testes direcionados PASS e TypeScript PASS; nenhuma repetição de testes concluídos.
- Ambiente: Windows `DESKTOP-71IV4IB`, checkout `C:\\Users\\maced\\aa-preview-c110-isolated-20261023`, Node 24, npm 11, Docker Desktop.
- A configuração do Supabase C111 foi escrita **fora do repositório**, sob `C:\\Users\\maced\\aa-c111-supabase-isolated-20261023\\supabase\\config.toml`, usando um `project_id` novo e portas 57321/57322/57320; nenhum dado real, identidade ou migração foi criado.
- Rede Docker exclusiva `aa-c111-loopback-20261023` criada com `com.docker.network.bridge.host_binding_ipv4=127.0.0.1`; `docker network inspect` confirmou a opção.
- **FAIL de isolamento real:** o container `supabase_db_aa_c111_private_preview_20261023` apareceu com `0.0.0.0:57322->5432/tcp` e `[::]:57322->5432/tcp` apesar da opção da rede, segundo `docker ps` e `netstat`. A inicialização foi interrompida; **somente o container C111** foi parado e foi confirmado `Exited (137)`, sem listener :57322. Nenhum container preexistente foi interrompido.
- **BUILD BLOCKED por concorrência:** `npm run build` usando variáveis browser **sintéticas não funcionais** e ambiente de processo com allowlist executou os preflight checks: `assert-build-secret-isolation-536.cjs` PASS, `verify-public-runtime-config.mjs` PASS de formato, `verify-deployment-platform.cjs` PASS, `verify-canonical-infrastructure.cjs` PASS. Next.js 16.4.3 recusou a compilação por outro `next build` em andamento; exit 1 sem compilar. A inspeção mostrou dois processos Node de build existentes (PIDs 11776 e 13988), o primeiro iniciado antes da tentativa C111. Não foram encerrados e **nenhum lock foi removido**.
- Não houve HTTP smoke de Next.js, Auth, CSP ao vivo, assets ou Supabase; esses critérios permanecem **BLOCKED/não executados**.
- Render oficial `srv-dauor697lnhs739cicag` permaneceu Git-backed em `main` e Auto Deploy OFF; prévias de PR continuam automáticas e não comprovadamente segregadas. Não abrir PR ou serviço preview herdado.
- Nenhum deploy, merge, GHCR, mudança de segredos, configurações hospedadas ou custos executados.

### Próximo passo executável sem repetir o que passou

1. Diagnosticar ou substituir a estratégia de binding da CLI Supabase **sem tocar** os containers legados; iniciar somente se todos os serviços C111 puderem ser demonstrados em `127.0.0.1` sem `0.0.0.0`/`[::]`. Se impossível, manter backend C111 parado.
2. Confirmar se os processos Next concorrentes terminaram de forma legítima; nunca matá-los ou apagar lock sem autoria comprovada. Reexecutar apenas o build não concluído quando o checkout estiver livre.
3. Após backend seguro e build PASS, executar HTTP real com/sem Basic Auth, CSP, estáticos e saúde; validar persistência exclusivamente com identidades e dados fictícios.
4. Somente **depois** estudar hospedagem independente com allowlist de variáveis, proteção de acesso validada em serviço real e rollback. `NO-GO` de publicação até lá.

**Checkpoint C111:** controles de pré-build PASS; Supabase loopback FAIL; build BLOCKED; HTTP BLOCKED; deploy BLOCKED. Nenhuma versão privada publicada.


## C111 — reconciliação de segunda execução isolada (23/10 local / 24/10 UTC)

**Este registro complementa, sem apagar, a tentativa C111 anterior descrita acima.** A outra tentativa enfrentou lock de build e usou projeto/portas Docker diferentes. Os resultados abaixo foram obtidos **em um checkout isolado distinto**, no mesmo **SHA de código** `22edaf74b91e1a36011cdcb46073a05c1e3dcd59`. A alteração GitHub imediatamente anterior a este registro, `1d20fdde165c7866b8daf17379d8747c0ebb1495`, modificou **somente este ledger**; não altera a validade técnica dos testes abaixo nem autoriza merge.

### PASS comprovados nesta segunda execução

- Checkout `C:\\Users\\maced\\aa-preview-c110-isolated-20261023`, `git rev-parse HEAD` igual ao SHA testado; Node 24.22.1, npm 11.19.1 e Docker 29.8.1. Dados/credenciais de produção não utilizados.
- Pré-build sob ambiente sanitizado de allowlist, com variáveis públicas **fictícias sem backend operacional**: `assert-build-secret-isolation-536.cjs` PASS; `verify-public-runtime-config.mjs` PASS **somente para sintaxe de URL/chave**; `verify-deployment-platform.cjs` PASS; `verify-canonical-infrastructure.cjs` PASS.
- Primeiro build foi interrompido após 240 s por limite de tempo do script local; uma **segunda tentativa**, com limite adequado e sem alterar código, concluiu `next build --webpack` no mesmo SHA: **PASS, exit 0**, Next.js 16.4.3; compilação ~28,9 s; TypeScript ~31,4 s; 39 páginas estáticas geradas; artefatos e traces finalizados (~116 s). Não foi executado build com credenciais produtivas.
- Teste **HTTP real local** na aplicação de **produção compilada**, executada temporariamente por `next start --hostname 127.0.0.1 --port 39113`, com senha sintética exclusiva mantida somente na memória: **21 PASS / 0 FAIL**, exit 0. `netstat` comprovou listener TCP somente `127.0.0.1:39113`. `/api/health` retornou 200 sem senha e apenas liveness não sensível. Sem Basic Auth, `/`, `/santuario`, `/api/ready`, `/api/health/private`, SVG público, `/_next/static/not-a-real-file.js` e `/favicon.ico` retornaram **401** com `WWW-Authenticate`, `noindex` e `no-store`; cada resposta apresentou **CSP em modo de enforcement**, sem `report-only`. Senha errada: 401. Senha sintética correta: landing e SVG **200**, com `noindex` e CSP. O processo local de Next foi encerrado ao terminar.
- Evidências C110 (18/18 Vitest, 16/16 Node, tipagem e lint) foram **reutilizadas**, não tratadas como homologação independente de produção.

### FAIL / BLOCKED que permanecem

- Além da primeira tentativa C111 (porta 57322), esta segunda execução criou **outro projeto Supabase descartável e exclusivo**, `aa-c111-supabase-private-20261023`, com API/DB reservados em 58321/58322. Dois testes de rede mostraram: com `docker run -p 127.0.0.1:58399:80`, o listener ficou restrito a `127.0.0.1` (PASS); **sem IP explícito**, mesmo na rede com `com.docker.network.bridge.host_binding_ipv4=127.0.0.1`, o Docker Desktop publicou `58398` em `0.0.0.0` e `[::]` (FAIL). Durante `supabase start --network-id ...`, o novo DB ficou brevemente em `0.0.0.0:58322` e `[::]:58322` (FAIL). A execução Supabase foi interrompida; **somente o contêiner desta segunda execução** foi parado e removido, e as duas redes de prova exclusivas desta segunda execução foram removidas. `netstat` posterior não identificou listener :58322 ou :39113. Contêineres anteriores, incluindo o da primeira tentativa C111 e os ambientes legados, foram preservados.
- O build e o HTTP acima empregaram **URL/chave Supabase públicas sintéticas e não funcionais**. Logo, **NÃO comprovam** persistência, RLS, Auth estudantil, migrações, conectividade real com Supabase, fluxo de estudantes nem execução em hospedagem externa.
- **Backend C111 BLOCKED:** o caminho padrão do Supabase CLI no Docker Desktop não comprovou publicação exclusivamente em loopback. Exige solução isolada com host IP **explícito em cada mapeamento**, ou VM/ambiente autorizado equivalente, com auditoria das portas antes de atender requisições; não reutilizar serviços/dados existentes e não desabilitar RLS/CSP.
- **Hospedagem privada externa BLOCKED:** não existe serviço novo com proteção e allowlist efetiva atestadas. Render oficial `srv-dauor697lnhs739cicag` permanece Git-backed em `main`, Auto Deploy OFF; as prévias automáticas de PR não são privadas por padrão. Nenhum PR foi aberto nesta operação, nenhum deploy/merge/GHCR/segredo/produção alterado, nenhuma compra autorizada.

**Checkpoint reconciliado C111:** proteções de código + build sintético + 21 testes HTTP de produção **PASS**; Supabase sintético em rede somente local **FAIL/BLOCKED**; hospedagem privada externa **BLOCKED**; release oficial **NO-GO**. Próximo passo somente construir stack Supabase efêmera com portas explicitamente publicadas em `127.0.0.1`, confirmar Auth/RLS e, depois, validar serviço de prévia sem herança de segredos antes de qualquer publicação.
