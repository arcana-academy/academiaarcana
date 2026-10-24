# Academia Arcana — Ciclo 19 · Encaminhamentos formais prontos para revisão

**Estado:** MINUTAS DE ENCAMINHAMENTO / **NÃO ENVIADAS** / NÃO CANÔNICAS.
**Data:** 2026-10-09 · PR #583 · baseline `d77a948d663ffcfe7e2de8c9d1bfde28b58f12bc`.
**Regra:** apenas Chat 01 (Produto), Chat 02 (Arquitetura) e autoridades de Segurança/Trust podem deliberar conforme seus próprios processos. Esta PR e seus autores não aprovam decisões em nome deles.

## A. Encaminhamento ao Produto — domínio Chat 01

**Abrange:** DEP-C17-01, DEP-C17-04, DEP-C17-05, DEP-C17-06.
**Fonte:** `docs/product/AA-PRODUCT-1.0.md` §10, AA-PROD-002/009; `docs/product/AA-PRODUCT-REQUIREMENTS-1.0.md` AA-PROD-R018–020.

**Pedido de deliberação:**
1. Há aprovação para incorporar capacidade de gestão institucional/docente? Qual escopo, prioridade e status no catálogo canônico?
2. Quais personas e ações são legítimas (professor/tutor/mentor/estudante/administrador) e quais permanecem explicitamente proibidas?
3. Múltiplas turmas/instituições, delegação, transferência e validade fazem parte do primeiro incremento?
4. Matrícula/estudante e dados pessoais serão abrangidos? Que finalidade, limites, critérios de aceite e direitos de privacidade se aplicam?

**Saída mínima esperada:** decisão expressa `APROVAR/REJEITAR/AJUSTAR` **por tema**, requisitos com IDs no Chat 01/documentos de Produto, estados de capacidade, critérios negativos e impactos declarados. Sem documento ratificado => nenhuma das quatro DEP é fechada.

**Critério de não-confusão:** a página demonstrativa Professor → Turma A não constitui aceite de escopo, matrícula ou papel.

## B. Encaminhamento à Arquitetura — domínio Chat 02

**Abrange:** DEP-C17-02, DEP-C17-03, DEP-C17-04, DEP-C17-07.
**Fontes:** `docs/architecture/AA-ARCHITECTURE-1.0.md` §4/§8/§14; `src/core/architecture/domain-policy.ts`; `src/core/architecture/data-ownership.ts`; `src/core/authorization/contracts.ts`.

**Pedido de deliberação:**
1. Qual domínio possui semanticamente a instituição, turma e atribuição, sem transferir ownership de `context`, `education`, `authorization` ou `trust` indevidamente?
2. Quem pode criar/revogar o vínculo e como suas decisões são auditadas? Separar concessão de autoridade, conteúdo educacional e persistência.
3. Qual é o contrato de cardinalidade, expiração, suspensão e transferência com integridade interinstitucional?
4. Após autorização de Produto, qual modelo de porta/adaptador e RLS por linha e ação deve existir para impedir BOLA/IDOR e JWT stale?
5. Há ADR ou decisão existente que cubra **essas entidades concretas**, e não somente os princípios gerais?

**Saída mínima esperada:** ADR identificada, owner/supporting domains com justificativa, invariantes, matriz de dependências e interfaces tipadas, critérios de reversão e testes negativos; **não** alterar `data-ownership.ts` antes de ratificação.

**Limite de execução:** não transformar `aa_c16_isolated` em migration, policy deployável, schema remoto ou acesso funcional.

## C. Encaminhamento a Segurança, Trust e Operação

**Abrange:** DEP-C17-03, DEP-C17-05, DEP-C17-06, DEP-C17-07, DEP-C17-08.
**Fontes:** Arquitetura §14, `docs/security/AA-SEC-C17-TEACHER-CLASS-MATRIX.md`, `docs/architecture/AA-ARCH-C18-ISOLATED-IMPLEMENTATION-SPEC.md`.

**Pedido de deliberação:**
1. Aprovar/rejeitar matriz de grants por ator, contexto, recurso e operação, com **deny-by-default**.
2. Definir autoridade de revogação, segregação de funções, visibilidade da trilha, retenção e resposta a incidentes.
3. Exigir especificação da base legal, finalidade e minimização de dados estudantis antes de qualquer uso.
4. Aprovar ameaça BOLA/IDOR, testes contra views/RPC/storage, `RLS` / grants e execução somente em ambiente descartável.
5. Registrar responsáveis humanos por revisão independente, evidências de rollback/revogação e um veredito inequívoco GO/NO-GO.

**Saída mínima esperada:** matriz validada com negativas, plano de testes por operação, evidências de privacidade, revisão independente com responsável identificado e decisão formal; sem isso, manter NO-GO.

## Modelo de registro de decisão para qualquer autoridade

Preencher **na fonte canônica** do domínio, nunca inferir a partir deste arquivo:

- ID da pendência:
- Autoridade decisora verificada:
- Decisão (aprovar / rejeitar / solicitar ajustes):
- Link/ID da fonte primária ratificada:
- Contextos, atores, recursos e ações abrangidos:
- Dependências/ameaças e critérios de aceite negativos:
- Evidência de revisão/validação e data:
- Alterações de Produto/Arquitetura a reconciliar:
- Limite de implementação permitido:
- Status da pendência (ABERTA até evidência suficiente):

## Ordem recomendada de análise, sem promover prioridades canônicas

1. **Produto** define o que é produto e o que não é (01, 04, 05, 06).
2. **Arquitetura** desenha ownership e invariantes condicionados ao escopo (02, 03, 04, 07).
3. **Segurança/Trust/Operação** ratifica acesso, privacidade, testes e gates (03, 05, 06, 07, 08).
4. Resolver conflitos no mesmo chat canônico responsável, manter histórico e atualizar a matriz de decisão com o link primário.
5. **Só com todas as aprovações necessárias** decidir se haverá protótipo efetivo em ambiente isolado. Não conectar esta PR a produção.

**Importante:** estes são encaminhamentos preparados dentro da branch, **não mensagens enviadas, issues atribuídas, revisões humanas feitas ou decisões aprovadas**.
