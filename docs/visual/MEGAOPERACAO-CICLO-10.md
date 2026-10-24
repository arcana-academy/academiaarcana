# Academia Arcana — Megaoperação, Ciclo 10

**Data:** 2026-10-09  
**Estado:** implementação em branch de revisão; aprovação técnica condicionada ao Quality Gate do SHA exato.

## Entrega: Professor → Turmas → Fundamentos da Magia — Turma A → Avaliações

- Componente `TeacherAssessmentsDemo.tsx` com três avaliações explicitamente fictícias.
- Tipos demonstrativos: Diagnóstica, Formativa e Síntese.
- Situações: Rascunho, Programada e Encerrada.
- Filtros combináveis por texto, tipo e situação; contagem acessível e estado sem resultados.
- Rubricas qualitativas expansíveis, com critérios, orientação e níveis ilustrativos: Em desenvolvimento, Em progresso e Consolidado.
- Nenhuma nota individual, classificação ou indicador acadêmico inventado.
- CSS responsivo com campos de 44 px e foco visível; renderização apenas na aba Avaliações.
- Testes de filtros, rubricas, estados vazios, ausência de operações de escrita e isolamento entre abas.
- A ilustração aprovada do Flonts permanece aplicada através do componente compartilhado `FlontsPortrait`, sem novo desenho.

## Segurança e escopo canônico

- Rota `/design-system/portais/professor/turmas/turma-a` permanece autenticada e exclusivamente demonstrativa.
- Nenhum registro de estudantes, avaliações reais, notas, feedback privado, persistência ou API foi conectado.
- Publicar, corrigir, pontuar e exportar exigem vínculo docente confirmado, política por recurso, RLS, revogação e testes intercontas.
- Não alterar autorização, credenciais, segredos, plano Free, Auto Deploy, branch principal ou produção.

## Pendências da megaoperação

1. Os quatro binários maiores do Flonts (master e 320/480/960 WebP) ainda não foram enviados à branch; somente miniatura 96x120 já integrada.
2. Ilustrações históricas precisam ser comparadas individualmente à arte canônica; não considerar substituição global concluída.
3. Acesso operacional dos portais depende de contratos canônicos e backend seguro.
4. Faltam etapas de outras abas do Professor e portais Tutor/Mentor/Consultoria.
5. Testar lint, typecheck, testes unitários e de acessibilidade, build, ponta a ponta e smoke test no SHA final.

## Próximo ciclo sugerido

Professor → Turma A → Fórum, com prévia de tópicos, categorias, busca, estados vazios e moderação *indicativa*, sem mensagens reais; depois avançar para Relatórios e Configurações.
