# Academia Arcana — Megaoperação, Ciclo 11

**Data:** 2026-10-09  
**Estado:** código implementado no PR rascunho #583; validação técnica depende do Quality Gate do SHA final.

## Escopo: Professor → Turma A → Fórum

- Componente `src/components/teaching/TeacherForumDemo.tsx`, apenas demonstrativo.
- Quatro tópicos explicitamente fictícios, sem autores, mensagens reais ou respostas.
- Categorias: Dúvidas, Estudo em grupo e Materiais.
- Situações: Aberto, Arquivado e Aguardando moderação (estado fictício).
- Pesquisa local por título/descrição, filtros combináveis de categoria e situação, contador acessível e estado vazio.
- Descrições e orientações expansíveis com HTML `details/summary`, sem links reais.
- Aviso visível de moderação e privacidade: convivência, denúncia, retenção, proteção de dados, bloqueios e autorizações são requisitos pendentes, NÃO funções instaladas.
- CSS responsivo e foco visível. Testes para filtros, estados, ausência de controles de escrita e isolamento entre abas.
- Integração somente na aba Fórum de `TeacherClassTabsDemo`; demais abas preservadas.
- Flonts continua vindo do componente canônico `FlontsPortrait`, sem gerar outro personagem.

## Garantias e limitações

- A rota existente `/design-system/portais/professor/turmas/turma-a` exige sessão autenticada para a prévia.
- Não há fórum real, mensagens, usuários, banco, API, uploads, notificações, moderadores ou serviços externos.
- Nenhum vínculo professor–turma ou permissão foi concedido.
- Operações de criação, resposta, denúncia, moderação, arquivamento e exclusão continuam bloqueadas.
- Antes de habilitar fluxo real: políticas canônicas de autoria e visibilidade; vínculos de ensino; RLS; revogação; moderação e denúncias; retenção; proteção infantil, antiabuso e testes de acesso entre contas.

## Flonts e estado da megaoperação

- Miniatura 96×120 existente na branch, master e variantes 320/480/960 ainda PENDENTES de upload.
- `docs/visual/FLONTS-VISUAL-LOCK.json` e testes de fonte única continuam vigentes.
- Mockups históricos não são considerados corrigidos sem inspeção visual individual.
- Outros portais e páginas operacionais permanecem pendentes.

## Critérios do checkpoint

1. Quality Gate do SHA final: lint, TypeScript, testes unitários, acessibilidade, build, E2E e smoke test.
2. Confirmar PR aberto, em rascunho, sem merge ou deploy.
3. Não publicar funcionalidades demonstrativas como se fossem um fórum operacional.
4. Registrar falhas e corrigir somente com evidências, sem alterar segredos ou plano Free.

## Próximo ciclo proposto

**Ciclo 12 — Professor → Turma A → Relatórios**: indicadores e filtros demonstrativos, estados sem dados e limites de privacidade. A implementação com dados reais fica bloqueada até autorização por recurso.
