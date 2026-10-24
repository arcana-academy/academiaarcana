# Academia Arcana — Ciclo 17 · Revisão de Produto × Arquitetura para Instituições e Turmas

**Estado:** AUDITORIA CONSOLIDADA; MODELO OPERACIONAL **PROPOSTO / NÃO HOMOLOGADO**.
**Data:** 2026-10-09 · **PR:** #583 · **Baseline:** `ff245ec1cb000a90c1641b741eb206b5763f5a6d`.

## 1. Fontes de autoridade verificadas

| Origem canônica | Regra constatada | Consequência para a proposta C16 |
| --- | --- | --- |
| `docs/product/AA-PRODUCT-1.0.md`, §10 e AA-PROD-002 | O mapa oficial contém módulos do produto estudantil; rota existente não comprova capacidade concluída | Portal do Professor, instituições, turmas e matrículas **não são reclassificados como módulos operacionais** por esta PR |
| `docs/product/AA-PRODUCT-1.0.md`, AA-PROD-009 | Produto define a fonte canônica de prioridades e estados | Esta revisão não altera prioridades ou catálogo sem decisão do Chat 01 |
| `docs/product/AA-PRODUCT-REQUIREMENTS-1.0.md`, AA-PROD-R018/R019/R020 | Contexto autorizado e mínimo; estados de erro; proprietário e aceitação por requisito | Tratar indisponível ≠ autorizado; especificar ownership e prova antes de expor dados |
| `docs/architecture/AA-ARCHITECTURE-1.0.md`, §4 | `identity`, `context`, `authorization`, `education`, `trust`, `data` possuem responsabilidades separadas | Contexto não decide autorização; Data não detém regras de negócio; Educação não pode dispensar política de acesso |
| `docs/architecture/AA-ARCHITECTURE-1.0.md`, §14 | Mínimo privilégio, autorização server-side, RLS, validação, minimização e não confiar em frontend | Concessão de sessão e UI nunca bastam para acesso de recurso |
| `src/core/authorization/contracts.ts` | Policy explícita e `policy-denied` por ausência de policy | Nenhuma permissão implicitamente habilitada |
| `src/application/teaching/list-classrooms-draft.ts` | Verificador de vínculo independente por turma, sem implementação real | Contrato permanece demonstrativo e NÃO habilita API operacional |
| `docs/architecture/AA-ARCH-C16-INSTITUTION-CLASS-TEACHER-PROPOSAL.md` | Entidades e permissões registradas como propostas | Sem decisões canônicas novas; apenas refino de requisitos/ameaças |

## 2. Fronteiras de ownership — hipóteses para deliberação, não decisões

| Informação/regra | Domínio candidato | Bloqueio de homologação |
| --- | --- | --- |
| Identidade de `actorId`, sessão verificada, revogação de sessão | `identity` | Separar login de autoridade docente |
| Seleção confiável de `institutionId`, pertença contextual, hierarquia turma/instituição | `context` com `education` para estrutura educacional | Definir origem de associação e ciclo de vida sem fundir os domínios |
| Permitir/negar `actor × action × resource × context`, negar exportações implícitas | `authorization` | Mapear grants por operação e por recurso, sem flags editáveis do usuário |
| Turma como estrutura educacional e recursos pedagogicamente associados | `education` | Verificar com Produto escopo não presente no catálogo atual |
| Governança de convites, atribuições/revogações, auditoria e resposta a incidente | `trust` em coordenação com `context` | Definir autoridade e evidências, sem conceder superusuário |
| Persistência, integridade referencial, restrições e RLS | `data` implementa, sem possuir os direitos de negócio | Implementar **após** matriz aprovada, com rollback/negative tests |

**Nenhum desses mapeamentos cria um domínio `teaching` independente, muda catálogo canônico, nem concede permissão.**

## 3. Decisões pendentes: bloqueios por identificador proposto

| ID de pendência (não ADR aprovado) | Questão | Autoridade para fechar | Critério verificável |
| --- | --- | --- | --- |
| DEP-C17-01 | Existe escopo de produto para gestão institucional, portais docentes e matrículas? Qual prioridade? | Produto (Chat 01) | Requisito e módulo aprovados em `docs/product/`, sem inferir por rota |
| DEP-C17-02 | Estrutura pertence a `education`, pertença a `context`; quem governa seu ciclo de vida? | Arquitetura (Chat 02) | ADR e ownership com fronteiras testadas |
| DEP-C17-03 | Quem atribui, revoga e audita vínculo docente? Que papéis podem fazê-lo? | Produto + Arquitetura + Trust | Fonte autoritativa, revogação, trilha e separação de funções |
| DEP-C17-04 | O docente pode estar em múltiplas instituições e turmas? Delegação? Expiração? | Produto + Arquitetura | Invariantes, índices e testes por contexto aprovados |
| DEP-C17-05 | O que docentes, estudantes, tutores e administradores podem ler/escrever/exportar? | Produto + Autorização | Matriz por ação/recurso, inclusive negativas, homologada |
| DEP-C17-06 | Qual modelo de matrícula, dados pessoais, consentimento e minimização? | Produto + Trust + Arquitetura | Especificação de acesso/privacidade; nenhuma exposição automática |
| DEP-C17-07 | Forma de RLS, uso de claims e serviço técnico de verificação? | Arquitetura + Segurança | Políticas por recurso e ambiente descartável, sem `user_metadata` nem bypass |
| DEP-C17-08 | Controles de transição para dados reais, rollback e revisão independente? | Segurança + Operação | Checklist NO-GO cumprido e evidências reprodutíveis |

## 4. Critérios para um futuro protótipo não produtivo

- **AA-C17-AC-01:** identidade verificada no servidor; actor/context inválidos negados antes de ler.
- **AA-C17-AC-02:** recurso fora da instituição, outra turma ou papel sem vínculo vigente: negar; não filtrar só na UI.
- **AA-C17-AC-03:** vínculo expirado, suspenso, revogado ou com instituição divergente não concede leitura.
- **AA-C17-AC-04:** operações `create/update/delete/share/export` negadas por padrão, com políticas separadas se aprovadas.
- **AA-C17-AC-05:** estudante, matrícula, avaliações e relatórios com dados pessoais **sem acesso** por simples vínculo docente; regras específicas e minimização antes.
- **AA-C17-AC-06:** nenhuma permissão deriva de `user_metadata`, slug, query string ou componente visual.
- **AA-C17-AC-07:** alterações de vínculo exigem auditoria, autorização de quem alterou e revogação observável em nova consulta, sem depender de JWT desatualizado.
- **AA-C17-AC-08:** esquema exposto exige RLS em **todas** as tabelas; grants mínimos; considerar funções, views, RPC, storage e bypass.
- **AA-C17-AC-09:** testes intercontas devem usar pelo menos dois docentes, duas instituições, ausência de vínculo, revogação, expiração, ator falso e escrita negada.
- **AA-C17-AC-10:** teste operacional exige ambiente descartável e rollback completo, testes de migração/reversão, sem dados reais, avaliação humana e revisão independente.
- **AA-C17-AC-11:** retorno de API não revela parcialmente registros se verificador ou policy falhar; diferenciar `denied` de `unavailable`.
- **AA-C17-AC-12:** zero mudança de esquema ou acesso produtivo antes de assinatura das autoridades de Produto, Arquitetura e Segurança.

## 5. Limite de evidência e achado corrigido

O arquivo `supabase/tests/database/teacher_class_contract_c16.test.sql` protegia `classrooms` e `teacher_assignments` por RLS, mas a tabela sintética `institutions` não tinha a proteção explicitamente habilitada (apesar de não ter privilégios de leitura concedidos). **Gap demonstrável de defesa em profundidade da própria prova local**, não vulnerabilidade demonstrada em produção.

Correção do Ciclo 17: RLS também em `aa_c16_isolated.institutions`, além de **9 novas assertivas pgTAP C17-021–029**, incluindo inspeção de `relrowsecurity`, negação de UPDATE de vínculos e de leituras/escritas em instituições/turmas por atores sem permissão. **Total 29 assertions** (20 C16 + 9 C17) sob `BEGIN/ROLLBACK` em Supabase local descartável.

O esquema `aa_c16_isolated` permanece hipótese de teste e não foi convertido em migração. As tabelas reais de instituições/turmas não estão implementadas por este ciclo. O resultado do CI não será interpretado como homologação canônica.

## 6. Próxima decisão

Produto deve decidir escopo/papel docente, Arquitetura deve aprovar propriedade de entidades e transições, e Segurança deve homologar permissões, matrículas e teste isolado da implementação real. **NO-GO** até então.
