# Academia Arcana — Megaoperação, Ciclo 12

**Data:** 2026-10-09  
**Estado:** código implementado na branch de revisão do PR #583. Quality Gate do SHA final ainda deve ser confirmado.

## Professor → Turma A → Relatórios

- Novo componente `TeacherReportsDemo`, acoplado apenas à aba **Relatórios** da estrutura demonstrativa da Turma A.
- Quatro áreas informativas: Participação, Aprendizagem, Atividades e Avaliações.
- Pesquisa por título, descrição e área; filtro por categoria; seletor de período ilustrativo (7, 30 e 90 dias).
- Painéis com estado **Dados indisponíveis**, sem percentuais, presença, notas, nomes, desempenho ou indicadores fabricados.
- Nenhum relatório é consultado ou exportado. O período selecionado não faz chamadas à API.
- Detalhes expansíveis documentam a necessidade de autorização por recurso, RLS, testes intercontas, escopo temporal e minimização.
- Estilos responsivos e acessíveis, foco visível, áreas de formulário com mínimo 44px e contador `role=status`.
- Testes unitários de filtros, períodos, ausência de dados, ausência de links e isolamento entre abas.
- Flonts permanece o mesmo bitmap por `FlontsPortrait`.

## Auditoria pública do Render — fotografia somente leitura

**Serviço:** `academiaarcana` (`srv-dauor697lnhs739cicag`)  
**Workspace:** `arcana.academy`  
**URL configurada:** https://academiaarcana.onrender.com  
**Plano:** Free / região Ohio / runtime Node.js  
**Branch de deploy:** `main`  
**Auto Deploy:** `no`, trigger `off` (confirmado por leitura de configuração).  
**Deploy ativo segundo API Render:** `dep-db43hb3l550s73ae8srg`, commit `17fb81477fbd3eed14b93103641004a766eb9ac1`.  
**Tentativa manual mais recente:** `dep-db4feru0tbcc73e71rcg`, commit `cc17653d...`, status `canceled` — não substituiu o deploy ativo.

A verificação externa da página raiz e de `/api/health` **não conseguiu obter resposta** nesta consulta. Isso não prova indisponibilidade, mas também **não valida HTTP 200 nem UX pública**. O estado `live` do Render é evidência do controlador de deploy, não um teste empírico completo da aplicação.

**Relação PR/produção:** o PR #583 é um rascunho não incorporado à `main`. Nenhum protótipo de Professor neste PR deve ser apresentado como publicado no Render.

## Bloqueios

1. Política professor–turma, RLS por recurso, revogação e testes intercontas antes de páginas operacionais.
2. Quatro imagens maiores do Flonts ainda ausentes do GitHub; apenas mini 96×120 está integrada. Hashes locais não são upload.
3. Revisão visual individual e substituição de mockups históricos inconsistentes.
4. Verificação HTTP e experiência pública real, observabilidade, segurança e critérios de homologação.
5. Quality Gate do SHA final, revisão humana e aprovação de release antes de merge/deploy.

**Decisões preservadas:** sem alteração de Render, Auto Deploy desligado, sem mexer no plano Free, sem mudanças de segredos, sem merge ou deploy.

## Próximo ciclo

Professor → Turma A → Configurações, com estados e fluxos visuais seguros, *sem salvar dados*; paralelamente, preparar homologação dos contratos de papel, escopo e autorização.
