# Academia Arcana — Megaoperação, Ciclo 15

**Data:** 2026-10-09
**Repositório e PR:** `arcana-academy/academiaarcana`, PR #583 (draft).
**Baseline:** `8d151d5c4c0a6290efc27e05ec9e0158f63b8d80`.
**Escopo:** segurança do contrato demonstrativo de listagem Professor → Turmas, auditoria read-only de Supabase e testes sintéticos.

## 1. Auditoria (fatos observados)

- A rota `src/app/design-system/portais/professor/turmas/turma-a/page.tsx` exige `requireAuthenticatedUser()` e continua exclusivamente demonstrativa. Identidade autenticada **não comprova** vínculo docente–turma.
- O contrato geral `src/core/authorization/contracts.ts` nega por padrão sem uma política; seus grants não comprovam necessariamente vínculo docente ativo.
- `src/application/teaching/list-classrooms-draft.ts` é um rascunho **não conectado** à rota, sem adaptador de dados operacional. Antes deste ciclo, só exigia autorização por contexto e por registro, sem comprovação independente de vínculo professor–turma.
- Auditoria somente leitura do Supabase `fichnalpbcfjywwhixid`: 15 tabelas `public` catalogadas, todas com RLS habilitada; consulta de `information_schema.tables` não encontrou tabelas de turmas, vínculos docentes, matrículas ou instituições; consulta direcionada a `pg_policies` também não encontrou políticas desses recursos. Nenhum registro real de usuário ou aluno foi lido ou modificado.
- A suíte `supabase/tests/database/authorization_rls_p0.test.sql` verifica isolamento de proprietários em outros domínios; **não** equivale a teste RLS professor–turma.
- Security Advisor: aviso `auth_leaked_password_protection` desabilitado; é limitação comercial documentada do Free, não um controle resolvido neste ciclo.

## 2. Correção segura

Ajustado somente o contrato demonstrativo `listTeacherClassroomsDraft` para:
1. Rejeitar IDs vazios ou com whitespace externo, sem consultar o adaptador.
2. Exigir autorização explícita de contexto antes da leitura.
3. Exigir dependência independente `ActiveTeacherClassBindingVerifier` para cada turma retornada; a ausência dela retorna `unavailable` **antes** da consulta.
4. Validar escopo, registro e vínculo ativo antes de liberar cada item, recusando registros externos e malformados.
5. Não manter cache de vínculos: revogação é avaliada em cada chamada.
6. Fechar sem retornar dados parciais se a política, o verificador ou o leitor lançar erro.

Não foi adicionado verificador de produção. O tipo é uma **proposta técnica defensiva**, e não um papel/permissão canônica homologada. Um contrato em memória não substitui RLS na fonte de dados.

## 3. Cobertura de testes sintéticos

- Identidade ausente, malformada ou contexto inválido.
- Política ausente ou denegatória; recusa de escopos `self` inadequados.
- Adaptadores e verificadores ausentes; nenhum acesso à leitura.
- Filtro combinado de política por registro e vínculo docente ativo.
- Isolamento entre professores, inclusive quando a política de contexto é excessivamente permissiva.
- Revogação entre duas requisições.
- Falha de leitor, política ou vínculo sem erro sensível e sem linhas parciais.
- Rejeição de registros com identificadores inválidos ou de instituição divergente.

## 4. Limitações P0 / NO-GO operacional

Sem modelo canônico homologado de escola, turma, matrícula, vínculo docente e ciclo de revogação, **não** criar tabelas, políticas RLS, migrações ou funções privilegiadas. Antes de operar com dados reais: aprovar o modelo, definir autoridade dos vínculos e sua revogação, aplicar autorização por recurso no servidor, RLS na fonte de dados, testes pgTAP entre contas e contextos, logging mínimo/auditoria e revisão de segurança independente. Não usar claims editáveis (`user_metadata`) como autorização.

## 5. Validação e governança

- Os testes adicionados são unitários com usuários e turmas sintéticos; não provam comportamento de produção nem RLS professor–turma.
- Conferir CI do **HEAD final do commit** para classificar `VALIDADO`. Não transportar a aprovação do Ciclo 14.
- Manter PR #583 em draft. Não fazer merge, deploy, mudanças de segredos, políticas de produção, configurações Render, plano Free ou Auto Deploy.
- Conservar os bloqueios de assets Flonts oficiais maiores, revisão humana e validação de experiência real.

## 6. Próximo ciclo candidato

Após concluir CI do Ciclo 15, preparar ADR/matriz canônica de atores, instituições, turmas e vínculos; testes pgTAP isolados em ambiente descartável e homologação server-side. Somente desenvolver operações reais após decisão arquitetural explícita.
