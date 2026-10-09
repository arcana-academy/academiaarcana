# Academia Arcana — Megaoperação, Ciclo 08

**Data:** 2026-10-09  
**Status:** IMPLEMENTADO NO PR EM RASCUNHO, EM VERIFICAÇÃO TÉCNICA. Não publicado.

## Escopo executado

Continuidade incremental do **Portal do Professor → Turmas → Fundamentos da Magia — Turma A → Conteúdos**.

- Novo componente `src/components/teaching/TeacherMaterialsDemo.tsx`.
- Pesquisa local por nome, tipo e aula; filtros de categoria e disponibilidade, combináveis.
- Três itens **explicitamente fictícios**, com metadados e detalhes expansíveis.
- Estado vazio, materiais em preparação, indicação explícita de links e downloads indisponíveis.
- Layout responsivo `TeacherMaterialsDemo.module.css`, foco de teclado e controles de tamanho mínimo 44 px.
- Integração somente na aba `Conteúdos` de `TeacherClassTabsDemo`, mantendo `Aulas` independente.
- Testes de filtros, conteúdo fictício, ausência de links, estados vazios e renderização somente na aba correta.

## Flonts — preservação obrigatória

- O componente compartilhado `FlontsPortrait` segue responsável pelo mesmo bitmap canônico em `TeacherClassTabsDemo`, também exibido no cabeçalho desta aba.
- O bloqueio por testes de importação direta de ilustrações permanece vigente.
- A miniatura 96×120 está presente na branch; o master 1122×1402 e as variantes 320×400, 480×600 e 960×1200 permanecem **pendentes de envio ao GitHub**. Não declarar biblioteca completa integrada.
- A substituição de ilustrações históricas exige validação artística e comparação com a imagem aprovada; nenhum mockup foi automaticamente marcado como corrigido neste ciclo.

## Segurança e política canônica

- A rota está sob `/design-system/portais/professor/turmas/turma-a` e exige sessão.
- A autorização docente real continua **BLOQUEADA** à espera de vínculo professor–turma, RLS, políticas de leitura/escrita por recurso, revogação e testes intercontas.
- Nenhum upload, download, compartilhamento, publicação, banco de dados, papel de usuário ou serviço de produção foi modificado.

## Critérios de aceite do ciclo

1. O conteúdo aparece somente na aba correta.
2. Todos os dados são identificados como fictícios e não há endpoints ou links para arquivos reais.
3. Filtros de categoria, situação e texto funcionam juntos e mostram estado vazio.
4. UI navegável por teclado e responsiva; testes automatizados.
5. Quality Gate do SHA exato, inclusive lint, typecheck, unitários, a11y, build, e2e e smoke test, passa antes de declarar aprovação técnica.
6. Merge e deploy desativados enquanto houver bloqueios de implementação/revisão.

## Próximo escopo previsto

- Professor → Turma A → Atividades, em uma rodada controlada e ainda com dados demonstrativos.
- Integrar quatro arquivos binários oficiais do Flonts por fluxo de upload apropriado; executar `node scripts/verify-flonts-visual.mjs --strict` no checkout.
- Corrigir os mockups antigos por validação individual, preservando proporções e arquivos aprovados.
- Avançar as rotas operacionais somente depois dos contratos de autorização canônicos.
