# Camada de acessibilidade

A Central de Acessibilidade do cabeçalho autenticado está implementada em
`AccessibilityCenter.tsx`. Reutiliza a preferência de movimento já aprovada
pela arquitetura `core/application/lib`, sem armazenar dados clínicos.

O tema institucional automático é orquestrado separadamente em
`src/application/appearance/`. Os ajustes locais de leitura (ampliação,
espaçamento, contraste e foco) são opcionais e não mudam as páginas dos
grimórios no banco de dados.

A Central apresenta seis categorias aprovadas, mas somente marca como
funcionais os controles conectados. Legendas, Libras, leitura assistiva,
exportação, arrastar alternativo e suporte a tecnologias assistivas precisam
ser comprovados por implementação e testes próprios. Os requisitos basais de
acessibilidade devem funcionar mesmo sem ativar preferência alguma.

A seleção de um painel rápido versus abertura direta da Central ainda não
foi aprovada. Esta primeira integração abre as categorias diretamente e
poderá ser refinada sem reescrever os contratos de acessibilidade.
