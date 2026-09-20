# F6.20 — Matriz requisito → infraestrutura

Base: main no commit 4e6bb6dc8fe06a17d1b016d5cbad407edc945840

## Objetivo

Consolidar a relação rastreável entre requisitos da Academia Arcana e as capacidades necessárias para executá-los com segurança, confiabilidade, observabilidade e recuperação.

Fluxo:

Requirement
→ Acceptance Criterion
→ Domain / Contract
→ Implementation
→ Infrastructure Capability
→ Configuration
→ Security / Observability
→ Deployment
→ Recovery

## 1. Princípio

Um requisito não é operacionalmente completo apenas porque existe código. A matriz deve mostrar onde o requisito é definido, qual contrato o representa, qual implementação o executa, qual infraestrutura o sustenta, quais controles de segurança existem, como o comportamento é observado, como chega à produção e como é recuperado.

## 2. Colunas

| Campo | Descrição |
| --- | --- |
| Requirement ID | identificador |
| Requirement | requisito |
| Acceptance Criterion | condição verificável |
| Domain | domínio responsável |
| Contract | contrato/interface/policy |
| Implementation | arquivo/componente/use case |
| Persistence | banco/Storage |
| Infrastructure | Vercel/Supabase/GitHub etc. |
| Configuration | variáveis/configuração |
| Security | auth/RLS/ownership/secrets |
| Observability | logs/erros/métricas/alertas |
| Delivery | CI/CD/deployment |
| Recovery | rollback/restore/rebuild |
| Evidence | evidência disponível |
| State | VERIFIED / DOCUMENTED / EXTERNAL / PENDING |

## 3. Estados

**VERIFIED** — existe evidência verificável de execução.

**DOCUMENTED** — processo ou arquitetura documentados, sem evidência operacional suficiente.

**EXTERNAL** — capacidade depende de provedor ou configuração externa.

**PENDING** — capacidade identificada, mas depende de implementação, exercício, medição ou evidência.

Não promover DOCUMENTED para VERIFIED por inferência.

## 4. Identidade e autorização

| Requisito | Domain | Infraestrutura | Segurança | Recovery |
| --- | --- | --- | --- | --- |
| Usuário autenticado | identity / authorization | Supabase Auth | sessão + RLS | recuperação do provedor |
| Ownership de dados | authorization / learning | Supabase Postgres | RLS + ownership | restore + validação |
| Acesso por contexto | context | Supabase + aplicação | autorização contextual | recovery da aplicação |

## 5. Workspace e hierarquia

A hierarquia é:

Grimório → Notebook → Capítulo → Página

| Capacidade | Domain | Implementation | Infrastructure | Security | Recovery |
| --- | --- | --- | --- | --- | --- |
| Grimórios | learning | Workspace/application | Supabase Postgres | ownership/RLS | DB restore |
| Notebooks | learning | Workspace/application | Supabase Postgres | ownership/RLS | DB restore |
| Capítulos | learning | Workspace/application | Supabase Postgres | ownership/RLS | DB restore |
| Páginas | learning | Workspace/application | Supabase Postgres | ownership/RLS | DB restore |
| Ordenação de páginas | learning | application/repository | Supabase position persistence | ownership/RLS | reload + DB recovery |

## 6. Santuário

| Seção | Fonte | Dependência |
| --- | --- | --- |
| Header | identity/context | sessão |
| Continue Learning | learning/workspace | dados reais |
| Daily Missions | gamification | configuração/dados |
| Progress Summary | learning/gamification | progresso |
| Schedule Preview | planning | planejamento |
| Quick Actions | application/navigation | rotas/permissões |

A interface não deve simular dados ausentes. Estados vazios e não configurados devem ser explícitos.

## 7. Planejamento

A cadeia esperada é:

planning domain
→ application policies
→ repository / port
→ Supabase
→ Santuário / Cronograma

Projeções devem usar dados reais, comportamento determinístico e estados apropriados para ausência ou erro.

## 8. Gamificação

Missões, streak, conquistas e progresso devem separar:

- regra de negócio;
- persistência;
- cálculo;
- UI;
- observabilidade;
- recovery.

Uma animação de recompensa não prova persistência.

## 9. Observabilidade

Todo requisito crítico deve responder:

- como saberemos que funciona?
- como saberemos que falhou?
- onde o erro aparece?
- como identificamos o deployment?
- como medimos recovery?

Cadeia mínima:

Requirement
→ Runtime signal
→ Log / Error / Metric
→ Alert or investigation
→ Incident
→ Recovery

## 10. Segurança

Para dados protegidos:

Identity
→ Authentication
→ Authorization
→ Ownership
→ RLS
→ Repository
→ Application

Registrar autenticação, autorização, ownership, RLS, exposição pública, secrets e dados pessoais quando aplicável.

## 11. Configuração

Identificar dependências de:

- variável pública;
- variável secreta;
- Vercel;
- Supabase;
- GitHub;
- domínio;
- integração externa.

Nunca registrar valores secretos.

## 12. Delivery

Todo requisito que chega à produção deve possuir:

Implementation
→ Tests
→ Quality Gate
→ Merge
→ Deployment
→ Smoke Test
→ Observation

GitHub e produção não devem ser tratados como o mesmo estado sem confirmação do deployment.

## 13. Recovery

Capacidades críticas devem apontar para um caminho:

- aplicação: rollback / redeploy;
- banco: backup / restore conforme F6.13 e F6.17;
- Storage: restore + reconciliation;
- credenciais: revoke + rotate + redeploy;
- infraestrutura: rebuild / provider recovery;
- dependência externa: degradation / isolation / provider recovery.

## 14. Rastreabilidade de mudanças

Requirement
→ Issue
→ PR
→ Commit
→ Quality Gate
→ Deployment
→ Evidence

Quando uma etapa não puder ser comprovada, marcar como PENDING ou EXTERNAL.

## 15. Matriz inicial

| Capability | Domain | Implementation | Infrastructure | Security | Observability | Delivery | Recovery | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Autenticação | identity | auth application | Supabase Auth | session | runtime errors | CI/deploy | provider recovery | EXTERNAL |
| Workspace persistence | learning | repositories/application | Supabase Postgres | RLS/ownership | errors | CI/deploy | DB restore | VERIFIED / EXTERNAL |
| Grimório | learning | Workspace | Supabase Postgres | RLS | application errors | CI/deploy | DB restore | VERIFIED |
| Notebook | learning | Workspace | Supabase Postgres | RLS | application errors | CI/deploy | DB restore | VERIFIED |
| Capítulo | learning | Workspace | Supabase Postgres | RLS | application errors | CI/deploy | DB restore | VERIFIED |
| Página | learning | Workspace | Supabase Postgres | RLS | application errors | CI/deploy | DB restore | VERIFIED |
| Ordenação de página | learning | application/repository | Supabase Postgres | RLS | mutation errors | CI/deploy | DB restore | VERIFIED |
| Santuário | sanctuary | Sanctuary components/policies | Supabase + app | session/ownership | error/loading states | CI/deploy | redeploy/recovery | VERIFIED / EXTERNAL |
| Continue Learning | sanctuary/learning | ContinueLearning | Workspace data | ownership | loading/error | CI/deploy | DB/app recovery | DOCUMENTED / VERIFIED path |
| Daily Missions | sanctuary/gamification | DailyMissions | application/data | authorization | state/error | CI/deploy | app/data recovery | DOCUMENTED / PENDING evidence |
| Schedule Preview | sanctuary/planning | SchedulePreview | planning data | authorization | loading/error | CI/deploy | DB/app recovery | DOCUMENTED |
| Quick Actions | sanctuary | QuickActions | app routes | authorization | runtime errors | CI/deploy | redeploy | DOCUMENTED |
| CI Quality Gate | delivery | GitHub Actions | GitHub | least privilege | workflow result | GitHub | rerun/revert | VERIFIED |
| Production deployment | delivery | Next.js build | Vercel | project permissions | deployment state | Vercel | rollback/redeploy | EXTERNAL |
| Database recovery | data/infra | runbook | Supabase | privileged access | recovery evidence | operational | restore | PENDING |
| Disaster recovery | infra/trust | F6.17 runbook | GitHub/Vercel/Supabase | controlled recovery | evidence pack | rebuild | restore/rebuild | PENDING |
| Incident response | trust/infra | F6.18 runbook | all providers | incident controls | timeline/metrics | operational | recovery | DOCUMENTED |
| Change management | trust/infra | F6.19 runbook | GitHub/Vercel/Supabase | change controls | post-change | CI/CD | rollback/reconcile | DOCUMENTED |

## 16. Critério de completude

Um requisito é operacionalmente completo quando houver evidência suficiente nas dimensões relevantes:

1. requisito;
2. acceptance criterion;
3. domínio;
4. implementação;
5. infraestrutura;
6. configuração;
7. segurança;
8. observabilidade;
9. delivery;
10. recovery.

A ausência de uma dimensão deve ser intencional e documentada.

## 17. Lacunas atuais

Permanecem dependentes de execução real:

- backups e restore testados;
- RTO/RPO medidos;
- exercícios de disaster recovery;
- exercícios de incident response;
- rollback real;
- alertas operacionais;
- métricas operacionais;
- configuração de produção completamente evidenciada;
- reconciliação de Storage;
- recovery de credenciais;
- smoke tests de produção após releases quando o deployment externo puder ser confirmado.

## 18. Integração F6.13–F6.20

F6.13 Backup / Recovery
→ F6.14 Resilience / Availability
→ F6.15 CI/CD / Automation
→ F6.16 Deployment / Delivery
→ F6.17 Disaster Recovery / Continuity
→ F6.18 Operations / Incidents / Response
→ F6.19 Change / Configuration Management
→ F6.20 Requirement → Infrastructure Traceability

F6.20 consolida os contratos anteriores em uma visão ponta a ponta.

## 19. Manutenção

Atualizar a matriz quando:

- novo requisito surgir;
- domínio mudar;
- infraestrutura mudar;
- migration for criada;
- configuração mudar;
- segurança mudar;
- observabilidade mudar;
- deployment mudar;
- recovery mudar.

A matriz não deve ser tratada como documento estático.

## Conclusão

F6.20 estabelece rastreabilidade entre requisito, implementação e infraestrutura da Academia Arcana, tornando explícito onde cada capacidade vive, do contrato de domínio ao mecanismo de recuperação.

Estados PENDING e EXTERNAL permanecem explícitos até que existam evidências suficientes para promovê-los.
