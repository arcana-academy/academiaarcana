# AA-ARCH-C16 — Instituições, turmas e vínculos docentes

**Estado:** CONSOLIDADO COMO PROPOSTA DE CONTRATO / **NÃO CANÔNICO** para implementação operacional.  
**Data:** 2026-10-09. **PR:** #583. **Baseline do ciclo:** `7d3fc270167d9db3b80e7e1a5ddf1b1e4db3c890`.

## 1. Precedência e decisões preservadas

- Autoridade de Produto permanece nos documentos `docs/product/`; o desenho de dados não autoriza ampliar escopo canônico de módulos.
- Arquitetura `docs/architecture/AA-ARCHITECTURE-1.0.md` separa identidade/contexto/autorização e trata RLS como defesa que **complementa** a autorização de aplicação.
- `src/core/authorization/contracts.ts` exige decisão explícita e nega quando não existe política.
- `src/application/teaching/list-classrooms-draft.ts` adiciona exigência de verificador independente para vínculo professor–turma; **não existe adaptador operacional**.
- O projeto Supabase foi auditado em leitura no Ciclo 15: não se identificou esquema de instituições, turmas ou vínculos docentes. Testes de RLS existentes protegem outros domínios.
- A interface Professor → Turma A continua demonstrativa, sem dados escolares ou permissões reais.

## 2. Modelo relacional candidato (PROPOSTA / decisão pendente)

| Entidade conceitual | Identidade candidata | Relação | Limite de dados |
| --- | --- | --- | --- |
| Instituição | `institution_id` UUID | contexto institucional | somente identificação mínima autorizada |
| Turma | `classroom_id` UUID + `institution_id` | pertence a exatamente uma instituição | dados de turma não incluem matrícula implícita |
| Vínculo docente–turma | `actor_id`, `classroom_id`, `institution_id` | atribuição explícita e revogável | estado ativo, revogação, validade temporal |
| Estudante/matrícula | **fora do contrato implementado** | exige modelo de titularidade e consentimentos | nenhum dado pessoal neste ciclo |

Não inferir acesso de `user_metadata`, URL, nome visual da turma, contexto selecionado no cliente ou mera autenticação. `app_metadata` ou claims também exigem cuidado com expiração e revogação. Permissão professor–turma precisa ser confirmada no servidor e no banco com identidade confiável.

## 3. Matriz de autorização candidata (a homologar)

| Ator/contexto | Ler turma | Ler vínculo de outro docente | Escrever vínculo | Ler dados de estudantes |
| --- | --- | --- | --- | --- |
| Anônimo | Negar | Negar | Negar | Negar |
| Usuário autenticado sem vínculo | Negar | Negar | Negar | Negar |
| Docente com vínculo válido para a turma | Candidato: permitido, somente no escopo | Negar | Negar por padrão | **Negar até política específica aprovada** |
| Docente com vínculo revogado/expirado | Negar | Negar | Negar | Negar |
| Docente de outra instituição/turma | Negar sem vínculo explícito | Negar | Negar | Negar |
| Administrador institucional | **pendente de contrato de papel/escopo** | Pendente de autorização específica | Pendente | Negar por padrão |

**Regras candidatas:** FK composta de turma + instituição para impedir associação cruzada; RLS `TO authenticated` mais predicado de vínculo atual; sem `SECURITY DEFINER`; sem grants `anon`; concessões de escrita apenas após contrato de autorização, auditoria e política `USING`/`WITH CHECK`; atualização/revogação refletida em cada nova consulta, não dependente de role claim stale.

## 4. Protótipo de teste isolado (NÃO migração)

`supabase/tests/database/teacher_class_contract_c16.test.sql` cria `aa_c16_isolated.*` **apenas** dentro de `BEGIN … ROLLBACK`, com 20 assertions pgTAP sintéticas para:
- acesso anônimo e sem identidade;
- leitura apenas de turmas com vínculo legítimo e corrente;
- isolamento entre professores, turmas e instituições;
- rejeição de `user_metadata` editável como concessão;
- prevenção de falsificação, alteração e exclusão de vínculos pelo papel `authenticated`;
- FK composta contra vínculos com instituição inconsistente;
- revogação imediata e recuperação somente após reativação explícita.

O workflow `.github/workflows/database-tests.yml` invoca esse arquivo **somente após inicializar Supabase local descartável**. Nenhuma migration de produção ou alteração persistente de esquema é criada. Um green CI prova só o **modelo candidato neste ambiente**, não políticas reais de turmas em produção.

## 5. Dependências de aprovação

1. Produto/Arquitetura homologar limites de instituição, turma, vínculo, múltiplos papéis, delegação, validade temporal e políticas de revogação.
2. Autoridade de governança aprovar onde/via quem vínculos são criados, atualizados, revogados e auditados.
3. Estabelecer contrato canônico de matrículas e tratamento de dados educacionais antes de usar dados de estudantes.
4. Criar eventual migration **apenas depois** da decisão canônica e testá-la em ambiente não produtivo com RLS/pgTAP negativos. Submeter auditoria independente.
5. Não conectar a UI demonstrativa a APIs/tabelas reais antes desses checkpoints.

**Veredito:** regras pré-existentes preservadas; a materialização institucional é **PROPOSTA P0 pendente**, não decisão fechada. Sem merge, deploy, mudança de produção ou Auto Deploy.
