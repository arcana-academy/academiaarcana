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
- **Os testes novos ainda não foram executados nesta operação.** Código preparado ≠ proteção homologada.
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
