# AA-ARCH-C18 — Especificação técnica de implementação isolada (NÃO EXECUTÁVEL)

**Estado:** **PROPOSTA / DEP-C17-01–08 ABERTAS / NO-GO OPERACIONAL**.
**2026-10-09 · PR #583 · Baseline `5bd7c8507e7f5bd22fa02e7eeeff4d298c8cb4ed`.**
Este texto NÃO é migration, ADR ratificada, política deployável nem autorização para acessar dados reais.

## Objetivo e não objetivos

**Objetivo:** permitir futura prova **isolada e reproduzível** de `actor × action × resource × institution`, inclusive vínculos docentes revogáveis, sem misturar autenticação, contexto e concessão.

**Fora do escopo:** plataforma multi-institucional operacional, enrollment, nomes/emails reais, relatórios, notas, dados de crianças, tutor/admin operacional, grants produtivos, alteração do catálogo Produto, alteração de `data-ownership.ts` ou das políticas em `DOMAIN_POLICIES`.

## Portas de decisão (GO/NO-GO antes de implementar)

- **G0 — produto**: DEP-C17-01 e 06 concluídas por autoridade competente; classificar explicitamente a capacidade e o dado do estudante.
- **G1 — arquitetura**: DEP-C17-02, 03, 04 concluídas; owner semântico de instituição, turma e vínculo; invariantes, transições e autoridade de eventos.
- **G2 — segurança**: DEP-C17-05 e 07 concluídas; matriz por recurso/ação aprovada, ameaça BOLA/IDOR, revogação não dependente de `user_metadata`/claims desatualizados, proteção contra bypass.
- **G3 — teste/ops**: DEP-C17-08 concluída; ambiente sandbox descartável, credenciais não-prod, auditoria, plano de reversão, revisão humana independente.

**Sem G0–G3:** somente documentos e fixtures sintéticas de prova são permitidos; **não criar migration**, endpoint ou conexão com dados reais.

## Contratos propostos (camadas e fronteiras)

1. **IdentityResolver** (`identity`): obtém `actorId` de sessão validada no servidor. Rejeita anon, sessão inválida/revogada e impersonation de cliente. Não concede papel.
2. **ContextResolver** (`context`): valida `institutionId` de origem confiável, associação da turma ao contexto e eventual membership. Nunca decide acesso.
3. **TeacherBindingReader** (`context`/owner a decidir): consulta fonte autoritativa do vínculo no mesmo request; distingue `active/revoked/expired` e transições a homologar. É **apenas proposta**, não implementado.
4. **AuthorizationPolicy** (`authorization`): recebe `actorId, action, resourceId, contextId`; retorna decisão explícita, *default deny*. Ler turma **não** implica ler aluno, editar, criar vínculo ou exportar.
5. **DataAdapter** (`data`): consulta com escopo institucional e RLS dentro do banco, não filtra apenas em UI; não usa service-role client-side, SECURITY DEFINER ou views que ignoram RLS.
6. **Audit/Trust**: atribuição, revogação, falhas críticas e operação privilegiada possuem trilha mínima, finalidade, retenção e controle de acesso aprovado.
7. **UI demonstrativa**: permanece sem networking operacional e sem student records; exibe estados `denied`, `unavailable`, `empty` de modo distinguível.

O contrato `src/application/teaching/list-classrooms-draft.ts` prova parte da negação por padrão em memória, **sem implantar** essas dependências. O teste SQL `aa_c16_isolated` é prova **separada**, não DB adapter.

## Identidades, entidades e ciclo de vida: candidatura, não decisão

- Instituição: identidade técnica candidata UUID; relação jurídica/administrativa, mudanças de escopo e acesso interinstitucional pendentes.
- Turma: UUID + instituição; FK composta candidata, sem acesso automático a matrícula, avaliações, relatórios ou identidades estudantis.
- Vínculo docente: `actorId × institutionId × classroomId × status × revokedAt × expiresAt`; estados, tempo e multiplicidade **a homologar**. Revogação deve invalidar leitura em nova requisição, sem depender de JWT antigo.
- Matrícula: nenhuma entidade ou fixture de dados pessoais deve ser implantada até DEP-C17-06.
- Eventual convites, administrador, tutor, delegação, suspensão, transferência e acesso de emergência: **NO-GO** até políticas específicas.

## Sequência de implementação quando aprovada (NENHUMA etapa executada neste ciclo)

1. Criar ambiente isolado e efêmero, sem replicar dados reais e sem segredos de produção.
2. Especificar recursos e owners em ADR; validar transições e integridade referencial da proposta.
3. Preparar **migration de sandbox separada**, sob aprovação, com RLS de todas as tabelas e grants mínimos; `anon` negado, `authenticated` sem concessão apenas por role; checar acesso via API, RPC, views/security_invoker e storage.
4. Testar ator anônimo, usuário sem vínculo, docente A e B na mesma instituição, docente em instituições distintas, vínculo expirado/revogado, `user_metadata` falsificado, IDs arbitrários e erro do verificador.
5. Para criação/edição, validar `USING`/`WITH CHECK` e auditoria por ator autorizador; nenhum grant de escrita sem aprovação.
6. Verificar rollback/idempotência e restauração apenas em ambiente efêmero; registrar SHA, workflow, logs e exceções sanitizadas.
7. Pedir revisão humana e assinatura explícita de G0–G3. Não transferir automaticamente para produção nem propor merge na #583.

## Matriz de testes exigida e evidência atual

| ID de caso | Objetivo | Evidência atual no Ciclo 17 | Para GO operacional |
| --- | --- | --- | --- |
| TC18-01 | anon sem leitura/escrita | C16-001/002, C17-023 | Reexecutar contra schema aprovado |
| TC18-02 | authenticated sem vínculo | C16-003/004, C17-024 | Negativa API/BD real |
| TC18-03 | docente A vs B na mesma instituição | C16-005/014/015 | Isolamento intercontas RLS real |
| TC18-04 | docente em instituição diversa | C16-008/013 | Policy por contexto real |
| TC18-05 | revogação/expiração + JWT stale | C16-007/008/019/020 | Revalidação no servidor e SQL |
| TC18-06 | metadados forjados | C16-016/017, C17-029 | Claims user-editable e token antigo |
| TC18-07 | criação/edição/deleção de vínculo | C16-010/011/012, C17-022 | Policy de concessão ratificada |
| TC18-08 | escrita em turma | C17-025/026/027 | Grants exatos por ação |
| TC18-09 | instituição sem role grant ou RLS fraca | C17-021/023/024/028/029; **C18-030–034** | Testar esquema institucional aprovado |
| TC18-10 | recursos estudantis, relatório e export | **AUSENTE** | Contrato de dados pessoais e testes específicos |
| TC18-11 | falha de policy/verificador sem parcial | testes unitários da listagem draft | API e observabilidade |
| TC18-12 | mudança de owner/registros canônicos | **AUSENTE** | ADR formal e registro, sem inferência |

**Limites da evidência:** pgTAP da fixture sintética só testa a hipótese. `CI green` não é revisão humana, sign-off, validação de API real ou certificação LGPD.

## Aprovação necessária

O material deve ser devolvido aos domínios Produto, Arquitetura, Authorization/Trust e Segurança/Operações para fechar DEP-C17-01–08 com evidência. Sem confirmação dessas fontes, **NO-GO** para implementar o modelo institucional real.
