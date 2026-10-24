# CP-AA360-C16-ADAPTIVE-REVIEW-20261017

**Data:** 2026-10-17
**Projeto:** Academia Arcana — Operação Arcana 360°
**Natureza:** correção local isolada, sem merge/deploy/publicação.

## Baseline e isolamento

- Repositório de trabalho: `06-branches-isoladas/aa360-master-c16-20261017`.
- Branch: `work/aa360-master-c16-20261017`.
- Base canônica: `main@cc17653dfe79c44dd83ba1ced8cb065383b11ca9`.
- Clone Git próprio criado com `git clone --no-local`; nenhum arquivo do checkout principal, de ORG02 ou das PRs existentes foi sobrescrito.
- Dependências locais de testes reutilizadas por junction a partir de um checkout isolado cujo `package-lock.json` tem SHA-256 idêntico. Isto NÃO homologa executor Linux/ORG02.

## Problema reproduzido

`buildReviewRecommendation` em `src/domains/adaptive/p1.ts` usava `new Date(createdAt).toISOString()` sem proteger valores inválidos. Uma tentativa com `createdAt='not-a-date'` causava `RangeError: Invalid time value` e podia impedir a montagem das projeções educacionais.

## RED e GREEN

- Testes novos: `src/domains/adaptive/p1.test.ts`; cenários com data malformada e histórico válido anterior, e com todas as datas inválidas.
- RED: `npm test -- src/domains/adaptive/p1.test.ts` = 5 PASS / 2 FAIL, ambos por `RangeError: Invalid time value`; exit code 1.
- GREEN: filtragem conservadora de datas e resultados impróprios, ordenação por instante válido e retorno sem agendamento automático quando não há evidência temporal confiável.
- GREEN: `npm test -- src/domains/adaptive/p1.test.ts` = 7 PASS / 0 FAIL; exit code 0.
- `npm run typecheck` = PASS, exit code 0.
- `.\\node_modules\\.bin\\eslint.cmd src/domains/adaptive/p1.ts src/domains/adaptive/p1.test.ts` = PASS, exit code 0.
- `git diff --check` = PASS (sem erro informado).
- Node.js v24.22.0; npm 11.19.1; Vitest 5.0.3.

## Limites e NO-GO

- Não foram executados build de produção, suite completa, E2E, QA visual, C03 autenticado ou validação do executor Linux segregado.
- CI no GitHub/novo PR não executados; não houve push, merge, deploy, alteração de RLS, migração, segredo, GHCR ou serviço produtivo.
- Dependências canônicas #536/#593 e ORG02 permanecem NO-GO. Esta validação Windows apenas comprova o defeito e a correção localizada.
- Próxima fase: validar no executor homologado e abrir PR DRAFT mediante autorização e permissões correspondentes, com revisão independente antes de integração.
