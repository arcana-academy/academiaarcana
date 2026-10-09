# Academia Arcana — Megaoperação · Ciclo 17

**Data:** 2026-10-09 · **PR:** #583 (draft) · **Baseline:** `ff245ec1cb000a90c1641b741eb206b5763f5a6d`.
**Status desta versão do documento:** evidência do commit; veredito final de CI deve ser registrado no comentário da PR, após verificação do HEAD.

## Auditoria de aderência canônica

1. Produto: AA-PROD-002 impede tratar o portal demonstrativo como capacidade operacional; AA-PROD-009 reserva prioridade/status à autoridade do Produto. O catálogo atual não declara modelo institucional/docente implementado.
2. Arquitetura: `identity` ≠ `context` ≠ `authorization`; `education` responde por estruturas educacionais, `data` não responde por autorização de negócio; RLS complementa avaliação server-side.
3. Proposta C16 preservada como **PROPOSTA, não canônico**. Novas decisões DEP-C17-01–08 aguardam autoridade; não reabrir decisões fechadas.
4. Lacuna de fixture comprovada: a tabela de instituições do esquema sintético não tinha RLS explicitamente habilitada. Tabela não possuía grants `anon/authenticated`; trata-se de defesa em profundidade do **teste**, não incidente de produção.

## Alterações de baixo risco

- `supabase/tests/database/teacher_class_contract_c16.test.sql`: `ENABLE ROW LEVEL SECURITY` para `aa_c16_isolated.institutions`; 9 assertivas C17-021–029 adicionadas às 20 do C16 (total **29**).
- `docs/architecture/AA-ARCH-C17-PRODUCT-ARCHITECTURE-CROSSWALK.md`: confrontação das autoridades, ownership candidato, pendências, critérios de aceite.
- `docs/security/AA-SEC-C17-TEACHER-CLASS-MATRIX.md`: matriz por ator/recurso/ação e roadmap de testes reais, deny-by-default.

## Critérios de conclusão desta fase

- O arquivo SQL deve ser executado pelo workflow já existente `Academia Arcana Database Tests` contra Supabase local (transação revertida), sem migration nova nem dados reais.
- Aprovados Quality Gate (lint/typecheck/unit/acessibilidade/build/E2E/smoke isolado), scans e checks externos no **HEAD final**; registrar status factualmente.
- A validação de uma fixture não demonstra autorização operacional nem substitui aprovações de Produto, Arquitetura, Trust e Segurança.
- Zero merge, deploy, novas permissões de produção, alteração da política Render ou Auto Deploy.
- P0 de homologação, matrícula e RLS real permanece aberto; revisão humana e binários maiores oficiais do Flonts não foram abordados.

## Próxima ação sugerida

Ciclo 18 — solicitar fechamento das decisões DEP-C17-01–08 pelas autoridades competentes e auditar viabilidade de estrutura/ownership; somente depois criar protótipo efetivo **isolado** com requisitos aprovados, sem mexer em produção.
