# Academia Arcana — Megaoperação, Ciclo 09

**Checkpoint:** 2026-10-09  
**Estado:** ALTERAÇÕES IMPLEMENTADAS NO PR #583, PENDENTES DA CONFIRMAÇÃO DO QUALITY GATE NO SHA FINAL.

## Escopo entregue

**Portal do Professor → Turmas → Fundamentos da Magia — Turma A → Atividades.**

- Componente `src/components/teaching/TeacherActivitiesDemo.tsx`, somente leitura e sem backend.
- Quatro atividades com títulos, prazos e critérios declaradamente fictícios.
- Situações demonstrativas: Rascunho, Programada, Em andamento e Encerrada.
- Tipos: Exercício, Revisão e Missão.
- Busca local por nome, aula e instruções; filtros combináveis por tipo e situação.
- Detalhes expansíveis com orientações e critérios exemplificativos.
- Contagem e estados vazios com mensagens acessíveis.
- CSS responsivo em `TeacherActivitiesDemo.module.css`, campos com altura mínima de 44px e foco visível.
- Integração limitada à aba **Atividades** de `TeacherClassTabsDemo` com reaproveitamento do Flonts canônico da shell.
- Testes unitários da listagem, filtros, isolamento entre abas, critérios e ausência de links ou controles de escrita.

## Limites de autorização

O conteúdo permanece exclusivamente demonstrativo na rota autenticada:
`/design-system/portais/professor/turmas/turma-a`.

**Não há leitura de estudantes, submissões, notas, dados privados ou calendário real.** Não foram disponibilizados comandos de criação, atribuição, correção, publicação ou exclusão.

A integração operacional exigirá políticas aprovadas de vínculo professor–turma, RLS por recurso, revogação de permissões, testes intercontas e backend validado.

## Flonts — estado

- Reutilizado via `FlontsPortrait`, sem gerar nem modificar a aparência aprovada.
- O master e os três WebP maiores (320, 480, 960) ainda **não estão no GitHub**.
- A miniatura 96×120 já está na branch.
- O pacote local com os cinco hashes válidos foi produzido no ciclo anterior.
- Ilustrações históricas aguardam revisão individual; não declarar correção completa.

## Bloqueios para publicação

1. Confirmação integral do Quality Gate no commit final do Ciclo 09.
2. Upload dos quatro arquivos binários maiores do Flonts e verificação SHA-256 com `--strict` no checkout.
3. Aprovação e implementação dos contratos de acesso e fluxo de dados do Professor.
4. Conclusão das abas e fluxos reais, responsividade e verificação empírica.
5. Avaliação das ilustrações antigas e substituição controlada das não fiéis.

Nenhum merge, deploy, mudança de segredos, alteração no plano Free ou ativação de Auto Deploy.

## Próxima frente candidata

**Ciclo 10 — Professor → Turma A → Avaliações** (protótipo de rubricas, estrutura de avaliações e estados sem dados reais), seguido de revisão de autorização por recurso antes de conectar dados.
