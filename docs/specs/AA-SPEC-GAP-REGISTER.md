# AA-SPEC — Registro único de lacunas

**Projeto:** Academia Arcana · **Atualizado em:** 2026-10-24
**Regra:** uma lacuna só deixa de existir quando há implementação + teste + evidência de execução.
Uma lacuna **não** é fechada por documentação. Cada linha aponta o rastreador público correspondente.

| ID | Lacuna | Origem | Impacto | Rastreador |
|---|---|---|---|---|
| `GAP-F1-09` | Não existe domínio, tabela, fila ou worker de **notificações** | F1.9 (#85) | nenhum aviso assíncrono ao usuário | esta tabela |
| `GAP-F1-10` | Não existe **analytics** persistente; `/estatisticas` é leitura derivada | F1.10 (#86) | sem série histórica própria | esta tabela |
| `GAP-F1-11` | **Trilha de auditoria** persistente não existe; eventos de `trust` são contrato | F1.11 (#87) | auditoria depende de log de plataforma | esta tabela |
| `GAP-F1-15` | **Barramento de eventos** inexistente (só catálogo) | F1.15 (#91) | derivados só síncronos | esta tabela |
| `GAP-F1-16` | **Entrega de eventos** (publish/consume/retry) inexistente | F1.16 (#92/#93) | idem | esta tabela |
| `GAP-F2-01` | Entidades do texto original sem equivalente (Customer, Conversation, Message, Ticket, Article, Document, Notification, Analytics, Audit Event, Setting) | F2.1 (#105) | produto não as oferece | esta tabela |
| `GAP-F3-04` | Transporte de eventos ausente | F3.4 (#116) | sem integração assíncrona | esta tabela |
| `GAP-F3-13` | Runtime assíncrono (fila/worker/scheduler) ausente | F3.13 (#125) | nada roda em background | esta tabela |
| `GAP-F3-14` | Webhook **de evento** de entrada ausente (só callback OAuth) | F3.14 (#126) | provedor não empurra evento | esta tabela |
| `GAP-F4-13` | Sem avaliação de **qualidade de resposta de IA** (benchmark/regressão semântica) | F4.13 (#142) | mudança de modelo não é medida | esta tabela |
| `GAP-F6-11` | Sem métricas/SLO/alertas de produto | F6.11 (#182) | falha silenciosa | #268 |
| `GAP-F6-12` | Sem tracing distribuído e sem retenção declarada de logs | F6.12 (#183) | diagnóstico lento | #268 |
| `GAP-F6-13` | Backups sem prova de restore executada | F6.13 (#184) | RPO/RTO não comprovados | #268 |
| `GAP-F6-17` | Custódia OCI independente e DR não testados | F6.17 (#190) | continuidade não comprovada | #594 |
| `GAP-F6-18` | Sem plantão/canal de incidente/SLA/postmortem | F6.18 (#191) | resposta depende de pessoa | esta tabela |
| `GAP-F6-19` | Sem registro formal de aprovação de mudança por deploy | F6.19 (#192) | mudança não auditável ponta a ponta | esta tabela |
| `GAP-SEC-536` | Segredos de runtime ainda em Environment Variables do provedor | #536 | `next build` no domínio de confiança | #536 |
| `GAP-SEC-APPS` | Permissões de GitHub Apps não minimizadas / bypass não auditável | #534, #537 | autoridade de escrita externa | #534 / #537 |
| `GAP-SEC-BRACES` | Advisory dev-only de `braces` sem correção publicada | #535 | lint tooling | #535 |
| `GAP-PRIV-588` | Retenção de feedback antes de `FK CASCADE` não ratificada | #588, #530 | exclusão de conta pode falhar | #588 / #530 |
| `GAP-GOV-595` | DEP-C17-01…08 sem decisores designados | #595 | bloqueia produto institucional | #595 |
| `GAP-REV-589` | Revisão humana independente da PR #587 não designada | #589 | governança | #589 |
| `GAP-VIS-678` | GO/REJECT visual dos JPGs Canva pendente | #678 | arte do Santuário bloqueada | #678 |

## Regra de manutenção

1. Nova lacuna → nova linha aqui **e** issue de rastreio (ou referência a issue existente).
2. Lacuna resolvida → linha marcada como `RESOLVIDA em <commit/PR>` e só então removida.
3. Nenhuma linha é removida por conveniência de fechamento de issue.
