# Academia Arcana — Megaoperação · Ciclo 18

**Data:** 2026-10-09. **PR:** #583 (draft). **HEAD de entrada:** `5bd7c8507e7f5bd22fa02e7eeeff4d298c8cb4ed`.  
**Escopo:** auditoria de DEP-C17-01–08; rastreabilidade de ownership; especificação NÃO executável; teste sintético adicional.  
**Checkpoint de CI:** conferir o **HEAD publicado** antes de registrar resultado final na PR; este documento não antecipa `success`.

## Achados comprovados

1. `src/core/architecture/data-ownership.ts` não contém `institutions`, `classrooms` ou `teacher_assignments`. Não é defeito do domínio canônico enquanto os recursos não foram aprovados; é dependência de decisão P0. **Não inserir itens fictícios no registry.**
2. `DEP-C17-01–08` existem como questões propostas sem ADR ou escopo Produto aprovado. Nenhuma pode ser encerrada apenas por este ciclo.
3. A fixture transacional protege instituições/turmas/vínculos com RLS e privilégios mínimos; havia testes de escrita de turmas, porém não havia trio DML negativo completo para **instituições** sob `authenticated`.
4. Testes sintéticos não equivalem a implementação nem avaliação de dados reais.

## Implementado na PR

- `docs/architecture/AA-ARCH-C18-DECISION-REGISTER.md`: decisão/authority/evidência/NO-GO por cada uma das oito pendências; ownership candidato sem alterar políticas canônicas.
- `docs/architecture/AA-ARCH-C18-ISOLATED-IMPLEMENTATION-SPEC.md`: requisitos G0–G3, fronteiras Identity/Context/Authorization/Data/Trust e testes TC18-01–12 com estado real da evidência.
- `supabase/tests/database/teacher_class_contract_c16.test.sql`: **5 verificações C18-030–034**, três negativas de INSERT/UPDATE/DELETE de instituição e duas verificações de grants; `plan(34)` no mesmo `BEGIN/ROLLBACK` local.
- Nenhuma migration, endpoint, biblioteca adicional, regra de autorização real, serviço externo ou dado de produção alterado.

## Validação a observar no HEAD final

Quality Gate (lint, typecheck, unit, acessibilidade, build, E2E e smoke isolado), Database Tests da fixture, revogação local, segurança CodeQL/Gitleaks/Dependency Review, status externos e estado da PR. Confirmar Render `Free`, `autoDeploy=no`, `autoDeployTrigger=off`. No comment final da PR registrar sucesso/falhas de cada categoria, sem promover a fixture a implementação operacional.

## Veredito de governança

Escopo da revisão C18 pode ser concluído **somente** como documentação + testes isolados. **DEP-C17-01–08 permanecem abertas**. Não fazer merge/deploy, implementar matrículas, publicar API docente, mudar policy/registry canônicos ou expor dados pessoais.

**Próximo ciclo candidato:** apresentar DEP-C17-01–08 aos proprietários canônicos e colher decisões explícitas; só então decidir se há autorização para desenvolver uma prova operacional em sandbox.
