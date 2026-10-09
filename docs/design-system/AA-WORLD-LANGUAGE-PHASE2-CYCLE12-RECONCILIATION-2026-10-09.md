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
| Isolamento da aparência | `StatisticsView.module.css` | `StatisticsView.css` escopado por `.statistics-view` | Preservar estratégia já integrada |
| Diferenciação de gamificação, autoavaliação, evidência objetiva, lacunas, reviews | Sim | Sim | Preservar semântica de #579 |
| Harness determinístico com 5 cenários | Sim | Sim (seleção interativa) | Preservar #579 |
| 40 temas, contraste, responsividade e teclado | Sim | Sim | Preservar E2E de #579 |
| Testes consumer a11y específicos da view | 4 testes adicionais | Arquivo ausente e `test:a11y` sem StatisticsView | Recuperar contrato com fixtures canônicos de #579 |
| Cenário `low-confidence` coerente | Evidência ausente no cenário histórico, sem comprovação de coerência completa | `evidence=[]` com métricas de tentativa > 0 | Corrigir fixture e regressão |
| Baseline visual | 3 hashes referentes a #577 | 3 hashes diferentes e revisados em #579 | Preservar os hashes de #579; não transplantar baselines |
| Comparação de screenshot portátil | Hash estrito | Hash estrito em qualquer host | Comparar estritamente somente no renderer de referência GitHub Actions Linux; demais ambientes coletam telemetria e executam os demais asserts |
| Independência de autenticação do harness | Projeções não consultam repository | RootLayout ainda resolve identidade | Explicitar dependência do layout |

## Lacunas e reparos propostos

1. **P1 — Integridade de `low-confidence`:** inserir entrada de evidência autorreportada de 1 tentativa e score 0,30, com `confidence=insufficient` e `masteryConfirmed=false`. Zerar `profile.reviewNeed` no fixture, pois não existe revisão vencida. Não alterar a projeção ou o estado real dos usuários.
2. **P1 — Portabilidade da regressão visual:** manter os três hashes da #579 e a comparação byte-a-byte **somente** no ambiente de referência (GitHub Actions Linux). Nos demais renderers, coletar hashes/imagens quando solicitado e não inferir regressão a partir de rasterização diferente. Responsividade, contraste, foco, reduced-motion e semântica continuam sendo verificados sem relaxamento. Uma alteração do ambiente de referência que invalide hashes exige inspeção e aprovação humana antes de atualizar baselines.
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
