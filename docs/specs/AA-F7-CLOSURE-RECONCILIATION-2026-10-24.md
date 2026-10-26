# AA-F7 — Reconciliação individual das 95 referências Closes da PR #821

**Data:** 2026-10-24 · **PR inspecionada:** #821 (`70e9198eb9d393cfe7a6729d84da7394e668f01e`) · **Consulta:** GitHub `is:issue is:open`, 148 registros.

**Objetivo:** conferir cada referência no corpo da PR, sem fechamento automático e sem confundir documentação com código, teste ou aprovação. Nenhum campo abaixo concede GO de release.

**Contagem de lacunas:** 23 entradas `GAP-*` no registro canônico; a PR #821 anuncia 22 e exige reconciliação da descrição antes de merge.

## Estados que esta consulta efetivamente comprova

- **DOCUMENTADO**: existência da seção de especificação em `docs/specs/` para as 91 referências F1–F5; documentação ainda não mesclada.
- **IMPLEMENTADO**: *não homologado neste F7*; seria necessária evidência por requisito/código/commit.
- **TESTADO**: *não homologado neste F7*; typecheck e lint reaproveitados não provam todas as funcionalidades.
- **BLOCKED**: lacuna, incompletude, metadados inconsistentes, equivalência não provada ou aceite pendente.
- **NÃO APLICÁVEL**: nenhuma das 95 foi assim ratificada por autoridade de Produto.

## Tabela individual — estado documental e decisão de encerramento

| Issue | Série | Estado declarado | Decisão F7 (todas sem escrita) |
|---|---|---|---|
| #53 | P/F6 | EXTRA | BLOCKED_RECONCILE_REQUIREMENTS #52 |
| #55 | P/F6 | EXTRA | REVIEW_DUPLICATE_ONLY #54 |
| #56 | P/F6 | EXTRA | REVIEW_DUPLICATE_ONLY #54 |
| #77 | F1.1 | CANÔNICO | REVISAR_ACEITE |
| #78 | F1.2 | CANÔNICO | REVISAR_ACEITE |
| #79 | F1.3 | PARCIAL | BLOCKED_PARCIAL |
| #80 | F1.4 | PARCIAL | BLOCKED_PARCIAL |
| #81 | F1.5 | PARCIAL | BLOCKED_PARCIAL |
| #82 | F1.6 | CANÔNICO | REVISAR_ACEITE |
| #83 | F1.7 | PARCIAL | BLOCKED_PARCIAL |
| #84 | F1.8 | CANÔNICO | REVISAR_ACEITE |
| #85 | F1.9 | LACUNA | BLOCKED_LACUNA |
| #86 | F1.10 | PARCIAL | BLOCKED_PARCIAL |
| #87 | F1.11 | PARCIAL | BLOCKED_PARCIAL |
| #88 | F1.12 | CANÔNICO | REVISAR_ACEITE |
| #89 | F1.13 | CANÔNICO | REVISAR_ACEITE |
| #90 | F1.14 | CANÔNICO | REVISAR_ACEITE |
| #91 | F1.15 | CANÔNICO | REVISAR_ACEITE |
| #92 | F1.16 | LACUNA | BLOCKED_LACUNA |
| #93 | F1.16 | LACUNA | DUPLICATA_EXATA_REVISAR #92 |
| #94 | F1.17 | CANÔNICO | REVISAR_ACEITE |
| #95 | F1.18 | CANÔNICO | REVISAR_ACEITE |
| #96 | F1.18 | CANÔNICO | DUPLICATA_EXATA_REVISAR #95 |
| #97 | F1.19 | PARCIAL | BLOCKED_PARCIAL |
| #98 | F1.20 | CANÔNICO | REVISAR_ACEITE |
| #99 | F1.21 | CANÔNICO | REVISAR_ACEITE |
| #100 | F1.22 | CANÔNICO | REVISAR_ACEITE |
| #101 | F1.23 | CANÔNICO | REVISAR_ACEITE |
| #102 | F1.24 | CANÔNICO | REVISAR_ACEITE |
| #103 | F1.25 | CANÔNICO | REVISAR_ACEITE |
| #104 | F1.26 | CANÔNICO | REVISAR_ACEITE |
| #105 | F2.1 | PARCIAL | BLOCKED_PARCIAL |
| #106 | F2.2 | CANÔNICO | REVISAR_ACEITE |
| #107 | F2.3 | CANÔNICO | REVISAR_ACEITE |
| #108 | F2.4 | CANÔNICO | REVISAR_ACEITE |
| #109 | F2.5 | CANÔNICO | REVISAR_ACEITE |
| #110 | F2.6 | CANÔNICO | REVISAR_ACEITE |
| #111 | F2.7 | CANÔNICO | REVISAR_ACEITE |
| #112 | F2.8 | CANÔNICO | REVISAR_ACEITE |
| #113 | F3.1 | CANÔNICO | REVISAR_ACEITE |
| #114 | F3.2 | CANÔNICO | REVISAR_ACEITE |
| #115 | F3.3 | CANÔNICO | REVISAR_ACEITE |
| #116 | F3.4 | PARCIAL | BLOCKED_PARCIAL |
| #117 | F3.5 | CANÔNICO | REVISAR_ACEITE |
| #118 | F3.6 | CANÔNICO | REVISAR_ACEITE |
| #119 | F3.7 | CANÔNICO | REVISAR_ACEITE |
| #120 | F3.8 | CANÔNICO | REVISAR_ACEITE |
| #121 | F3.9 | PARCIAL | BLOCKED_PARCIAL |
| #122 | F3.10 | PARCIAL | BLOCKED_PARCIAL |
| #123 | F3.11 | CANÔNICO | REVISAR_ACEITE |
| #124 | F3.12 | CANÔNICO | REVISAR_ACEITE |
| #125 | F3.13 | LACUNA | BLOCKED_LACUNA |
| #126 | F3.14 | PARCIAL | BLOCKED_PARCIAL |
| #127 | F3.15 | CANÔNICO | REVISAR_ACEITE |
| #128 | F3.16 | CANÔNICO | REVISAR_ACEITE |
| #129 | F4.1 | CANÔNICO | REVISAR_ACEITE |
| #130 | F4.2 | CANÔNICO | REVISAR_ACEITE |
| #131 | F4.3 | CANÔNICO | REVISAR_ACEITE |
| #132 | F4.4 | CANÔNICO | REVISAR_ACEITE |
| #133 | F4.5 | CANÔNICO | REVISAR_ACEITE |
| #134 | F4.6 | PARCIAL | BLOCKED_PARCIAL |
| #135 | F4.7 | CANÔNICO | REVISAR_ACEITE |
| #136 | F4.8 | CANÔNICO | REVISAR_ACEITE |
| #137 | F4.9 | CANÔNICO | REVISAR_ACEITE |
| #138 | F4.10 | CANÔNICO | REVISAR_ACEITE |
| #139 | F4.11 | LACUNA | BLOCKED_LACUNA |
| #140 | F4.11 | LACUNA | DUPLICATA_EXATA_REVISAR #139 |
| #141 | F4.12 | PARCIAL | BLOCKED_PARCIAL |
| #142 | F4.13 | PARCIAL | BLOCKED_PARCIAL |
| #143 | F4.14 | PARCIAL | BLOCKED_PARCIAL |
| #144 | F4.14 | PARCIAL | DUPLICATA_EXATA_REVISAR #143 |
| #145 | F4.15 | CANÔNICO | REVISAR_ACEITE |
| #146 | F4.15 | CANÔNICO | DUPLICATA_EXATA_REVISAR #145 |
| #147 | F4.16 | CANÔNICO | REVISAR_ACEITE |
| #148 | F4.17 | CANÔNICO | REVISAR_ACEITE |
| #149 | F4.18 | CANÔNICO | REVISAR_ACEITE |
| #150 | F4.19 | CANÔNICO | REVISAR_ACEITE |
| #151 | F5.1 | CANÔNICO | REVISAR_ACEITE |
| #152 | F5.2 | CANÔNICO | REVISAR_ACEITE |
| #154 | F5.3 | CANÔNICO | REVISAR_ACEITE |
| #155 | F5.4 | PARCIAL | BLOCKED_PARCIAL |
| #156 | F5.5 | CANÔNICO | REVISAR_ACEITE |
| #157 | F5.6 | CANÔNICO | REVISAR_ACEITE |
| #158 | F5.7 | CANÔNICO | REVISAR_ACEITE |
| #159 | F5.8 | CANÔNICO | REVISAR_ACEITE |
| #160 | F5.9 | LACUNA | BLOCKED_LACUNA |
| #161 | F5.10 | LACUNA | BLOCKED_LACUNA |
| #162 | F5.11 | CANÔNICO | REVISAR_ACEITE |
| #163 | F5.12 | CANÔNICO | REVISAR_ACEITE |
| #166 | F5.13 | PARCIAL | BLOCKED_PARCIAL |
| #167 | F5.15 | PARCIAL | BLOCKED_CORPO_F5.14_TITULO_F5.15 |
| #168 | F5.15 | PARCIAL | BLOCKED_REQUISITO_DISTINTO_167 |
| #169 | F5.16 | CANÔNICO | REVISAR_ACEITE |
| #170 | F5.17 | CANÔNICO | REVISAR_ACEITE |
| #186 | F6.14 | EXTRA | BLOCKED_KEEP_OPEN #185 |

## Duplicatas verificadas por conteúdo

- Exatas entre F: #93=#92, #96=#95, #140=#139, #144=#143, #146=#145.
- Exatas entre Produto: #55=#54 e #56=#54.
- Não equivalentes: #53 versus #52 (redação e critérios diferentes); #167 versus #168 (migrações versus rollout); #186 versus #185 (resiliência versus backup).
- A #167 tem título F5.15 com corpo iniciado em F5.14; a #185 tem título F6.14 com corpo iniciado em F6.13. Essas divergências devem ser corrigidas por processo próprio, não por fechamento automático.

## Gate de segurança para continuidade

**NO-GO:** o corpo da PR #821 continua contendo 95 comandos de fechamento automático `Closes`. Não mesclar a PR sem retirar ou aprovar individualmente essas referências e sem satisfazer os controles humanos de revisão.

**Permissões:** o histórico anterior registra 403 em operações `issues: write`; F7 não executou comentários ou fechamentos e não atestou a permissão atual por tentativa de escrita.

**Reprodução de leitura:** `node scripts/issue-triage/apply-f-series-triage.mjs --check` valida o mapeamento local; invocação padrão lista os 95 itens sem escrever; `--apply` retorna erro.

