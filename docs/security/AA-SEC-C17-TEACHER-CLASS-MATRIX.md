# AA-SEC-C17 — Matriz de autorização proposta e roteiro de testes

**Status:** PROPOSTA PARA HOMOLOGAÇÃO · **Não concede permissões** · **PR #583 / 2026-10-09**.
**Fonte:** `docs/architecture/AA-ARCH-C16-INSTITUTION-CLASS-TEACHER-PROPOSAL.md` + `AA-ARCH-C17-PRODUCT-ARCHITECTURE-CROSSWALK.md`.

| Ator no contexto | Ler instituição | Listar/ler turma | Ler vínculo próprio | Ler vínculo alheio | Criar/alterar/revogar vínculo | Escrever turma | Ler dados estudantis | Exportar/compartilhar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Anônimo | Negar | Negar | Negar | Negar | Negar | Negar | Negar | Negar |
| Autenticado sem vínculo | Negar | Negar | Negar | Negar | Negar | Negar | Negar | Negar |
| Docente com vínculo ativo | Pendente; negar direto por padrão | Proposta: leitura na turma autorizada | Proposta: apenas mínimo, se necessário | Negar | Negar | Negar | **Negar até política específica** | Negar |
| Docente de outra turma/instituição | Negar | Negar para recurso não vinculado | Limitar ao próprio | Negar | Negar | Negar | Negar | Negar |
| Docente com vínculo expirado/revogado | Negar | Negar | Pendente; nunca conceder via vínculo inativo | Negar | Negar | Negar | Negar | Negar |
| Docente com múltiplos vínculos válidos | Pendente | Proposta: apenas classes com grant atual | Proposta: somente os próprios | Negar | Negar | Negar | Negar | Negar |
| Tutor/Mentor (papel não aprovado) | Negar | Negar | Negar | Negar | Negar | Negar | Negar | Negar |
| Estudante/matriculado (modelo pendente) | Negar | Negar | Negar | Negar | Negar | Negar | Definir apenas após domínio próprio | Negar |
| Administrador institucional (papel pendente) | Negar por padrão | Negar por padrão | Negar por padrão | Negar por padrão | Negar por padrão | Negar por padrão | Negar | Negar |
| Serviço privilegiado | **não presumir** | **não presumir** | **não presumir** | **não presumir** | **não presumir** | **não presumir** | **não presumir** | **não presumir** |

`Pendente` significa decisão necessária, **não** autorização implícita. Exportação exige regra distinta de leitura. Vínculo docente não implica acesso à matrícula nem dados individuais.

## Testes de contrato que deverão existir antes de qualquer API real

| Caso | Tipo de teste | Aceite |
| --- | --- | --- |
| Identidade ausente ou contexto cliente forjado | Servidor + RLS | Sem acesso e sem consulta indevida |
| Sem vínculo ou vínculo de outra turma | PostgreSQL com atores A/B + aplicação | Nenhuma linha ou metadado de outro contexto |
| Revogação/expiração com JWT ainda válido | PostgreSQL + API em sandbox | Revogação refletida em consulta subsequente |
| Papel de administrador não homologado | Aplicação + RLS | Negação mesmo autenticado |
| Tentativa de inserir, promover, reatribuir ou apagar vínculo | DML negativo | Negado a docentes; teste de `USING` e `WITH CHECK` quando regras de escrita existirem |
| Tentativa de criar/alterar/apagar turma | DML negativo | Negado por padrão |
| Lista/exportação em lote e query com ID arbitrário | API/BD | Escopo filtrado no banco, nunca apenas na UI |
| Leitura de estudantes/matrículas, relatórios e avaliações | RLS por recurso e contexto | Sem acesso até requisitos específicos aprovados |
| Tabelas em esquema exposto, views, RPC e storage | Auditoria de privilégios | RLS e grants mínimos; nada com bypass indevido |
| Dependências indisponíveis | API | Sem linhas parciais, sem stack trace sensível |
| Isolamento e reversão do banco de ensaio | CI local | Dados sintéticos; rollback; sem projeto remoto |

## Cobertura existente versus lacuna

- **Existente (C16/C17):** apenas fixture pgTAP `aa_c16_isolated`, 29 assertivas; identidade sintética, isolamento de docente/turma, revogação, grants e proteção de instituições. Execução em GitHub Actions contra Supabase local descartável.
- **Não existente:** migration ou tabela real de instituições, vínculo com auth.users, API/adapter operacional, matrícula/estudante, RPC, autorização de admin, escalonamento de papéis, revisão humana, testes multiusuário contra implementação verdadeira.
- **Gates de implementação futura:** critérios AA-C17-AC-01–12, decisões DEP-C17-01–08 e veredito de revisão independente. Sem merge/deploy nesta PR.
