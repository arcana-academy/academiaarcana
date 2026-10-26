# docs/specs — Especificação canônica consolidada

Esta pasta materializa a série F (F1–F6) que vivia apenas como corpo de issue no GitHub.
Cada documento é a fonte canônica do seu tema e está ancorado em arquivos reais do repositório.

| Documento | Escopo |
|---|---|
| `AA-SPEC-F1-MODULE-BOUNDARIES.md` | módulos, dependências, eventos, ownership, configuração (F1.1–F1.26) |
| `AA-SPEC-F2-DOMAIN-MODEL.md` | entidades, agregados, estados, invariantes (F2.1–F2.8) |
| `AA-SPEC-F3-CONTRACTS.md` | commands, queries, eventos, erros, validação, versionamento (F3.1–F3.16) |
| `AA-SPEC-F4-TEST-STRATEGY.md` | níveis de teste, cobertura e quality gates (F4.1–F4.19) |
| `AA-SPEC-F5-IMPLEMENTATION.md` | implementação, ordem, rollout, rastreabilidade (F5.1–F5.17) |
| `AA-SPEC-F6-INFRASTRUCTURE.md` | infraestrutura e operação, estados VERIFIED/DOCUMENTED/EXTERNAL (F6.1–F6.19) |
| `AA-SPEC-GAP-REGISTER.md` | registro único de lacunas com ID estável |
| `AA-ISSUE-TRIAGE-2026-10-24.md` | triagem das 148 issues abertas e critério de encerramento |

## Regras

1. Documento não substitui evidência de execução (regra herdada de #268).
2. Lacuna só sai do registro com implementação + teste + evidência.
3. Nenhuma capacidade é declarada existente por existir rota ou pasta (AA-PROD-002).
4. Autoridade superior: `docs/architecture/AA-ARCHITECTURE-1.0.md` e `docs/product/AA-PRODUCT-1.0.md`.
