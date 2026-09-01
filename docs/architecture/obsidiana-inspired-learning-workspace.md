# Obsidiana — Learning Workspace

## Referências

Esta implementação usa como referência de produto a filosofia e os padrões públicos do Obsidian, a organização de tarefas inspirada em Things e referências visuais dos temas Things e GitHub. As referências são usadas como inspiração de interação e informação, não como cópia de código, marca ou interface.

## Objetivo

Criar para a Academia Arcana um espaço de estudo modular que combine documentos, tarefas, propriedades, links e múltiplas visualizações, preservando as fronteiras do domínio Learning.

## Padrões incorporados

- **Documentos estruturados:** uma unidade de conhecimento pode conter título, tipo, propriedades, links e tarefas.
- **Propriedades:** dados estruturados ficam separados do corpo narrativo e podem ser usados futuramente em filtros e ordenação.
- **Views:** lista, quadro, cartões e tabela são modos de apresentar a mesma informação, sem duplicar o domínio.
- **Pesquisa:** busca por título e resumo fica na camada de apresentação.
- **Agrupamento e filtros:** operações puras podem filtrar ou agrupar documentos por tipo, status e prioridade.
- **Links:** o contrato prevê relações internas, externas, menções e backlinks, preparando uma futura experiência de grafo e navegação contextual.
- **Canvas futuro:** o contrato de documentos e links é compatível com uma futura área visual 2D, mas Canvas não é implementado neste slice.
- **Extensibilidade futura:** novos tipos de view podem ser adicionados sem alterar o modelo central de documentos.

## Acessibilidade

A interface não usa cor como único canal semântico. Estados continuam legíveis por texto e símbolo. Controles de visualização possuem nomes acessíveis e estado pressionado. A fundação respeita `prefers-reduced-motion` por meio dos tokens globais.

## Arquitetura

`LearningWorkspace` é apresentação. `src/domains/learning/workspace` fornece apenas contratos e transformações puras. Persistência, autorização, colaboração, gamificação, notificações e IA permanecem fora do componente.

## Próximos slices

1. editor estruturado de documentos e propriedades;
2. links internos, backlinks e painel de relações;
3. busca global e paleta de comandos;
4. board/kanban real com drag-and-drop acessível;
5. tabela editável e filtros persistentes;
6. Canvas visual;
7. templates;
8. importação/exportação;
9. integrações com calendário e tarefas;
10. extensões/plugins controladas pela arquitetura e segurança da Academia.

## Fora deste slice

Não há cópia do código dos projetos de referência, não há carregamento de plugins externos, não há sincronização de cofre local e não há persistência Supabase. Essas integrações dependem de decisões próprias da Academia Arcana.
