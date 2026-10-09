# AA-ARCH-C18 — Registro de decisões DEP-C17-01–08 (auditoria, sem aprovação)

**Projeto:** Academia Arcana · **PR:** #583 · **Data:** 2026-10-09 · **Baseline:** `5bd7c8507e7f5bd22fa02e7eeeff4d298c8cb4ed`.
**Estado geral:** **PROPOSTO / NÃO CANÔNICO / SEM APROVAÇÃO DE PRODUTO OU ADR**.
**Autoridade:** documentos canônicos de Produto, Arquitetura e seus processos; este registro é insumo para revisão, não os substitui.

## 1. Evidências efetivamente verificadas

- `docs/product/AA-PRODUCT-1.0.md`, §10, AA-PROD-002 e AA-PROD-009: o catálogo oficial não comprova gestão institucional/docente; rota existente não significa capacidade operacional, e apenas Produto decide estado/prioridade.
- `docs/product/AA-PRODUCT-REQUIREMENTS-1.0.md`, AA-PROD-R018, R019 e R020: contexto mínimo/autorizado, estados de ausência/erro e requisitos com owner/dependências verificáveis.
- `docs/architecture/AA-ARCHITECTURE-1.0.md`, §4, §8 e §14: responsabilidades separadas por domínio, ownership sem troca por consumo, segurança em servidor + RLS.
- `src/core/architecture/domain-policy.ts`: `identity` não é autorização; `context` detém resolução de membership; `authorization` decide acesso; `education` possui conteúdo/estruturas; `trust` governa consentimento/auditoria; `data` é infraestrutura sem domínio universal.
- `src/core/architecture/data-ownership.ts`: lista **somente recursos operacionais registrados**; não contém instituição/turma/vínculo docente. **Não inserir recursos propostos neste registro sem decisão de owner.**
- `src/core/authorization/contracts.ts`: sem `AuthorizationPolicy`, `evaluateAuthorization` retorna `policy-denied`.
- `src/application/teaching/list-classrooms-draft.ts`: leitor/prova de vínculo independentes e sem adapter operacional; não conecta turmas reais.
- `docs/architecture/AA-ARCH-C16-INSTITUTION-CLASS-TEACHER-PROPOSAL.md`, `docs/architecture/AA-ARCH-C17-PRODUCT-ARCHITECTURE-CROSSWALK.md`, `docs/security/AA-SEC-C17-TEACHER-CLASS-MATRIX.md`: apenas propostas e testes sintéticos, não decisões ratificadas.

## 2. Registro de oito dependências (nenhuma fechada neste ciclo)

| Dependência | Estado atual | Proposta de autoridade decisora (não delegação formal) | Evidência exigida para fechar | Bloqueio se aberta |
| --- | --- | --- | --- | --- |
| **DEP-C17-01** Escopo de produto | **ABERTA — P0** | Produto / Chat 01 | Aprovação explícita em `docs/product/`: objetivos, usuários, módulos e prioridade institucional/docente, sem inferência por rota | Não ligar UI demonstrativa nem criar API |
| **DEP-C17-02** Ownership de estrutura e contexto | **ABERTA — P0** | Arquitetura / Chat 02 e Produto | ADR aprovada e registro de ownership futuro com owner semântico, supporting domains e ciclo de vida; esclarecer instituição × turma × atribuição | Não registrar tabelas institucionais como canônicas |
| **DEP-C17-03** Autoridade do vínculo | **ABERTA — P0** | Produto, Arquitetura e Trust | Fluxos explícitos de conceder, revogar, auditar; separação entre ator solicitante e concedente; trilha de auditoria e revogação | Sem insert/update/revoke operacionais |
| **DEP-C17-04** Multiplicidade, validade e delegação | **ABERTA — P0** | Produto e Arquitetura | Cardinalidade, transferências entre instituições, convites, expiração, suspensão e sincronização formalizados; critérios de transição e testes de borda | Modelo sintético não pode orientar migration |
| **DEP-C17-05** Matriz por ação/recurso | **ABERTA — P0** | Produto e Authorization / Arquitetura | Tabela ratificada `actor × institution × resource × action` para read, create, update, delete, share, export; negativas para tutor/admin | Negar todos os grants novos |
| **DEP-C17-06** Matrículas e dados pessoais | **ABERTA — P0** | Produto, Trust e Arquitetura | Regras LGPD, minimização, retenção, finalidade, titulação, consentimento/base adequada, direitos de sujeitos e escopo de resultados | Zero exposição de aluno, avaliação individual ou relatório identificável |
| **DEP-C17-07** RLS/claims e serviço verificador | **ABERTA — P0**, prova sintética disponível | Arquitetura e Segurança | Política por tabela e operação na sandbox, sem claims editáveis; testes negativos de intercontas, função, views, RPC, role e revogação efetiva | Teste `aa_c16_isolated` não substitui segurança real |
| **DEP-C17-08** Transição, rollback e sign-off | **ABERTA — P0** | Segurança/Operações + revisores independentes | Plano de ambientes, threat model, testes migratórios/reversão, evidência revisável por HEAD, aprovação humana, decisão GO/NO-GO | Merge, deploy e integração real continuam proibidos |

Nenhuma linha equivale a aprovação humana. O prefixo `DEP-C17-*` é apenas identificador de pendência registrado na proposta.

## 3. Matriz de decisão por domínio (RACI PROPOSTO, não ratificado)

| Domínio | Conhecimento/regra que já lhe cabe | Hipótese a validar (não alterar `DOMAIN_POLICIES`) | Saída necessária |
| --- | --- | --- | --- |
| Produto (Chat 01) | Escopo, prioridade, aceitação, linguagem de capacidade | Gestão institucional pode virar capacidade nova? | Requisitos e decisão positiva/negativa explícitos |
| `identity` | Sujeito e ciclo de identidade | Como provar actor e revogação de sessão? | Contrato de subject autenticado |
| `context` | Contexto/membership, não autorização | Origem/validade do vínculo professor–instituição? | Contrato de contexto assinado por Arquitetura |
| `education` | Estruturas educacionais, não decisão de acesso | Owner da turma como estrutura, limites com context? | ADR com semântica de turma |
| `authorization` | Policy e avaliação por recurso | Grants por ação e linha; revogação/cross-tenant | Matriz ratificada e políticas testáveis |
| `trust` | Governança, consentimento e registro de auditoria | Quem cria/revoga, qual trilha e proteção de dados? | Governança e especificação de privacidade |
| `data` | Persistência e adaptadores, sem direito de negócio | Como materializar constraints/RLS só depois do aceite? | Plano técnico isolado e rastreável |
| Segurança/Operações | Gates de risco e implantação | Qual prova suficiente, quem revisa, como retornar? | Checklist e veredito independente |

**GAP de rastreabilidade comprovado:** o registro canônico de ownership não contém entidades institucionais; o C17 sugeria donos candidatos sem registrar as oito pendências em uma matriz executável de sign-offs. Fechamento correto neste ciclo: documentar o vazio, não preenchê-lo com recursos inexistentes.

## 4. Critérios objetivos para encerrar as pendências

Cada item `DEP-C17-01–08` exige (1) autoridade ratificada, (2) documento/ADR canônico nomeado, (3) critério de aceite ligado ao recurso/ator/ação, (4) teste ou revisão independente relevante, (5) assinatura/resolução explícita. **Não contar** docs desta PR, PR aberta, `success` de fixture ou hipótese de owner como esses cinco requisitos.

Se alguma decisão necessária não existir, o estado segue **ABERTA** e o futuro protótipo permanece `NO-GO` operacional. Decisões pré-existentes em Produto/Arquitetura permanecem inalteradas.

## 5. Revalidação do Ciclo 19 (2026-10-09)

**Estado preservado:** DEP-C17-01–08 = **8/8 ABERTAS; 0 FECHADAS**. A validação foi reexecutada contra `docs/product/`, `docs/architecture/`, `domain-policy.ts`, `data-ownership.ts` e evidências disponíveis da PR. Não foi localizado ato específico de homologação institucional. Nenhum princípio canônico antigo foi reaberto.

- Veredito individual com evidências e lacunas: `docs/architecture/AA-ARCH-C19-CANONICAL-DECISION-EVIDENCE.md`.
- Minutas de encaminhamento para a autoridade do Produto, Arquitetura e Segurança/Trust/Operação: `docs/architecture/AA-ARCH-C19-FORMAL-HANDOFFS.md`.
- Checkpoint do ciclo: `docs/visual/MEGAOPERACAO-CICLO-19.md`.

**Condição:** documentos de encaminhamento e comentários da PR não encerram DEP alguma. Somente decisão na fonte canônica, aceite e revisão apropriados justificam transição de estado. Sem GO operacional, sem migração, merge ou deploy.
