# Academia Arcana — Megaoperação, Ciclo 16

**Data:** 2026-10-09 · **PR:** #583 · **Baseline:** `7d3fc270167d9db3b80e7e1a5ddf1b1e4db3c890`.  
**Veredito:** preencher somente após conferir o Quality Gate no HEAD final.

## Auditoria e consolidação
- Autoridades canônicas existentes: `docs/product/`, `docs/architecture/AA-ARCHITECTURE-1.0.md`, `src/core/authorization/contracts.ts`.
- P0 operacional preservado: não existe esquema validado de instituição/turma/vínculo docente em produção. Autenticação da prévia não constitui autorização docente.
- Decisões **não inventadas**. `docs/architecture/AA-ARCH-C16-INSTITUTION-CLASS-TEACHER-PROPOSAL.md` consolida proposta, matriz de papéis e condições de homologação.

## Implementação de baixo risco
1. Teste SQL `supabase/tests/database/teacher_class_contract_c16.test.sql`, com esquema sintético transacional e rollback, 20 assertions pgTAP.
2. Integração no `.github/workflows/database-tests.yml`, usando exclusivamente Supabase local descartável. Sem migration.
3. Testes negativos para anon, identidade ausente, docente de outra turma, vínculo expirado/revogado, metadata forjada, escrita sem grant e integridade entre instituições.

## Evidência e limites
- Confirmar o SHA de execução e o resultado do workflow `Academia Arcana Database Tests`, `Quality Gate`, checks externos e security scans antes de registrar validação final.
- Um teste em esquema artificial não comprova RLS real professor–turma, prova apenas invariantes da proposta.
- Revisão humana, modelo canônico de organização/atribuições, definição de dados estudantis e auditoria independente permanecem bloqueios P0/P1.
- Sem merge, deploy, alteração de produção, segredos, plano Free ou Auto Deploy.

## Próximo ciclo candidato
Ciclo 17: revisão formal da proposta pelos domínios de Produto/Arquitetura; confrontar contratos aprovados e preparar implementação real somente em ambiente não produtivo, sem antecipar migrações.
