# Academia Arcana — Fase 2 / Ciclo 12 — Reconciliação StatisticsView

**Checkpoint:** C12-R2 / preparação de evidência para encerramento formal  
**Data:** 2026-10-09  
**Base imutável da auditoria:** `main@cc17653dfe79c44dd83ba1ced8cb065383b11ca9`  
**PR original (draft):** #577, head `290a7f36a4cd5bcd402b7eebb37be48e1e0ebccc`  
**PR integrada:** #579, head `6f1b80f924846686ddfaa7d458c3b2ed890ed90b`, merge `c17066bc55e0d922a1e4485c329c9e87237715d0`

## Decisão de baseline

A implementação de #579 já pertence a `main` e **permanece canônica**. A #577 está em draft e não deve ser mesclada, rebaseada automaticamente nem utilizada para substituir a implementação de produção. Esta reconciliação porta apenas contratos e correções comprovadamente ausentes, em branch isolada. Nenhum código de domínio, autenticação, repository, projeção do fluxo real, migration, token global ou primitiva compartilhada pode ser modificado nesta fase.

## Matriz de equivalência e deltas

| Contrato / superfície | #577 | #579 / main antes da reconciliação | Decisão |
| --- | --- | --- | --- |
| `StatisticsView` como presentation-only com projeções prontas | Sim | Sim | Preservar #579; sem substituição do componente |
| Isolamento da aparência | `StatisticsView.module.css` | `StatisticsView.css` escopado por `.statistics-view` | Preservar CSS local; corrigir `display: grid` ausente, sem alterar tokens globais |
| Diferenciação de gamificação, autoavaliação, evidência objetiva, lacunas, reviews | Sim | Sim | Preservar semântica de #579 |
| Harness determinístico com 5 cenários | Sim | Sim (seleção interativa) | Preservar #579 |
| 40 temas, contraste, responsividade e teclado | Sim | Sim | Preservar E2E de #579 |
| Testes consumer a11y específicos da view | 4 testes adicionais | Arquivo ausente e `test:a11y` sem StatisticsView | Recuperar contrato com fixtures canônicos de #579 |
| Cenário `low-confidence` coerente | Evidência ausente no cenário histórico, sem comprovação de coerência completa | `evidence=[]` com métricas de tentativa > 0 | Corrigir fixture e regressão |
| Baseline visual | 3 hashes referentes a #577 | 3 hashes revisados em #579 | Registrar os hashes históricos e substituir na branch por referência candidata após nova inspeção das capturas do grid corrigido; revisão independente ainda pendente |
| Comparação de screenshot portátil | Hash estrito | Hash estrito em qualquer host | Comparar estritamente somente no renderer de referência GitHub Actions Linux; demais ambientes coletam telemetria e executam os demais asserts |
| Independência de autenticação do harness | Projeções não consultam repository | RootLayout ainda resolve identidade | Explicitar dependência do layout |

## Lacunas e reparos propostos

1. **P1 — Integridade de `low-confidence`:** inserir entrada de evidência autorreportada de 1 tentativa e score 0,30, com `confidence=insufficient` e `masteryConfirmed=false`. Zerar `profile.reviewNeed` no fixture, pois não existe revisão vencida. Não alterar a projeção ou o estado real dos usuários.
2. **P1 — Portabilidade da regressão visual:** comparar hashes byte-a-byte **somente** no ambiente de referência (GitHub Actions Linux). Nos demais renderers, coletar hashes/imagens quando solicitado e não inferir regressão a partir de rasterização diferente. Responsividade, contraste, foco, reduced-motion e semântica continuam sendo verificados sem relaxamento. Uma alteração do ambiente de referência que invalide hashes exige inspeção e aprovação humana antes de atualizar baselines.
3. **P1 — Cobertura consumer de acessibilidade:** recuperar quatro verificações de progresso acessível, distinção não cromática, estados sem dados, confirmação objetiva, revisão canônica e baixa confiança; acrescentar o arquivo ao comando `test:a11y`.
4. **P2 — Transparência do harness:** esclarecer que as projeções prontas não consultam repositórios educacionais, mas `RootLayout` resolve a identidade da aplicação.

## Escopo da revisão de segurança

- A rota `/estatisticas` mantém autenticação, Supabase e projeções na page; a view não consulta essas dependências.
- O harness só exercita projeções sintéticas; não equivale a E2E de usuário autenticado e não prova RLS no runtime.
- Não alterar `review-handoff.ts`, dados privados, autenticação, autorizações, migrações ou `AA-ASSET-004`.
- A revisão da PR #579 indicou três threads não resolvidos; não considerá-los aprovados pela mera ocorrência do merge.
- O Quality Gate de PR inclui build de imagem isolada, mas os workflows de publicação e deploy dependem de `push main` e não são acionados por esta branch draft.

## Checkpoints obrigatórios

- **C12-R0 — Auditoria:** CONCLUÍDO. `main` incorpora #579; #577 continua concorrente e não integrada. Contratos comparados sem cherry-pick.
- **C12-R1 — Correções:** IMPLEMENTADAS NESTA BRANCH; requerem verificação após todos os commits.
- **C12-R2 — Validação:** PENDENTE DE RESULTADOS NO HEAD FINAL. Executar lint, TypeScript, unidade (incluindo fixtures), `test:a11y`, build, E2E dirigido e completo, Database Tests, scanners e Code Review. Os resultados de #577/#579 não substituem esses checks.
- **C12-R3 — Fechamento:** **NÃO APROVADO AINDA**. Exige evidência verde no head final, análise de revisão independente, conferência de baseline, justificativa para os três apontamentos originais e decisão humana de integração separada.

## Condições de saída

1. Nenhum comportamento canônico ou fronteira de domínio mudou.
2. Os testes de `low-confidence` verificam que há sinal revisável, não evidência vazia ou domínio confirmado.
3. Capturas mobile (375×812), tablet (768×1024) e desktop (1280×900) preservam a baseline canônica ou há nova inspeção humana formal.
4. O conjunto de 40 temas, foco, contraste e handoffs continua passando.
5. Não há falhas novas de CI, nem reviews bloqueadores sem disposição explícita.
6. Um responsável aprova separadamente a integração e o encerramento formal. A #577 só pode ser encerrada como substituída após comprovação e decisão explícita.

**Estado atual:** `PILOT VALIDATED / RECONCILIATION IN PROGRESS / FORMAL CLOSURE PENDING / NO MERGE / NO DEPLOY`.

**Próximo comando:** Validar o HEAD desta branch com o Quality Gate de pull request, revisar o diff e os apontamentos herdados de #579, registrar o checkpoint C12-R2 e somente então emitir o veredito formal de encerramento ou NO-GO.

## C12-R2a — Primeira execução no head de reconciliação

**Head:** `cf1d18cb419ec752e2f1cf740a7d6688820cbc42`.  
**GitHub Quality Gate:** falhou exclusivamente na asserção de três hashes visuais, depois de lint, typecheck, unitários, consumer a11y e build concluídos em PASS. E2E: **54 PASS / 3 SKIP / 1 FAIL**. Os outros oito workflows do commit concluíram com sucesso.  
**Reproduzibilidade:** o teste visual falhou de forma idêntica em três tentativas. Hashes observados: mobile `2d0d38855f422e0a1530412f5dc1caf01a427b4472226b21c3fc37d7d5c63e66`; tablet `06e293d233a09de82d78824148f58f1a9d97a46693a734c8c876441ee8169ead`; desktop `511c62cd3fe8d8ea92ebfdb7a4f8d9672b2398621ba00bfe6f6a65910f3e4e53`. Estes hashes **não são baselines aprovados**.

**Ação corretiva limitada:** estabilizar captura aguardando fontes, imagens e frames; conservar os três hashes históricos da #579; anexar apenas as capturas sintéticas do harness ao Quality Gate como artefato de evidência para inspeção visual independente. Não atualizar baselines nem contornar a falha sem análise da imagem.

**Estado após R2a:** regressão visual em investigação, **NO-GO para fechamento formal/merge** até nova execução, inspeção do artefato e disposição da divergência. Não houve deploy.

## C12-R2c — Defeito de grid detectado nas capturas; referência candidata

**Evidência preexistente:** `main` e #579 compartilham os mesmos blobs de `StatisticsView.tsx`, `StatisticsView.css`, `globals.css`, `ArcanaFeatureGrid.tsx`, fixtures, layout e `package-lock.json`. A causa histórica da divergência dos hashes da #579 **não foi identificada**: não há PNGs históricos recuperáveis para comprovar equivalência pixel a pixel; não atribuir o drift exclusivamente a fonte ou renderer.

**Defeito visual identificado nas três capturas do run 37985037191:** `.statistics-view .aa-feature-grid` declarava `grid-template-columns`, mas não `display: grid`; a classe não tinha outra regra aplicando layout grid nos estilos consultados. Os cartões, inclusive no desktop, eram empilhados verticalmente. Corrigido **somente** no CSS local, com teste E2E para as grades de gamificação e indicadores educacionais em mobile, tablet e desktop.

**Run de captura da grade corrigida:** https://github.com/arcana-academy/academiaarcana/actions/runs/37986308854  
**Artefato:** https://github.com/arcana-academy/academiaarcana/actions/runs/37986308854/artifacts/11643970446  
**Resultado antes da atualização da referência:** 185 arquivos / 871 unitários PASS, 8 arquivos / 18 testes a11y PASS, build PASS e E2E **53 PASS / 3 SKIP / 1 FAIL** somente na comparação com hashes antigos. Os três PNGs apresentam disposição horizontal dos cartões no desktop, reflow no tablet, pilha no mobile e nenhum corte aparente.

**Comparação dimensional das imagens capturadas, antigo → corrigido:**
- Mobile: `359×5702` → `359×5878`, mantendo uma coluna.
- Tablet: `736×4667` → `736×3764`, cartões distribuídos em múltiplas colunas.
- Desktop: `1248×4545` → `1248×2652`, quatro cards de gamificação e até cinco cards educacionais por linha.

**Verificação visual realizada nesta reconciliação:** inspeção das três capturas do CI sobre integridade das superfícies, rótulos, links, proporções, ausência aparente de overflow, fontes legíveis e separação semântica de gamificação vs autoavaliação vs evidência objetiva. Sem PNGs de referência antigos, a inspeção não valida igualdade pixel a pixel com a #579.

**Referência candidata gravada SOMENTE na branch da PR #587:**
- Mobile `2eeec42fd183353cdd465f67e2da32d31cd71e1a0e52a65f6fbf6c26caa7f0f4`.
- Tablet `879f64382178d4074e5d7f787780f8c56281c953b68c3dc7750f85c781346b6f`.
- Desktop `cd5dbe5c92e11b1522c085da5ec1809977abd3e3cbf1efaa556803ae7bb80d8c`.

**Governança:** a atualização desta baseline é candidata e rastreável, **não** dispensa revisão humana independente nem prova empírica de integração autenticada. É vedado aprovar C12-R3 ou mesclar pela mera passagem posterior do CI. Qualquer mudança visual subsequente exige novo artefato e análise do diff.

**Próxima validação:** reexecutar Quality Gate completo com os três novos hashes e a asserção sobre ambas as grades; conferir status externos e HEAD; exigir revisão independente da PR e disposição dos apontamentos originais da #579.

## C12-R3b — Auditoria de reconciliação e redução do risco P1 (09/10/2026)

**Base consultada antes do ciclo:** `main@cc17653dfe79c44dd83ba1ced8cb065383b11ca9`; PR #577 segue draft sem merge; PR #579 está merged; PR #587 segue draft.

**Evidência anterior de validação (head `de773a8ae73648cc85de4e03b732ba4fe709c38a`):**
- 9/9 workflows e 5/5 statuses externos em sucesso.
- Quality Gate: 871 unitários, 18 a11y e 55 E2E PASS com 3 SKIP, build e smoke de imagem isolada PASS.
- Três PNGs de referência candidata submetidos e reproduzidos no CI; não representam prova de identidade visual com os PNGs antigos de #579.
- Não há review humano `APPROVED` na PR #587; as três threads da #579 permanecem `is_resolved=false` no registro original.

**Disposição verificada dos três achados da #579, sem alterar suas threads:**
1. `statistics-pilot-fixtures.ts` — **RESOLVIDO NO CÓDIGO DA #587**: `low-confidence` contém uma evidência sintética com uma tentativa, média 0,30 e sem confirmação de domínio; revisão vencida zerada. Regressões unitária/consumer e E2E disponíveis.
2. `StatisticsPilotHarness.tsx` — **RESOLVIDO NO CÓDIGO DA #587**: texto não promete isenção de autenticação, declarando identidade resolvida pelo layout compartilhado.
3. `statistics-production-pilot.spec.ts` — **MITIGAÇÃO REFORÇADA**: captura aguarda imagens/fontes, compara estritamente apenas em Linux/CI, produz PNGs sintéticos para inspeção, mantém contraprovas funcionais de acessibilidade, contraste e reflow. O workflow de Quality Gate passa de `ubuntu-latest` a **`ubuntu-24.04`** para impedir a migração automática do *major* de Ubuntu e reduzir instabilidade não relacionada ao código. O Playwright é determinado pelo `package-lock.json`.

**Limite declarado da mitigação:** a label `ubuntu-24.04` **não** congela a imagem exata do runner: o GitHub distribui atualizações de pacotes e fontes continuamente. Logo, mudanças futuras podem alterar hashes. Em tais casos, preservar artefatos, diferenciar drift de regressão visual, revisar capturas e aprovar explicitamente nova baseline, em vez de desativar a verificação visual. A correção não garante reprodutibilidade universal em outros sistemas operacionais.

**Checkpoint atual:** edição de workflow preparada no branch de correção, sujeita a Quality Gate **do NOVO head**. Se a verificação falhar, manter NO-GO, diagnosticar o erro e não presumir equivalência. Não houve merge, publicação nem deploy desta iniciativa.

**Fronteira de aceite:**
- C12-R2: passou no último head já testado; exige reexecução após o novo commit.
- C12-R3: **NO-GO** até revisão independente por responsável, disposição canônica das threads, riscos registrados e autorização explícita separada de integração. Status `CodeRabbit=success` não constitui aprovação humana.
- A revisão do harness sintético não substitui verificação da rota real autenticada ou do ambiente hospedado.

**Próximo comando:** verificar o status do novo head da PR #587 (Quality Gate e checks externos), obter revisão humana independente sobre o delta final e registrar autorização formal de encerramento ou NO-GO, sem merge/deploy.
