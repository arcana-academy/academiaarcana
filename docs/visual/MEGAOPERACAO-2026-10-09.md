# Academia Arcana — Megaoperação visual (checkpoint 01)

## Escopo verificado
- Repositório: `arcana-academy/academiaarcana`, Next.js App Router + React + TypeScript + Supabase.
- Portais do Professor, Tutor e Mentor ainda **não** possuem rotas próprias na árvore `src/app` verificada nesta auditoria; seus protótipos não são aplicações funcionais.
- Há temas canônicos em `src/design-system/themes/` e tokens em `src/design-system/tokens/`. Não substituir presets ou CSS global para aplicar um tema sazonal.
- A arte de Flonts validada pela pessoa proprietária é uma ilustração original fornecida nesta conversa. Para uso no projeto, armazenar o arquivo de origem intacto e incorporar apenas variantes derivadas verificadas, sem regeneração por IA.

## Entregas deste checkpoint
- Catálogo de quatro temas sazonais com identificadores estáveis.
- Camada CSS isolada por `data-aa-event-theme`, sem alterar tokens canônicos.
- Prévia demonstrativa de landing, formulário, galeria e cronograma, em `/design-system/eventos`.
- Testes unitários do catálogo.
- Pacote local separado com ilustração, variantes WebP, hashes e instruções.
- Miniatura real de Flonts (`public/assets/flonts/flonts-mago-mini-96.webp`) integrada à branch e usada na Sidebar compartilhada; master e variantes maiores aguardam upload.
- Arquivo de trava `docs/visual/FLONTS-VISUAL-LOCK.json`, verificador SHA-256 e teste automatizado.
- Quatro temas fixos de demonstração vinculados aos presets existentes em `/design-system/temas-fixos`.

## Restrições de Produto e Segurança
- Não usar WordPress/Elementor/ACF/CPT: não fazem parte da arquitetura atual.
- Sem eventos criados, inscrições, envio de formulários, alteração de contas, permissões ou infraestrutura.
- Não criar funcionalidades de professor/tutor/mentor sem matriz de autorização e critérios de aceitação; não colocar links inoperantes na navegação de produção.
- Não aplicar em produção ou declarar prontidão sem CI, segurança, acessibilidade e validação das pessoas responsáveis.
- Não ativar temas sazonais automaticamente: ativação contextual depende de decisões e regras aprovadas.

## Próximos bloqueadores
1. Integrar o arquivo mestre e as variantes 320/480/960 aprovadas do Flonts ao repositório. A miniatura 96×120 está integrada na branch, mas ainda não publicada.
2. Auditar cada rota existente e mapear UX atual vs. contrato canônico para Professor, Tutor e Mentor.
3. Priorizar rotas por P0/P1 e validar autorização em cada operação de leitura/escrita.
4. Completar templates reutilizáveis e ligar ações reais a APIs seguras e testes.
5. Validar responsividade, navegação por teclado, redução de movimento, contraste e WCAG 2.2 AA na interface executável.
6. Revisão de PR, Quality Gate, homologação e aprovação antes de produção.

## Checkpoint
ENTREGUE: estrutura isolada de temas sazonais e pacote local da arte.
PARCIAL: implementação de portais e cobertura de todas as telas.
PENDENTE: integração dos assets no repositório, validações de build, UX e deploy.
