# Academia Arcana — Ciclo 19 · Verificação de evidências para DEP-C17-01–08

**Data de corte:** 2026-10-09 · **PR:** #583 · **Baseline examinado:** `d77a948d663ffcfe7e2de8c9d1bfde28b58f12bc`.
**Classe:** auditoria / encaminhamento de decisões, **NÃO CANÔNICO**.
**Veredito desta revisão:** **0/8 dependências encerráveis**, **8/8 ABERTAS** por falta de documentos ratificados, critérios específicos e sign-off. Isso **não** invalida controles gerais ou provas locais já validados.

## 1. Fontes consultadas e método

1. `docs/product/AA-PRODUCT-1.0.md`, §10 e AA-PROD-002/009; `docs/product/AA-PRODUCT-REQUIREMENTS-1.0.md` AA-PROD-R018–020.
2. `docs/architecture/AA-ARCHITECTURE-1.0.md` §4, §8 e §14; `src/core/architecture/domain-policy.ts` e `src/core/architecture/data-ownership.ts`.
3. `src/core/authorization/contracts.ts` e `src/application/teaching/list-classrooms-draft.ts`.
4. Histórico/documentação desta PR: `docs/architecture/AA-ARCH-C16-INSTITUTION-CLASS-TEACHER-PROPOSAL.md`, `AA-ARCH-C17-PRODUCT-ARCHITECTURE-CROSSWALK.md`, `AA-ARCH-C18-DECISION-REGISTER.md` e `docs/security/AA-SEC-C17-TEACHER-CLASS-MATRIX.md`.
5. Consultas GitHub no repositório: PR #583 em estado draft; endpoint `/pulls/583/reviews` retornou **0 revisões** na consulta; buscas direcionadas por `professor`, `turmas` e termos de vínculo não encontraram decisão institucional ratificada. Busca negativa não garante inexistência em todos os sistemas externos.
6. Comparação direta das árvores Git da `main` (`cc17653dfe79c44dd83ba1ced8cb065383b11ca9`) e do HEAD de entrada: os três blobs `AA-PRODUCT-1.0.md`, `AA-ARCHITECTURE-1.0.md` e `data-ownership.ts` são **idênticos**. Logo, nenhum desses contratos foi alterado pela PR para homologar entidades docentes.

**Regra de evidência:** comentário do autor, aprovação de executar um ciclo, `CI green`, rota de demonstração e teste `aa_c16_isolated` não equivalem a decisão formal de Produto, ADR aprovada, política de autorização real ou revisão humana independente.

## 2. Matriz de suficiência por dependência

| ID | Decisão específica ainda faltante | Princípio canônico disponível | Evidência específica ratificada? | Estado | Encaminhamento proposto |
| --- | --- | --- | --- | --- | --- |
| DEP-C17-01 | Escopo, personas, módulos e prioridade institucionais | AA-PROD-002/009; catálogo de Produto | **NÃO**: rota Professor não está homologada como capacidade real | **ABERTA / P0** | Produto / Chat 01 |
| DEP-C17-02 | Owner semântico de instituição, turma e vínculo, ciclo de vida | Arquitetura §4/§8; registry de ownership | **NÃO**: não constam recursos docentes no registry nem ADR específica | **ABERTA / P0** | Arquitetura / Chat 02 + Produto |
| DEP-C17-03 | Autoridade de concessão, revogação, trilha e segregação de funções | Context/Authorization/Trust separados | **NÃO**: sem ator concedente ou política aprovada | **ABERTA / P0** | Produto, Arquitetura, Trust |
| DEP-C17-04 | Multiplicidade, delegação, expiração, suspensão e transferência | Validação de contexto e revogação são princípios | **NÃO**: cardinalidade e transições são hipótese de fixture | **ABERTA / P0** | Produto + Arquitetura |
| DEP-C17-05 | Matriz `actor × resource × action × institution` por papel | Autorização explícita e default deny | **NÃO**: matriz da PR é PROPOSTA, não grant autorizado | **ABERTA / P0** | Produto + Autorização |
| DEP-C17-06 | Matrícula, finalidade e minimização de dados pessoais | Trust, minimização, AA-PROD-R018 | **NÃO**: contrato institucional de matrículas não definido | **ABERTA / P0** | Produto + Trust + Arquitetura |
| DEP-C17-07 | Schema verdadeiro, RLS por recurso, verifier e claims | Arquitetura §14; tests sintéticos RLS | **NÃO**: `aa_c16_isolated` só demonstra hipótese local | **ABERTA / P0** | Arquitetura + Segurança |
| DEP-C17-08 | Gate de rollout, reversão, revisão humana e GO/NO-GO | Quality Gate do projeto + governança | **NÃO**: sem sign-off e teste de implementação real | **ABERTA / P0** | Segurança + Operação |

A ausência de evidência específica é **bloqueio**, não contradição com princípios canônicos existentes. O estado de todos os itens permanece ABERTA; nenhuma recomendação deste documento altera decisões anteriores.

## 3. Protocolo para encerramento futuro de **cada** pendência

Um item só poderá mudar para `FECHADA` após evidência verificável e atribuível:

- **Fonte primária:** link para documento do domínio, ADR ou decisão canônica identificada (não este dossiê).
- **Autoridade confirmada:** responsável autorizado nominal/organizacionalmente, decisão expressa e data.
- **Rastreabilidade:** ID do requisito/ADR e qual operação/recurso/contexto cobre, incluindo casos negativos.
- **Validação apropriada:** revisão de Produto/Arquitetura/Segurança, testes somente quando necessários; testes não substituem decisão normativa.
- **Impacto:** compatibilidade com ownership, dados estudantis, escopo, RLS e contratos existentes, com plano de migração apenas se autorizado.
- **Conflito:** quando houver divergência, estado `CONFLITO — ESCALAR`, sem editar decisões ratificadas ou marcar resolvida por inferência.

**Qualquer campo obrigatório ausente => ABERTA.** Fechamentos futuros devem registrar *o que mudou*, *quem decidiu*, *onde está o ato canônico*, *qual evidência o valida* e *qual gate foi desbloqueado*.

## 4. Resultado limitado dos testes

- `src/application/teaching/list-classrooms-draft.test.ts` cobre comportamento demonstrativo de negação por padrão.
- `supabase/tests/database/teacher_class_contract_c16.test.sql` tem **34 asserções sintéticas** C16/C17/C18, sob `BEGIN…ROLLBACK`, executadas no Supabase local do CI.
- **Nenhuma nova lacuna de teste comprovada** nesta auditoria que justifique alterar o código/testes sob decisão normativa pendente. As lacunas remanescentes dependem de contrato aprovado e esquema real inexistente; criar testes de uma regra de negócio não aprovada seria antecipar decisão.

## 5. Artefatos para análise humana

Solicitações propostas, não enviadas nem aprovadas, estão em `docs/architecture/AA-ARCH-C19-FORMAL-HANDOFFS.md`. Checkpoint desta revisão em `docs/visual/MEGAOPERACAO-CICLO-19.md`.

**Conclusão:** revisão canônica completa no escopo verificável; 0/8 encerramentos; **NO-GO** para RLS operacional, matrícula real, merge, deploy ou alteração de produção.
