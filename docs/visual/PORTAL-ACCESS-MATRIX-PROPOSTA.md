# Academia Arcana — Matriz provisória de portais e autorização

> Estado: **GAP DOCUMENTADO, NÃO APROVADO COMO POLÍTICA**.
> Esta matriz não confere acesso, não define papéis reais no banco de dados e não
> deve ser usada como configuração de produção.

## Evidências verificadas

- `src/core/authorization/contracts.ts`: decisões explícitas, `policy-denied` se faltar política.
- `src/core/context/contracts.ts`: recursos privados por padrão, compartilhamento explícito.
- `src/lib/auth/require-authenticated-user.ts`: comprovação de sessão não é comprovação de papel.
- `src/app`: rotas centrais do estudante; sem páginas operacionais `/professor`,
  `/tutor`, `/mentor` ou `/consultoria` na auditoria de 2026-10-09.
- `src/app/design-system/portais`: somente prévia de UI autenticada, sem acesso
  a informações reais; não é um portal funcional.

## Contratos necessários antes de criar fluxos reais

| Portal | Sujeito/relação necessária | Recurso | Operações a validar | Estado |
|---|---|---|---|---|
| Professor | vínculo institucional docente confirmado | turma/aula/avaliação | leitura, criação, edição, correção | PENDENTE |
| Tutor | vínculo explícito tutor–estudante | plano de acompanhamento/sessão | leitura, anotação, feedback | PENDENTE |
| Mentor | consentimento e vínculo mentor–mentorado | metas/encontros | leitura, orientação, registro | PENDENTE |
| Consultoria | definição canônica da entidade e vínculo | atendimento/projeto/entrega | leitura e gestão por escopo | PENDENTE |

Para cada operação exigem-se: identificação autenticada, identificação do
recurso, relação/vínculo verificada no servidor, política de acesso, RLS quando
aplicável, revogação de vínculo, testes positivos/negativos entre contas e
registro de decisões canônicas.

**Regras obrigatórias:**
1. Negar acesso enquanto política ou vínculo não estiver verificado.
2. Não deduzir papel de avatar, campo de perfil, navegação, email ou mockup.
3. Não reutilizar o papel professor como permissão geral de tutor/mentor.
4. Não expor dados de estudantes nos protótipos.
5. Não abrir rotas funcionais até API, persistência, UX e testes estarem prontos.
6. Não alterar permissões, segredos, plano Free, merge ou deploy por esta operação.

## Prototipação liberada

- Layout responsivo de cabeçalho/sidebar/conteúdo/rodapé.
- Vocabulário de navegação **proposto**, sem links falsos ou formulários que salvem.
- O mesmo componente `FlontsPortrait` e arquivo canônico em todas as prévias.
- Testes estáticos de cobertura e proteção de acesso das prévias.

## Próximo checkpoint de produto

Validar o modelo de vínculos de ensino, tutoria, mentoria e consultoria no
domínio de Produto/Arquitetura e registrar IDs canônicos. Depois selecionar
**um único** fluxo P0 do Professor (por exemplo Turmas → Visão Geral) para
implementação vertical segura e integração com testes de autorização.
