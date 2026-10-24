# AA-F8 — Proposta não aplicada de descrição segura para a PR #821

**Data:** 2026-10-24 · **PR original:** #821 (HEAD `70e9198eb9d393cfe7a6729d84da7394e668f01e`).
**F7 base dos testes:** `5026df8dcbba82e7cd9e71cd59324704de5fe5dc`.

## Ação proposta — NÃO EXECUTADA

- Remover as 95 linhas de fechamento automático do corpo da PR #821; preservar os números como referências não mutáveis.
- Não realizar merge, fechamento de issue, publicação, nem alterar a descrição da PR original sem autorização explícita.
- Reclassificar os vínculos #167/#168 e #185/#186; manter ambos os requisitos.
- A descrição proposta abaixo não modifica o GitHub. Integração dos patches F7/F8 à PR #821 ainda é decisão separada.

## Comandos e evidência F8

- Executor autorizado: `DESKTOP-71IV4IB` (online); `node --version`: `v24.22.1`.
- Arquivos obtidos em leitura pelo conector GitHub no commit F7 indicado; copiados para `TEMP/aa-f8-20261024-5026df8/scripts/issue-triage` em diretório isolado.
- Comando: `node --test scripts/issue-triage/apply-f-series-triage.test.mjs`: **4 PASS, 0 FAIL**.
- Teste prova recusa de `--apply` mesmo com `GITHUB_TOKEN`/`GH_TOKEN` sintéticos.
- Execução direta `node scripts/issue-triage/apply-f-series-triage.mjs --check`: **PASS**, saída `95/95 unique; 91 F-series; 4 additional; 29 PARCIAL/LACUNA; 5 internal duplicate reviews`, exit code 0.
- Execução direta `--apply` iniciada, mas a sessão remota não preservou o resultado final; **a prova de rejeição é o teste automatizado acima**, que verificou exit code 2 e mensagem `issue mutations are disabled` mesmo com tokens sintéticos.
- Como o script não importa cliente de rede/GitHub nem subprocessos, e os testes inspecionados rejeitam `--apply`, nenhuma chamada mutável foi programada ou autorizada.
- Nenhum processo foi iniciado com autorização para escrever em GitHub Issues.

## Descrição substituta sugerida (somente proposta)

## O que este PR faz

Consolida a série **F1–F6** — que existia apenas como corpo de issue no GitHub — em documentação canônica
ancorada em código real, e entrega a **triagem completa das 148 issues abertas**.

### Documentos criados

| Documento | Escopo |
|---|---|
| `docs/specs/AA-SPEC-F1-MODULE-BOUNDARIES.md` | 28 issues F1 |
| `docs/specs/AA-SPEC-F2-DOMAIN-MODEL.md` | 8 issues F2 |
| `docs/specs/AA-SPEC-F3-CONTRACTS.md` | 16 issues F3 |
| `docs/specs/AA-SPEC-F4-TEST-STRATEGY.md` | 22 issues F4 |
| `docs/specs/AA-SPEC-F5-IMPLEMENTATION.md` | 17 issues F5 |
| `docs/specs/AA-SPEC-F6-INFRASTRUCTURE.md` | 17 issues F6 + #268 |
| `docs/specs/AA-SPEC-GAP-REGISTER.md` | 23 lacunas com ID estável |
| `docs/specs/AA-ISSUE-TRIAGE-2026-10-24.md` | triagem e critério de encerramento |

### Transposição explícita

A série foi escrita para o enquadramento genérico "Support Arcana" (`customers`, `tickets`,
`conversations`…). A Academia Arcana **não** possui esses módulos. Cada seção foi transposta para os
domínios canônicos de `src/core/architecture/domains.ts`; onde não há equivalente, o fato virou lacuna
registrada — nada foi inventado como existente.

### O que **não** é encerrado

- #530, #534, #535, #536, #537, #588, #589, #594, #595 — dependem de decisão humana ou acesso a provedor;
- toda a série F6 aberta — regra de #268: documentação ≠ evidência de execução;
- série P — épicos plurirrequisito, recebem estado, não fechamento;
- #678 (gate visual) e #268 (rastreador de evidência operacional).

### Execução no GitHub (transparência)

A consulta anterior registrou HTTP 403 para operações com Issues; a permissão atual de escrita não foi revalidada por tentativa mutável. O script revisado na branch F7 é **somente leitura**: `--apply` é bloqueado, e as quatro verificações Node F8 passaram. **Esta PR não deve fechar issues automaticamente por merge.** As correções F7/F8 estão em branch separada e não fazem parte do diff original até composição explicitamente autorizada.

### Referências rastreadas para revisão individual (95 issues; nenhum fechamento automático)

- **F1** (28): #77, #78, #79, #80, #81, #82, #83, #84, #85, #86, #87, #88, #89, #90, #91, #92, #93, #94, #95, #96, #97, #98, #99, #100, #101, #102, #103, #104
- **F2** (8): #105, #106, #107, #108, #109, #110, #111, #112
- **F3** (16): #113, #114, #115, #116, #117, #118, #119, #120, #121, #122, #123, #124, #125, #126, #127, #128
- **F4** (22): #129, #130, #131, #132, #133, #134, #135, #136, #137, #138, #139, #140, #141, #142, #143, #144, #145, #146, #147, #148, #149, #150
- **F5** (17): #151, #152, #154, #155, #156, #157, #158, #159, #160, #161, #162, #163, #166, #167, #168, #169, #170
- **Referências adicionais** (4): #53 (reconciliar critérios com #52), #55 e #56 (duplicatas textuais da #54), #186 (resiliência, diferente de #185).

**Atenção F7:** #167 contém especificação de migrações (F5.14), enquanto #168 trata de rollout/rollback (F5.15). São requisitos distintos. O inventário reconciliado contém 148 issues: 108 F, 29 Produto, 9 segurança/governança, #678 e #268. F1–F5 não devem ser encerradas sem aceite individual com evidência de cumprimento do escopo.

### Verificação

- `npm run typecheck` e `npm run lint` verdes na evidência original (não repetidos por F8)
- F8: 4/4 testes Node aprovados na cópia isolada dos scripts F7, sem escrita em Issues
- alteração restrita a `docs/` e `scripts/issue-triage/` (nenhum código de produção, migração, segredo ou deploy)

## Verificações de segurança desta proposta

- As 95 linhas de fechamento foram removidas do texto sugerido; 95 eram únicas no original.
- A descrição da PR #821 **não foi alterada**.
- Nenhuma issue foi comentada ou encerrada.
