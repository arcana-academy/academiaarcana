# CP-MASTER-C01 — Mapeamento canônico de 33 páginas e layouts (evidência, não decisão)

**Estado:** AUDITADO ESTATICAMENTE / CHECKPOINT PROPOSTO PARA REVISÃO; **não é homologação visual ou WCAG 2.2 AA**.

**Repositório:** `arcana-academy/academiaarcana`  
**Baseline imutável:** `main@cc17653dfe79c44dd83ba1ced8cb065383b11ca9` (consultada antes desta branch).  
**Escopo:** 33 arquivos `src/app/**/page.tsx` da árvore GitHub completa (sem truncamento), principais componentes e testes que se relacionam às rotas. Não há `template.tsx` na árvore; **a ausência não é defeito por si só**. Todas as páginas herdam `src/app/layout.tsx` e os CSS globais; camadas adicionais são explicitadas abaixo.  
**CP anterior:** [Ciclo B / PR #623](https://github.com/arcana-academy/academiaarcana/pull/623#issuecomment-6116252542) e [Ciclo B / PR #624](https://github.com/arcana-academy/academiaarcana/pull/624#issuecomment-6116252893); Quality Gates #38192211754 e #38192391653 aprovados em seus respectivos HEADs. Permanecem **draft, não integradas**.  

## Autoridades e critérios (não reabrir decisões)
- [Produto](https://github.com/arcana-academy/academiaarcana/blob/cc17653dfe79c44dd83ba1ced8cb065383b11ca9/docs/product/AA-PRODUCT-1.0.md), [módulos](https://github.com/arcana-academy/academiaarcana/blob/cc17653dfe79c44dd83ba1ced8cb065383b11ca9/docs/product/AA-PRODUCT-MODULES-1.0.md) e [requisitos](https://github.com/arcana-academy/academiaarcana/blob/cc17653dfe79c44dd83ba1ced8cb065383b11ca9/docs/product/AA-PRODUCT-REQUIREMENTS-1.0.md) — Chat 01; rota não prova capacidade concluída, P0 é fundação, P1 é núcleo educacional.
- [Arquitetura](https://github.com/arcana-academy/academiaarcana/blob/cc17653dfe79c44dd83ba1ced8cb065383b11ca9/docs/architecture/AA-ARCHITECTURE-1.0.md) — Chat 02; camadas e ownership preservados.
- [Design System](https://github.com/arcana-academy/academiaarcana/blob/cc17653dfe79c44dd83ba1ced8cb065383b11ca9/docs/design-system/AA-DESIGN-SYSTEM-1.0.md) — Chat 03: `--aa-*`, temas por tokens, contraste/foco, 40/48/64/80rem como baseline responsivo, WCAG 2.2 AA como meta.
- Chat 04 — UI/UX: checkpoint conceitual fechado em registro anterior (AA-UX-001–711; DEP-UX-001–182). **O conteúdo integral dessas decisões não foi encontrado como fonte operacional equivalente no snapshot do repositório; não inferir cobertura nem reabrir o fechamento.**
- [Mundo Visual](https://github.com/arcana-academy/academiaarcana/blob/cc17653dfe79c44dd83ba1ced8cb065383b11ca9/docs/design-system/AA-WORLD-LANGUAGE-PHASE2-1.0.md) — Chat 05: símbolos semânticos/decorativos separados; geometria CURRENT não é aprovação final.
- Chat 06 — Copy/Linguagem: voz/terminologia históricas disponíveis, **matriz detalhada de critérios por estado e contexto não localizada de forma verificável no código consultado**; não afirmar conformidade integral.
- Prioridade das páginas auxiliares de autenticação e laboratórios nesta tabela descreve **vínculo de experiência**, não reclassifica o catálogo canônico de Produto.

## Convenções da matriz

**Layout:** `R` = RootLayout; `S` = AuthenticatedShell (inclui RootLayout); `P` = ArcanaPage; `C` = componente composto; `M` = markup da própria rota; `F` = AuthForm compartilhado; `P` também pode significar piloto quando aparece como `R+P` (harness). `S+P` e `S+C` incluem RootLayout.  
**Template:** `Ø` = nenhum `template.tsx` de rota, sem implicar falha.  
**Tokens:** `T-C` = classes `aa-*` com contrato semântico central; `T-P` = tema/presets/proof; `T-I` = composição híbrida com estilos inline/variáveis; `T-?` = o arquivo de rota depende do AuthForm sem aplicação explícita de classe/token semântico nele; necessita revisão visual, **não é automaticamente defeito**.
**Acessibilidade:** `A-H` = affordances semânticas herdadas do shell (nav, current); `A-L` = markup local com rótulos/heading/aria visíveis; `A-C` = componente ou piloto tem teste/auditoria automatizada relacionada; **nenhum símbolo prova conformidade WCAG integral**.
**Responsividade:** `R-H` = CSS/shell responsivo herdado, rota individual não comprovada; `R-V` = há piloto/mostruário E2E visual com tamanhos representativos, **não prova todos os estados daquela rota**; `R-?` = evidência específica insuficiente.
**Testes:** `UT` = teste do arquivo de página; `CT` = teste de componente; `E2E` = teste Playwright listado. “Ignorado” significa *não executado* na Quality Gate B por ausência de credenciais E2E (3 testes). Teste de serviço/conector não equivale a teste visual da página.

## Matriz Página × Módulo × Layout × Template × Componentes × Tokens × A11y × Responsividade × Testes

| Página | Módulo / prioridade | Layout | Template | Componentes/relações | Tokens | A11y | Responsividade | Testes/evidência |
|---|---|---|---|---|---|---|---|---|
| `/` | Entrada pública · apoio P0 | `R+C` | `Ø` | Landing gerada | `T-C` | `A-L` | `R-V` | UT `app/page`; E2E `smoke`, `runtime-smoke` |
| `/academia` | Academia · P0 | `S+M` | `Ø` | Learning paths | `T-C` | `A-H,L` | `R-H` | UT `academia/page` |
| `/amigos` | Amigos · P2 | `S+P` | `Ø` | FeatureCard/SocialRepository | `T-C` | `A-H` | `R-H` | UT `amigos/page` |
| `/cadastro` | Cadastro · identidade P0 | `R+F` | `Ø` | AuthForm(signup) | `T-?` | `A-L` | `R-?` | CT `AuthForm`; E2E `runtime-smoke` |
| `/configuracoes` | Configurações · P0 | `S+P` | `Ø` | FeatureCard/links | `T-C` | `A-H` | `R-H` | UT `configuracoes/page`; PR #623 isolada |
| `/conquistas` | Conquistas · P1 | `S+P` | `Ø` | FeatureCard/Gamification | `T-C` | `A-H,L` | `R-H` | UT `conquistas/page` |
| `/cronograma` | Cronograma · P0 | `S+C` | `Ø` | StudyTaskBoard/Outlook | `T-C` | `A-C` | `R-V` | CT `StudyTaskBoard`+a11y; E2E `cronograma-production-pilot` |
| `/design-system` | Mostruário · laboratório | `R+C` | `Ø` | ThemeShowcase | `T-P` | `A-C` | `R-V` | E2E `design-system-a11y`, `design-system-visual` |
| `/design-system/pilots/cronograma` | Piloto · não módulo | `R+P` | `Ø` | CronogramaPilotHarness | `T-P` | `A-C` | `R-V` | E2E `cronograma-production-pilot` |
| `/design-system/pilots/focus` | Piloto · não módulo | `R+P` | `Ø` | FocusPilotHarness | `T-P` | `A-C` | `R-V` | E2E `focus-production-pilot` |
| `/design-system/pilots/statistics` | Piloto · não módulo | `R+P` | `Ø` | StatisticsPilotHarness | `T-P` | `A-C` | `R-V` | E2E `statistics-production-pilot` |
| `/design-system/proofs` | Provas visuais · laboratório | `R+C` | `Ø` | ProofShowcase | `T-P` | `A-C` | `R-V` | E2E `proof-surfaces` |
| `/estatisticas` | Estatísticas · P1 | `S+C` | `Ø` | StatisticsView | `T-C` | `A-C` | `R-V` | UT `estatisticas/page`; E2E `statistics-production-pilot` |
| `/feedback` | Feedback público · apoio | `R+M` | `Ø` | Input/Button/form | `T-C` | `A-L` | `R-H` | UT `feedback/page` (TS e TSX); rota E2E não dedicada |
| `/foco` | Foco · P0 | `S+P` | `Ø` | FocusSession/FeatureCard | `T-C` | `A-C` | `R-V` | UT `foco/page`; CT `FocusSession`; E2E `focus-production-pilot` |
| `/grimorios` | Grimórios · P0 | `S+M` | `Ø` | GrimoireRepository/links | `T-C` | `A-H,L` | `R-H` | UT `grimorios/page`; E2E autenticado **ignorado** |
| `/integracoes` | Hub integrações · apoio | `R+M` | `Ø` | Catalog/Status integrations | `T-I` | `A-L` | `R-?` | UT `integracoes/page`; E2E `integration-hub` |
| `/integracoes/asana` | Asana · conector | `S+P` | `Ø` | AsanaConnectionPanel | `T-C` | `A-H,L` | `R-H` | E2E `asana-integration`; testes serviço |
| `/integracoes/ia-aberta` | IA aberta · laboratório | `R+M` | `Ø` | OpenSourceAiPlayground | `T-I` | `A-L` | `R-?` | CT/serviço `open-source-ai`; sem teste direto de página |
| `/integracoes/microsoft-sharepoint` | SharePoint · conector | `S+P` | `Ø` | MicrosoftSharePointConnectionPanel | `T-C` | `A-H,L` | `R-H` | Testes serviço `microsoft-sharepoint`; sem teste direto de página |
| `/integracoes/notion` | Notion · conector | `S+P` | `Ø` | NotionConnectionPanel | `T-C` | `A-H,L` | `R-H` | Testes serviço `notion`; sem teste direto de página |
| `/integracoes/todoist` | Todoist · conector | `S+P` | `Ø` | TodoistConnectionPanel | `T-C` | `A-H,L` | `R-H` | Testes serviço `todoist`; sem teste direto de página |
| `/integracoes/trello` | Trello · conector | `S+P` | `Ø` | TrelloConnectionPanel | `T-C` | `A-H,L` | `R-H` | Testes serviço `trello`; sem teste direto de página |
| `/login` | Login · identidade P0 | `R+F` | `Ø` | AuthForm(login) | `T-?` | `A-L` | `R-?` | CT `AuthForm`; E2E `runtime-smoke`; PR #624 isolada |
| `/missoes` | Missões · P0/P1 | `S+P` | `Ø` | FeatureCard/Gamification | `T-C` | `A-H` | `R-H` | UT `missoes/page` |
| `/perfil` | Perfil · P0 | `S+P` | `Ø` | FeatureCard/SupabaseAuth | `T-C` | `A-H` | `R-H` | UT `perfil/page` |
| `/personalizar` | Personalização · P0/P1 | `S+C` | `Ø` | PersonalizationPanel | `T-P` | `A-L,C` | `R-H` | CT `PersonalizationPanel`; sem UT direta da rota |
| `/pratica` | Prática · P1 | `S+M` | `Ø` | PageSelector/PracticeSession | `T-C` | `A-L,C` | `R-H` | UT `pratica/page`+a11y; E2E autenticado **ignorado** |
| `/recuperar-senha` | Recuperação · identidade P0 | `R+F` | `Ø` | AuthForm(recover) | `T-?` | `A-L` | `R-?` | CT `AuthForm`; E2E `runtime-smoke` |
| `/redefinir-senha` | Redefinição · identidade P0 | `R+F` | `Ø` | AuthForm(update-password) | `T-?` | `A-L` | `R-?` | CT `AuthForm`; E2E `runtime-smoke` redireciona anônimo |
| `/santuario` | Santuário · P0 | `S+C` | `Ø` | Sanctuary | `T-C` | `A-H,C` | `R-H` | UT `santuario/page`; CT `Sanctuary`; E2E autenticado **ignorado** |
| `/streak` | Streak · P0/P1 | `S+P` | `Ø` | FeatureCard/Gamification | `T-C` | `A-H` | `R-H` | UT `streak/page` |
| `/workspace` | Workspace + caderno/capítulo/página · P0 | `S+C` | `Ø` | WorkspaceShell/WorkspaceTree | `T-C` | `A-H,C` | `R-H` | CT `Workspace*`; E2E autenticado **ignorado** |

**Contagem:** 33 rotas únicas. O módulo Caderno, Capítulo e Página está composto no Workspace; não exige três novas URLs para cumprir o baseline de Produto. `/design-system/*` e `/integracoes/ia-aberta` são superfícies de demonstração/laboratório que não devem ser confundidas com módulos P0 concluídos.

## Evidências verificadas e fronteiras do que foi validado

1. Árvore GitHub `main@cc17653d...`: 33 `page.tsx`, nenhum `template.tsx`; 15 links de `src/config/navigation.ts` têm páginas de destino existentes. A integridade de arquivo/rota **não comprova renderização autenticada**.
2. `src/app/layout.tsx` define `lang="pt-BR"` e os `ApplicationProviders`; `AuthenticatedShell` contém `Sidebar` e `MobileNavigation`. `ArcanaPage` fornece `main`, `header` e `h1` sem obrigar cada rota a repetir a marcação.
3. `src/app/globals.css` inclui variáveis semânticas `--aa-*`, seletor `:focus-visible`, suporte a `prefers-reduced-motion` e várias regras `@media`. A existência de largura CSS 36/42/52rem fora dos tokens de breakpoint canônicos deve ser **justificada por caso de reflow** antes de chamar divergência ou alterar a grade.
4. `src/components/personalization/PersonalizationPanel.tsx` usa Theme Engine e estado de preferência de movimento; `StudyTaskBoard` e `FocusSession` são componentes reais. 
5. Quality Gate B do HEAD das PRs #623/#624: 867/868 unitários, 14 testes da suíte de acessibilidade e 55 E2E aprovados, com **3 ignorados** por ausência de credenciais. Essas aprovações referem-se a cada **HEAD isolado**, não a `main` integrado nem à fusão das PRs. E2E autênticos de Santuário, Grimórios→Workspace e Prática seguem sem comprovação nessa evidência.
6. Nenhuma validação manual de contraste, navegação por tecnologia assistiva, zoom 200/400%, recuperação de erros em todos os módulos, correspondência visual com Figma ou assets finais é alegada neste checkpoint.

## Registro C01 de GAPs, conflitos e limites

| ID | Prioridade | Estado | Evidência / tratamento sem regressão |
|---|---|---|---|
| C01-G01 | P1 | **PENDENTE de QA empírico** | E2E autenticados de Santuário, Grimórios→Workspace e Prática ignorados no pipeline por falta de `E2E_EMAIL`/`E2E_PASSWORD`. Exigir executor isolado autorizado, contas fictícias e dados de teste; não acessar dados reais. |
| C01-G02 | P1 | **CORREÇÃO ISOLADA, NÃO INTEGRADA** | Configurações no `main` descreve ajuste de movimento/tema sem atalho; [PR #623](https://github.com/arcana-academy/academiaarcana/pull/623) já adiciona links, testada no HEAD próprio. Não duplicar nem alterar PR. |
| C01-G03 | P1 | **CORREÇÃO ISOLADA, NÃO INTEGRADA** | Login do `main` não expõe navegação à recuperação; [PR #624](https://github.com/arcana-academy/academiaarcana/pull/624) adiciona link com teste, validado em HEAD próprio; sem merge. |
| C01-G04 | P1 | **CONFLITO EM ANÁLISE, PROTEGIDO** | Root/route error fallbacks no `main` ainda exigem localização completa; [PR #617](https://github.com/arcana-academy/academiaarcana/pull/617) cobre parte do escopo. Não tocar no arquivo protegido. |
| C01-G05 | P1 | **HIPÓTESE, NÃO DEFEITO COMPROVADO** | Páginas de autenticação exibem `AuthForm` sem classes/tokens explícitos no componente; testar aparência, foco, zoom, contraste e responsividade antes de propor mudança. `AuthForm.tsx` também é protegido pela PR #624. |
| C01-G06 | P1 | **GAP DE RASTREABILIDADE** | Não há correspondência auditável entre todo o conteúdo das decisões finais do Chat 04 e a implementação; o fechamento conceitual permanece canônico. Copy Chat 06 carece de fonte detalhada verificável neste inventário. |
| C01-G07 | P1 | **REVISÃO NECESSÁRIA** | Superfícies públicas `/integracoes`, `/integracoes/ia-aberta` e `/design-system/*`: classificar finalidade, exposição e escopo de QA; ausência de auth não demonstra vulnerabilidade sem análise da API. |
| C01-G08 | P1 | **JUSTIFICATIVA PENDENTE** | Breakpoints não canônicos observados no CSS devem ser associados a necessidade concreta, especialmente antes de corrigir nav responsiva da PR #621. |
| C01-G09 | P1 | **EVIDÊNCIA PARCIAL** | Testes de componente/serviço não substituem roteiros de interação e screenshot por página, principalmente integrações e Workspace. |
| C01-G10 | P2 | **PLANEJADO / NÃO RECLASSIFICAR** | Social: interface preparada, ações podem continuar indisponíveis por segurança. Não promover Amigos a P0 nem inventar funções. |
| C01-G11 | P1 | **NO-GO ARTÍSTICO** | Assets CURRENT e gramática do Mundo Visual não equivalem à canonização final de ícones, selos ou ambientes. Não redesenhar/excluir assets neste ciclo. |

**P0 novo comprovadamente independente:** nenhum identificado nesta leitura estática. **Patches adicionais de runtime:** zero; não gerar mudanças artificiais, pois principais pontos materiais encontrados têm PRs protegidas ou carecem de reprodução empírica.

## Checkpoint e próximos ciclos

**CP-MASTER-C01-01 — Resultado: MATRIZ CONSOLIDADA, REVISÃO PENDENTE.** Artefato de evidência, não novo status canônico de Produto/Design. Esta branch modifica apenas este documento, independentemente das PRs #617–#624. Não houve merge, deploy, modificação de RLS, credenciais ou ambientes externos.

**Critérios objetivos para C02:** (a) confrontar rotas P0 com componentes reais e estados; (b) testar visualmente Santuário/Academia/Grimórios/Workspace/Cronograma/Foco com mocks e runner isolado; (c) registrar reprodução e correções somente em novas branches; (d) preservar todos os NO-GO; (e) não declarar WCAG 2.2 AA nem implementação concluída sem evidência específica.