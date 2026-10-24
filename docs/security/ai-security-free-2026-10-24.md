# ACADEMIA ARCANA — AI SECURITY FREE (Ciclo A1)

Data: 2026-10-24. Base examinada: `2b8c1829f03ce720b97752e07d2f64bd514445c6`.
Branch isolada: `work/aa-ai-security-free-20261024-store-no-go`. Sem merge, deploy, APIs faturáveis, segredos reais ou dados pessoais reais.

## Escopo comprovado por código

- Mestre Arcano: `src/app/api/agent/mestre-arcano/route.ts` e `src/infrastructure/openai/mestre-arcano.ts`; OpenAI Responses API.
- Ferramentas autorizadas: `mestre-arcano-tools.ts`; Supabase com contexto vinculado a `claims.sub`, leitura SharePoint autenticada e pesquisa via Parallel/Exa.
- Gateway opcional de IA aberta: `/api/ia-aberta`, catálogo Ollama/vLLM/BentoML/Hugging Face. Implementação não significa serviço ativo.
- `OPENAI_API_KEY` resolvida por `getRuntimeSecret`, sem prefixo `NEXT_PUBLIC_`. Estado REAL das credenciais e serviços produtivos **não verificado**, para evitar chamadas e exposição.

## Riscos evidenciados na base

1. **FAIL — retenção de respostas OpenAI**: `/responses` não configurava `store`; o padrão oficial é `true`. Respostas podem conter dados educacionais ou textos recuperados.
2. **FAIL — limite determinístico de saída/duração do Mestre**: chamadas à OpenAI não fixavam `max_output_tokens` nem um `AbortSignal` de timeout. O loop era limitado a 5 iterações, mas sem teto por resposta nem por lote de function calls.
3. **FAIL — leitura privada + egress externo no mesmo lote**: verificação de `privateDataInContext` ocorria somente após `Promise.all`. Chamadas de egress do lote atual não eram preventivamente bloqueadas caso também houvesse leitura privada.
4. **BLOCKED — cota persistente de chamadas/tokens por estudante, orçamento global, concorrência**: não identificados controles duráveis na rota do Mestre; exige desenho e testes com storage existente, sem alterar produção.
5. **BLOCKED — operação/consentimento/privacidade**: não houve leitura de credenciais produtivas nem testes de envio de dados reais.

## Correções nesta branch

- `store: false` e contexto de function calls mantido na memória do servidor durante uma única requisição, com replay dos itens de resposta e outputs de ferramentas; `include: ["reasoning.encrypted_content"]` para preservar raciocínio entre iterações sem recorrer a `previous_response_id`.
- `max_output_tokens: 4096`; timeout de 25 segundos por requisição OpenAI; limite de 4 function calls por iteração, fail-closed antes de executar.
- Bloqueio de ferramentas `search_web`/`extract_web_source` no mesmo lote que acessa dados privados e em iterações subsequentes.
- Regressões com `fetchImpl` simulado em `src/infrastructure/openai/mestre-arcano.test.ts`.

**Nota de privacidade:** `store:false` evita o armazenamento do objeto de resposta no histórico persistente da API, mas não substitui análise contratual de processamento/retenção, consentimento e minimização de dados educacionais. O envio de dados para inferência continua dependendo de política aprovada.

## Evidência e limitações dos testes

- **PASS (estático, leitura remota pós-commit)**: 8 verificações de código — `store:false`, replay stateless, reasoning encrypted, orçamento de saída, timeout, teto de ferramentas, bloqueio de lote misto, inclusão de testes.
- **BLOCKED (executável)**: Vitest, lint, TypeScript e build não executados neste ciclo. Ambiente local disponível: Node 22/npm 10; `package.json` exige Node 24/npm 11. Nenhum `npm ci` foi iniciado e nenhuma API paga foi consultada.
- **BLOCKED (runtime)**: testes de RLS com 2 contas sintéticas, carga/rate limiting persistente e status real de segredos/conexões requerem executor adequado/autorizado.
- **NO-GO**: a PR #809 já cobre hardening do gateway open-source em branch diferente. Não duplicar nem presumir seu merge. Preservar #536/#594/#595, C03/ORG02, revisão independente e as gates de publicação.

## Próximo ato técnico

No executor isolado com Node 24/npm 11 e sem segredos de produção, fazer checkout do HEAD desta branch, comparar com `main` e PR #809 atuais e executar **somente** `vitest run src/infrastructure/openai/mestre-arcano.test.ts src/infrastructure/openai/mestre-arcano-tools.test.ts`, `npm run typecheck` e lint direcionado. Usar mocks; não conectar à OpenAI/Parallel/Exa. Se ocorrer regressão, corrigir somente neste checkout/branch. Sem merge, GHCR, deploy, migrações hospedadas ou despesas.
