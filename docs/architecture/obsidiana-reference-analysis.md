# Obsidiana — análise das referências

## O que estamos incorporando

A referência principal é o conceito de um workspace de conhecimento com documentos estruturados, propriedades, links, busca, comandos, views e extensibilidade. O Obsidian mantém dados de notas e propriedades separados das visualizações; Bases oferece views como tabela, lista e cartões, com filtragem, ordenação e agrupamento. Canvas acrescenta uma superfície espacial para conexões. citehttps://obsidian.md/pt-BR/help/baseshttps://obsidian.md/pt-BR/canvas

A referência Things informa principalmente clareza de tarefas, hierarquia visual, estado e prioridade sem transformar o gerenciador em um painel excessivamente denso. O tema GitHub informa padrões de contraste, callouts, código e board/kanban inspirado em GitHub Projects. citehttps://github.com/colineckert/obsidian-thingshttps://github.com/krios2146/obsidian-theme-github

## O que não estamos copiando

Não estamos copiando código-fonte, CSS, marca, ícones proprietários, telas ou arquitetura interna dos projetos de referência. A Academia Arcana continua sendo um produto próprio com seu Design System, domínios, autorização e regras de acessibilidade.

## Mapeamento para a Academia Arcana

| Referência | Academia Arcana |
| --- | --- |
| Nota | Documento de aprendizagem |
| Propriedades | Metadados estruturados do documento |
| Bases | Views do workspace |
| Lista | Visão de tarefas/documentos |
| Cards | Grade de documentos |
| Kanban | Futuro board de tarefas |
| Links internos | Relações entre conteúdos |
| Backlinks | Painel de relações futuras |
| Canvas | Futuro Canvas Arcano |
| Command palette | Extensão do CommandPalette existente |
| Templates | Futuro sistema de modelos |
| Graph | Futuro mapa de conhecimento |
| Community plugins | Extensibilidade própria, governada por segurança |

## Roadmap influenciador

O roadmap atual do Obsidian mostra o foco em views de Bases, permissões de recursos, arquivos Markdown externos, sincronização, calendário, Canvas, colaboração e relevância da busca. Para a Academia, isso orienta uma arquitetura que não amarre a camada de apresentação à persistência ou a uma view específica. citehttps://obsidian.md/roadmap/

## Decisão desta etapa

Foi implementada a fundação do workspace: contratos de documentos, propriedades, links e views; operações puras para filtro/agrupamento; componente de workspace acessível; rota inicial `/obsidiana`; e documentação arquitetural. Persistência, drag-and-drop, Canvas, backlinks reais e plugins permanecem em slices posteriores.
