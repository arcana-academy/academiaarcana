# Academia Arcana — Megaoperação, Ciclo 13

**Data:** 2026-10-09  
**Estado:** implementado no PR #583 em rascunho; aprovação técnica depende do Quality Gate no último commit.

## Escopo: Professor → Turma A → Configurações

- Componente `TeacherClassSettingsDemo.tsx`, puramente ilustrativo, sem conexão com backend, API ou serviços administrativos.
- Três áreas demonstrativas: Dados gerais, Permissões e Segurança.
- Pesquisa por seção e campo, filtro de área e filtro de estado ilustrativo.
- Campos exibidos em `dl/dt/dd` somente leitura; nenhuma edição, envio, salvamento ou exportação é oferecida.
- Distinção explícita entre valores fictícios, política pendente e requisitos de privacidade. Nenhuma permissão do usuário atual é inferida.
- Itens de acesso, revogação, RLS, retenção e auditoria aparecem como requisitos, não como configurações efetivamente instaladas.
- Estado de busca vazia, contador acessível, `details/summary` para explicações e design responsivo até mobile.
- Testes de ausência de ações de escrita, filtros combináveis, aviso de bloqueio e isolamento entre abas.
- Reutilização do Flonts via componente canônico `FlontsPortrait` da estrutura da Turma A, sem novo desenho.

## Segurança — negação por padrão

A rota `/design-system/portais/professor/turmas/turma-a` exige autenticação para exibir a prévia, mas **não prova vínculo docente nem autoriza alterações de turmas**. Não existe adapter de banco de dados ou fluxo de escrita conectado.

Antes de qualquer operação real, são necessários contratos de papéis e vínculos docente–turma, políticas por recurso, RLS, revogação de acesso, auditoria, testes intercontas e homologação.

## Histórico da auditoria pública Render

O serviço `academiaarcana` em `https://academiaarcana.onrender.com` foi consultado em leitura no Ciclo 12: plano Free, origem `main`, Auto Deploy desligado. Esta validação **não deve ser confundida com verificação HTTP pública** ou publicação dos protótipos do PR #583.

## Pendências gerais preservadas

1. Quatro binários oficiais maiores do Flonts ainda fora do GitHub; somente miniatura 96×120 está na branch. Verificar `--strict` após integração real.
2. Mockups históricos não podem ser considerados corrigidos sem comparação com ilustração aprovada.
3. Portal do Professor operacional, Tutor, Mentor e Consultoria dependem de escopo e autorização canônicos.
4. Revisão de design, WCAG manual, rotas, estados, segurança e experiência real de ponta a ponta além dos testes já automatizados.
5. Quality Gate completo no SHA final e revisão humana antes de qualquer merge/deploy.

**Proibições preservadas:** não alterar plano Free, segredos, papéis, Auto Deploy, `main` ou o site publicado.

## Próximo ciclo candidato

Ciclo 14 — consolidar cobertura da Turma A, preparar checklist de critérios de aceite, confrontar contratos de autorização e selecionar o próximo fluxo seguro de demonstração (sem reabrir decisões canônicas).
