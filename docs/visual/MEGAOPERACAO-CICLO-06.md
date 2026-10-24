# Megaoperação — Ciclo 06 (2026-10-09)

## Objetivo
Continuar a produção com rastreabilidade, sem alterar `main`, implantar ou modificar permissões sem política canônica.

## Implementado nesta branch
- `TeacherClassTabsDemo`: protótipo de Detalhes da Turma A com nove abas internas: Visão Geral, Aulas, Alunos, Conteúdos, Atividades, Avaliações, Fórum, Relatórios, Configurações.
- Navegação semântica com `role=tablist/tab/tabpanel`, seleção ativa, foco e teclado (setas, Home, End).
- Rota autenticada `/design-system/portais/professor/turmas/turma-a`; ligação a partir da prévia de listagem de Turmas; dados fictícios e nenhuma operação real de leitura/escrita.
- Testes de tabulação, privacidade, teclado, navegação e restrição de sessão.
- `flonts-single-source.test.ts`: proteção para impedir que novos componentes apontem diretamente a imagens alternativas do Flonts. Fonte única: `FlontsPortrait`.

## Validação de imagens em arquivos locais
- Cinco arquivos oficiais verificados localmente por SHA-256, tamanho e dimensões. **Somente mini 96×120 está no repositório**; master e variantes 320/480/960 ainda NÃO estão integrados.
- 23 PNG históricos do Portal do Professor foram inventariados em duas pastas locais, com hashes e dimensões, como referência para inspeção humana. Este é um subconjunto e não equivale à totalidade dos mockups.
- Nenhum PNG histórico é automaticamente promovido a 'Flonts corrigido'. A fidelidade ainda deve ser examinada contra a arte aprovada.

## Fronteira de autorização
- Módulo docente real permanece pendente: relacionamento professor/turma, RLS, política por recurso, revogação e testes intercontas.
- `listTeacherClassroomsDraft` é um contrato preparado, sem adapter ou fonte de dados operacional.
- Protótipos não concedem papel docente nem consultam alunos, notas ou arquivos.

## Bloqueios e próximos passos
1. Integrar os quatro binários maiores pelo fluxo apropriado e rodar `node scripts/verify-flonts-visual.mjs --strict` no checkout.
2. Validar e corrigir ilustrações antigas sem gerar outro gato ou deformar o asset oficial.
3. Aprovar a matriz de vínculos de ensino; só então construir rotas reais.
4. Cobrir mobile/tablet e estados dos portais por lote controlado.
5. Revisar CI/CodeQL/Quality Gate do SHA exato antes de qualquer merge.
6. Manter plano Free, Auto Deploy desligado e produção inalterada.

**Estado:** PARCIAL / checkout em rascunho. Não declarar 100% ou deploy.
