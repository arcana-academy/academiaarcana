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


---

## A2 — Reconciliação de 2026-10-24 (homologação parcial)

**HEAD A1 de partida:** `0699c63684d8a690c11f24ccc04fb33a03b7675b`.
**Main observada:** `2b8c1829f03ce720b97752e07d2f64bd514445c6` (ancestral de A1, três commits atrás, sem novo delta).
**PR #809:** aberta, HEAD `3001c21bd65bb1c71fed28501ecc88b5212b884d`; 18 arquivos no diff, sem alteração em `src/infrastructure/openai/*` nem em `src/app/api/agent/mestre-arcano/route.ts`. Hardening do gateway de IA aberta não duplicado.

### Executor e comandos executados

Ambiente desta sessão (leitura):
```sh
node --version        # v22.16.0
npm --version         # 10.9.2
git ls-remote https://github.com/arcana-academy/academiaarcana.git HEAD
# fatal: Could not resolve host: github.com
```

Desktop Commander (inventário em leitura): Windows DESKTOP-71IV4IB OFFLINE (última conexão 13 horas antes); codespaces-e7d03f OFFLINE (259 h); codespaces-f2f259 OFFLINE (981 h). Nenhum executor autorizado online foi identificado com Node 24/npm 11. Não foram instaladas dependências, executados scripts npm nem provisionados serviços.

### Evidências e classificações

- **PASS (GitHub/estático):** HEAD A1 = branch antes do delta A2; comparação com main sem alterações novas; PR #809 sem sobreposição com os dois arquivos A1; oito invariantes estáticos A1 reutilizados sem rerun. O arquivo de teste recebeu quatro casos com mocks: replay de `reasoning.encrypted_content` e function outputs, erro JSON inválido, corpo de erro com segredo sintético e falha simulada de transporte com sinal de timeout.
- **BLOCKED (execução)**: `vitest`, `typecheck`, `eslint`, red team dinâmico, medições de custo e concorrência. Código dos testes **presente, mas não executado**; não classificar como PASS.
- **BLOCKED (validação runtime da privacidade)**: comportamento efetivo do provedor para `store:false`, replay de reasoning encrypted e consumo de tokens não testados contra API real por proibição de chamadas externas faturáveis.
- **NO-GO**: manter #536, #594, #595, C03/ORG02, revisão humana independente, GHCR e Render.

### Proposta gratuita, ainda NÃO IMPLEMENTADA, de quota

Reutilizar PostgreSQL do **Supabase existente**, não serviço adicional. Uma migração futura versionada, primeiro em Supabase descartável, implementaria uma reserva atômica antes de qualquer chamada ao modelo:

1. Contadores por `auth.uid()` + janela diária e contador global; política de limite configurável em código e revisão de Produto/Segurança.
2. Função transacional para reservar tokens máximos conservadores e slots concorrentes sob bloqueio de linha (ou mecanismo transacional equivalente). Transação única impede concorrência de ultrapassar cotas.
3. Registrar apenas id aleatório da operação, titular, janela, capacidade reservada, estado e timestamps mínimos; **não** persistir prompts, respostas, instruções, chaves ou documentos.
4. Finalizar reserva com uso quando disponível; expirar leases órfãos de modo idempotente; não permitir reembolso que facilite contornar o teto. Erros de banco bloqueiam antes de chamar API.
5. Rejeitar 429 antes do egress quando orçamento/concorrência esgotados; resposta genérica, `Cache-Control: no-store`, sem detalhes internos.
6. Modelo de privilégio deve impedir que um cliente com JWT invoque diretamente uma reserva **global** para consumir quotas alheias sem fazer uma chamada real. Isso exige fronteira autenticamente controlada pelo servidor, possível apenas com mecanismo já aprovado. Até prová-lo, **BLOCKED** e nenhuma migração proposta deve ser publicada.
7. Provar duas identidades sintéticas, dez chamadas paralelas, idempotência, expiração e falha transacional em Postgres isolado. O teto de tokens de saída por chamada não substitui limite financeiro da conta do provedor.

### Comandos pendentes, somente em executor isolado homologado

```sh
node --version           # exigir Node 24.x
npm --version            # exigir npm 11.x
git status --porcelain   # exigir checkout limpo no HEAD A2 desta branch
npm ci --ignore-scripts --no-fund
./node_modules/.bin/vitest run src/infrastructure/openai/mestre-arcano.test.ts src/infrastructure/openai/mestre-arcano-tools.test.ts
npm run typecheck
./node_modules/.bin/eslint src/infrastructure/openai/mestre-arcano.ts src/infrastructure/openai/mestre-arcano.test.ts src/infrastructure/openai/mestre-arcano-tools.ts
```

Examinar scripts de ciclo de vida e necessidade de binários nativos antes de permitir qualquer script adicional; nenhuma credencial produtiva presente; egress externo negado salvo dependências de instalação explicitamente autorizadas; nenhum teste com API real.

**Próximo prompt:** retomar A2 somente após executor Node 24/npm 11 autorizado voltar a ficar online. Executar comandos pendentes, testar mocks e, se houver FAIL real, corrigir só nesta branch. Sem merge/deploy/GHCR.
