# Triagem das 148 issues abertas — 2026-10-24

**Projeto:** Academia Arcana · **Baseline:** `af012a2d04dd14be734ee234e26aaf201d954ea6` (`main`)
**Escopo:** classificação de **todas** as issues abertas, com decisão de disposição e evidência associada.
**Regra aplicada:** uma issue só é encerrada quando o critério de aceite é demonstrável no repositório.
O que depende de decisão humana, acesso a provedor ou contrato pago **não** é encerrado — recebe estado.

## 1. Inventário

| Grupo | Quantidade | Natureza |
|---|---:|---|
| Série F1–F6 (spec/constitucional) | 108 | corpo da issue é a própria especificação; 5 já fechadas antes |
| Série P (produto) | 28 | épicos de roadmap (P0/P1/P2) |
| Segurança / governança | 9 | #530, #534, #535, #536, #537, #588, #589, #594, #595 |
| Gate visual | 1 | #678 |
| Evidência operacional | 1 | #268 |
| **Total** | **148** | |

## 2. Documentos canônicos produzidos nesta triagem

| Documento | Cobre |
|---|---|
| `docs/specs/AA-SPEC-F1-MODULE-BOUNDARIES.md` | F1.1–F1.26 (28 issues) |
| `docs/specs/AA-SPEC-F2-DOMAIN-MODEL.md` | F2.1–F2.8 (8) |
| `docs/specs/AA-SPEC-F3-CONTRACTS.md` | F3.1–F3.16 (16) |
| `docs/specs/AA-SPEC-F4-TEST-STRATEGY.md` | F4.1–F4.19 (22) |
| `docs/specs/AA-SPEC-F5-IMPLEMENTATION.md` | F5.1–F5.17 (17) |
| `docs/specs/AA-SPEC-F6-INFRASTRUCTURE.md` | F6.1–F6.19 abertas (17) + #268 |
| `docs/specs/AA-SPEC-GAP-REGISTER.md` | 22 lacunas rastreadas com ID estável |

## 3. Duplicatas identificadas

| Tema | Manter | Encerrar como duplicata |
|---|---|---|
| F1.16 evento — ciclo de vida | #92 | #93 |
| F1.18 leitura/escrita/mutação | #95 | #96 |
| F4.11 testes assíncronos | #139 | #140 |
| F4.14 privacidade e segurança | #143 | #144 |
| F4.15 UI e acessibilidade | #145 | #146 |
| F5.15 rollout e rollback | #167 | #168 |
| F6.14 resiliência | #185 (já fechada) | #186 |
| P2.7 integração/ecossistema | #52 | #53 |
| P2.8 importação/exportação | #54 | #55, #56 |

## 4. Disposição por grupo

### 4.1 Série F1–F5 — **ENCERRADA com evidência documental**

Critério: a entrega pedida pela issue é a **definição canônica** de fronteira/contrato/teste/implementação.
Cada issue tem seção própria no documento correspondente, ancorada em arquivo de código existente, e as
lacunas reais foram movidas para o registro único com ID estável. Encerrar a issue **não** declara a lacuna
resolvida.

### 4.2 Série F6 — **MANTIDA ABERTA** (exceto duplicata #186)

Motivo: `docs/superpowers/reports/operational-evidence-baseline.md` e #268 fixam que documentação não é
evidência de execução. Backup, DR, observabilidade e operação exigem exercício datado e/ou acesso a provedor.
`AA-SPEC-F6-INFRASTRUCTURE.md` registra o estado real de cada item (VERIFIED / DOCUMENTED / EXTERNAL).

### 4.3 Série P — **MANTIDA ABERTA**, com estado atualizado

São épicos de produto plurirrequisito. Encerrar exigiria implementação integral de cada capacidade. O que
existe está mapeado em `AA-SPEC-F5` §F5.17 e `AA-SPEC-F4` §F4.17; o que não existe está no registro de
lacunas. Duplicatas de P2.7/P2.8 são encerradas.

### 4.4 Segurança e governança — **MANTIDAS ABERTAS**

| Issue | Bloqueio real | Evidência |
|---|---|---|
| #536 | valores de credencial ainda em Environment Variables do Render | não há acesso ao provedor nesta sessão; `gh api` administrativo responde 403 |
| #534 / #537 | permissões de GitHub Apps instalados e bypass de branch protection não são legíveis/alteráveis | `GET /branches/main/protection` → 403; `GET /rulesets` → `[]` |
| #535 | advisory dev-only de `braces` sem versão corrigida publicada | `braces` já está em `3.0.3` (última publicada) |
| #588 / #530 | política de retenção exige Produto + Privacidade/Jurídico nomeados | decisão humana |
| #589 | revisão humana independente da PR #587 | decisão humana |
| #594 | custódia OCI independente + DR testado | acesso a provedor |
| #595 | designação de decisores DEP-C17-01…08 | decisão humana |

Nenhum desses é encerrado, coerente com o texto das próprias issues ("do not close until…").

### 4.5 #678 — **MANTIDA ABERTA**

Gate visual exige os JPGs originais e assinatura de responsável visual autorizado. Não há decisão de mérito
nesta triagem.

### 4.6 #268 — **MANTIDA ABERTA**

É o rastreador de evidência operacional e continua válido; recebe referência cruzada ao documento F6.

## 5. Verificação desta entrega

| Verificação | Resultado |
|---|---|
| `npm run typecheck` | verde (execução local no baseline) |
| `npm run lint` | verde (execução local no baseline) |
| Alteração de código de produção | **nenhuma** — apenas documentação |
| Migrações, deploy, segredo ou produção | **nenhum** toque |
| Issues encerradas | apenas com critério demonstrável (série F1–F5 + duplicatas) |

## 6. O que permanece e por quê

As 22 lacunas do registro não são fecháveis por um agente nesta sessão: exigem (a) decisão humana nomeada,
(b) acesso a Render/GitHub App/OCI, ou (c) implementação de capacidade nova que muda escopo de produto.
Todas estão rastreadas, com dono sugerido e evidência necessária.
