# Triagem das 148 issues abertas — checkpoint F7 (2026-10-24)

**Projeto:** Academia Arcana · **Base histórica da PR #821:** `af012a2d04dd14be734ee234e26aaf201d954ea6` (`main` à época da PR).
**PR #821 HEAD inspecionado:** `70e9198eb9d393cfe7a6729d84da7394e668f01e`.
**Regra F7:** documentação e rastreamento não equivalem a implementação, teste, aprovação ou execução operacional.
**Este checkpoint não autoriza merge, comentários, fechamento de issue ou deploy.**

## 1. Inventário (GitHub Search `is:issue is:open`, oito páginas de 20)

| Grupo | Quantidade |
|---|---:|
| F1–F6 (28 + 8 + 16 + 22 + 17 + 17) | 108 |
| Produto P0/P1/P2, incluindo #31 e #33 | **29** |
| Segurança/governança (#530, #534–#537, #588, #589, #594, #595) | 9 |
| Gate visual #678 | 1 |
| Evidência operacional #268 | 1 |
| **Total** | **148** |

A versão anterior informava 28 issues de Produto e apresentava uma soma de 147, embora o total informado fosse 148. Corrigido para 29, sem mover ou excluir issue.

**Reconciliação adicional:** `AA-SPEC-GAP-REGISTER.md` contém **23** linhas `GAP-*`; a descrição original da PR #821 anuncia 22. Corrigir a descrição antes de qualquer integração autorizada.

## 2. Reconciliação das 95 referências de fechamento

- Corpo da PR #821: 95 linhas `Closes #N`, identificadores únicos.
- Todas as 95 issues correspondentes permaneciam abertas na consulta F7.
- 91 identificadores pertencem à série F1–F5; as quatro referências adicionais são #53, #55, #56, #186.
- Inventário `f-series-resolution.json` após correção: 62 `CANÔNICO`, 21 `PARCIAL`, 8 `LACUNA` (91 itens).
- Estados desses documentos são descrições de escopo/contrato, **não** atestações novas de implementação ou execução.
- A lista individual e as decisões de revisão estão em `AA-F7-CLOSURE-RECONCILIATION-2026-10-24.md`.

## 3. Revisão de duplicatas e títulos inconsistentes

| Referências | Constatação por corpo da issue | Decisão F7 |
|---|---|---|
| #93 → #92; #96 → #95; #140 → #139; #144 → #143; #146 → #145 | Corpos idênticos em cada par | Revisar como duplicatas exatas; não fechar automaticamente |
| #55 e #56 → #54 | Corpos idênticos | Revisar como duplicatas exatas; preservar #54 |
| #53 → #52 | Mesmo tema P2.7, porém textos **não idênticos** e critérios não organizados de forma igual | Manter aberta até consolidar todos os requisitos na #52 |
| #168 → #167 | **Não** duplicatas: #167 contém texto F5.14 (migrações); #168 contém F5.15 (rollout/rollback) | Preservar ambas; documentar divergência de título da #167 |
| #186 → #185 | **Não** duplicatas: #185 tem título F6.14 mas corpo F6.13 (backup); #186 contém resiliência F6.14 | Preservar #186 e não considerá-la atendida por #185 |

## 4. Critérios de estado e fechamento

| Estado F7 | Significado | Política de fechamento |
|---|---|---|
| DOCUMENTADO | Existe contrato ou especificação rastreável | Revisão manual de aceite, sem fechamento automático |
| IMPLEMENTADO | Código/recurso identificado por evidência específica | Não presumir a partir do documento |
| TESTADO | Teste real identificado e pertinente ao requisito | Não presumir a partir de lint/typecheck |
| BLOCKED | Lacuna, título divergente, evidência ausente ou aprovação pendente | Manter aberto |
| NÃO APLICÁVEL | Requisito explicitamente rejeitado por decisão competente | Só encerrar mediante decisão rastreável |

F7 não promoveu nenhum item a `IMPLEMENTADO`/`TESTADO` apenas por consulta documental. O status `CANÔNICO` significa que a definição foi registrada; não equivale à homologação de operação.

## 5. Proteção contra encerramento indevido

- `scripts/issue-triage/apply-f-series-triage.mjs` é **somente leitura**; `--apply` falha fechado sem chamar API do GitHub.
- O `f-series-resolution.json` fixa `autoClose: false`, valida 91 entradas e mais quatro referências adicionais.
- O script gera a decisão para 95/95 como `DOCUMENTED_REVIEW_ONLY`, `BLOCKED_*` ou `REVIEW_DUPLICATE_ONLY`.
- **O corpo da PR #821 ainda contém 95 linhas `Closes`. Mesclá-la sem remover essas referências pode fechar as issues pelo próprio GitHub**, independentemente do script.
- A PR #821 deve permanecer aberta/intacta enquanto a descrição e os critérios de aceite não forem revisados por pessoa autorizada.

## 6. Pendências fora da triagem documental

- F6 e #268: restauração, backup, DR, observabilidade, rollback, alertas e evidências de operação real.
- Segurança/governança: #530, #534–#537, #588, #589, #594, #595 permanecem sem declaração de GO.
- Produto (29 issues): épicos de múltiplos critérios permanecem abertos, incluindo as duplicatas sob revisão.
- #678: aprovação visual continua pendente.
- `issues: write`: relato anterior de HTTP 403 para comentar/fechar. F7 não realizou uma tentativa de escrita para testar permissões.

## 7. Evidência e limites de F7

- Verificação em leitura via GitHub: total 148, 95 referências únicas, 95 abertas, 91 entradas originais e títulos/corpos relevantes.
- Correções versionadas somente na branch isolada `work/aa-f7-closure-guard-20261024-head70e9198`.
- Sem alteração da `main`, da PR #821, de issues, secrets, serviços ou ambientes produtivos.
- Testes de contrato locais/GitHub serão registrados no checkpoint final; não reaproveitar `typecheck`/`lint` anteriores como teste do script F7.

