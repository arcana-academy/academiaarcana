# F6.18 — Operação, incidentes e resposta

**Base:** `main` no commit `08f4ca77588fd7869b8b8b1356269fa2291a52fe`  
**Escopo:** definir como a Academia Arcana deve ser operada diante de eventos anormais, falhas, degradações e incidentes, transformando sinais de observabilidade em ações operacionais controladas.

> Um incidente deve possuir um ciclo de vida explícito: detectar, compreender, conter, recuperar, validar e aprender.

## 1. Estado operacional conhecido

A operação da Academia Arcana depende de quatro camadas principais:

| Camada | Papel operacional | Evidência esperada |
| --- | --- | --- |
| Aplicação Next.js | experiência do produto e regras de domínio | logs, erros, smoke tests, releases |
| Supabase | autenticação, Postgres e Storage | saúde do projeto, métricas, integridade, RLS |
| Vercel | build, deployment, runtime e aliases | deployment READY, logs e domínio |
| GitHub | código, CI/CD, histórico e mudanças | commits, checks, PRs e workflows |

O estado operacional deve ser tratado como uma combinação de fatos verificáveis, não como inferência baseada apenas no Git.

## 2. Princípios de operação

1. **Detectar antes de normalizar.** Um sinal não deve ser descartado somente porque o usuário não reproduziu o problema.
2. **Conter antes de corrigir de forma ampla.** Em incidentes de impacto relevante, reduzir blast radius antes de alterações múltiplas.
3. **Separar fato de hipótese.** O registro deve distinguir o que foi observado do que está sendo investigado.
4. **Uma mudança por vez em incidente crítico.** Evitar intervenções concorrentes que eliminem causalidade e dificultem rollback.
5. **Preservar evidência.** Logs, timestamps, deployment, commit, migration, IDs técnicos e sintomas devem ser preservados sem secrets ou dados pessoais desnecessários.
6. **Recuperar a capacidade crítica primeiro.** O produto não precisa voltar integralmente de uma vez para sair de uma condição degradada.
7. **Validar após recuperar.** "Comando executado" não equivale a "serviço recuperado".
8. **Aprender sem procurar culpados.** O post-incident review deve produzir controles, testes, documentação ou automação.

## 3. Ciclo de vida do incidente

```text
Signal / Report
      ↓
Detection
      ↓
Triage
      ↓
Classification
      ↓
Containment
      ↓
Mitigation
      ↓
Recovery
      ↓
Validation
      ↓
Closure
      ↓
Post-Incident Review
```

Cada transição deve possuir um critério de entrada e uma evidência mínima.

## 4. Fontes de detecção

### 4.1 Sinais automáticos

Exemplos:

- aumento de erros HTTP 5xx;
- falhas de autenticação fora do padrão esperado;
- aumento de exceções do runtime;
- falhas recorrentes de chamadas ao Supabase;
- falhas de build/deployment;
- indisponibilidade do domínio;
- regressão em testes E2E;
- falhas de jobs ou integrações quando existirem;
- degradação persistente de uma funcionalidade crítica.

### 4.2 Sinais manuais

Também são incidentes potenciais:

- relato consistente de usuários;
- falha reproduzida pelo time;
- comportamento incorreto percebido em produção;
- aviso de provedor;
- descoberta de configuração insegura;
- alerta de segurança;
- divergência entre ambientes.

Um incidente não precisa de um alerta automático para ser legítimo.

## 5. Triage inicial

No primeiro contato, registrar:

- horário de detecção;
- origem do sinal;
- ambiente;
- superfície afetada;
- sintoma observado;
- primeiro impacto conhecido;
- se há indício de segurança;
- último deployment conhecido;
- mudanças recentes relevantes;
- hipótese inicial, explicitamente marcada como hipótese.

Perguntas mínimas:

1. O problema é reproduzível?
2. A falha afeta todos os usuários ou apenas parte deles?
3. Há perda, corrupção ou exposição de dados?
4. Houve mudança recente?
5. O problema está na aplicação, infraestrutura, dados, credenciais ou dependência?
6. Existe uma mitigação reversível?

## 6. Severity

### SEV-1 — impacto crítico

Indicadores:

- indisponibilidade total das capacidades essenciais;
- perda ou corrupção de dados;
- comprometimento de credenciais privilegiadas;
- incidente de segurança com impacto relevante;
- impossibilidade de operar fluxos fundamentais.

Resposta:

- acionar liderança do incidente;
- preservar evidências;
- conter blast radius;
- limitar mudanças concorrentes;
- executar recuperação priorizada;
- manter registro contínuo.

### SEV-2 — degradação importante

Indicadores:

- fluxo principal parcialmente indisponível;
- degradação persistente de uma capacidade crítica;
- dependência crítica parcialmente fora do ar;
- falha que exige mitigação operacional dedicada.

Resposta:

- triage ampliado;
- mitigação rápida;
- acompanhamento de impacto;
- validação pós-mitigação.

### SEV-3 — impacto limitado

Indicadores:

- funcionalidade não crítica indisponível;
- erro localizado;
- defeito sem risco relevante à integridade dos dados.

Resposta:

- registrar;
- investigar;
- corrigir por fluxo normal ou mudança controlada.

## 7. Papéis durante incidentes

| Papel | Responsabilidade |
| --- | --- |
| Incident Lead | coordenação, prioridade e decisões durante o incidente |
| Application Owner | diagnóstico da aplicação e validação funcional |
| Infrastructure Owner | Vercel, ambientes, domínio e infraestrutura |
| Data Owner | banco, Storage, integridade e recuperação |
| Security Owner | contenção, credenciais e exposição |
| Communications | status factual e comunicação entre envolvidos |
| Observer / Scribe | timeline, evidências e decisões |

Os nomes das pessoas não devem ser embutidos no código ou no runbook versionado como se fossem permanentes.

## 8. Contenção

A contenção deve reduzir risco sem destruir evidência.

Exemplos:

- rollback para deployment conhecido como saudável;
- desabilitar temporariamente uma capacidade não essencial;
- isolar integração externa defeituosa;
- bloquear uma operação destrutiva;
- revogar credencial comprometida;
- restringir uma superfície com comportamento perigoso.

Antes de uma ação irreversível, registrar a decisão e o motivo.

## 9. Mitigação

Mitigação reduz impacto sem necessariamente corrigir a causa raiz.

Exemplos:

- fallback para leitura;
- degradação segura;
- desativação temporária de analytics;
- desacoplamento de integração secundária;
- limitação de operações que amplificam a falha.

Mitigação não deve ser apresentada como correção definitiva.

## 10. Recuperação

Escolher o caminho conforme a natureza do incidente:

```text
Application regression → rollback / redeploy
Deployment failure     → known-good commit / rebuild
Database incident      → F6.13 / F6.17
Storage incident       → restore + reconciliation
Credential incident    → revoke + rotate + redeploy
Dependency outage      → isolation / degradation
DNS/domain failure     → external configuration recovery
```

Sempre validar a compatibilidade entre código, migration, configuração e dados antes de reabrir todas as capacidades.

## 11. Runbook de rollback

```text
Identify affected deployment
        ↓
Confirm known-good deployment
        ↓
Confirm rollback safety
        ↓
Rollback / redeploy
        ↓
Smoke tests
        ↓
Observe errors and critical flows
        ↓
Declare recovered or continue mitigation
```

Um rollback de aplicação não desfaz automaticamente migration ou alterações persistentes.

## 12. Runbook de deployment failure

Quando um deployment falhar:

1. identificar commit;
2. identificar etapa de falha;
3. separar falha de código de falha do provedor;
4. verificar se existe deployment anterior saudável;
5. evitar republicar cegamente o mesmo artefato;
6. validar checks e logs;
7. executar recovery documentado.

A falha externa do Vercel deve ser registrada como falha do provedor, não convertida em diagnóstico de aplicação sem evidência.

## 13. Runbook de banco

O tratamento de banco segue F6.13 e F6.17.

```text
Detect database issue
        ↓
Classify impact
        ↓
Protect evidence
        ↓
Choose read-only / mitigation / restore
        ↓
Validate schema + data + RLS
        ↓
Validate application
        ↓
Resume critical operations
```

Não executar restore destrutivo em produção como primeira reação.

## 14. Runbook de Storage

Banco e objetos são recursos diferentes.

Validar:

- metadata;
- existência do objeto;
- path;
- autorização;
- integridade;
- reconciliação pós-restore.

A presença de uma referência no Postgres não prova, sozinha, a existência do objeto físico.

## 15. Incidentes de credenciais

Em suspeita de comprometimento:

1. identificar escopo provável;
2. preservar evidências relevantes;
3. revogar/desabilitar;
4. verificar uso;
5. rotacionar;
6. atualizar somente os ambientes necessários;
7. redeployar dependentes;
8. validar integrações;
9. registrar a rotação sem gravar o valor secreto.

Nunca colocar tokens, senhas ou connection strings em issues, PRs ou postmortems.

## 16. Segurança durante incidentes

O registro deve separar:

- vulnerabilidade suspeita;
- vulnerabilidade confirmada;
- exploração observada;
- impacto conhecido;
- impacto ainda desconhecido.

Durante uma vulnerabilidade ativa:

- limitar exposição adicional;
- evitar publicar detalhes exploráveis;
- preservar evidências;
- coordenar correção;
- rotacionar segredos quando necessário.

## 17. Observabilidade mínima

A operação deve conseguir responder:

### Saúde

- produção está disponível?
- deployment está READY?
- domínio resolve?
- Supabase está saudável?

### Erros

- quais erros ocorreram?
- quando começaram?
- em qual release?
- qual superfície foi afetada?

### Impacto

- qual fluxo foi afetado?
- todos ou alguns usuários?
- leitura, escrita, autenticação ou navegação?

### Recuperação

- qual ação foi executada?
- qual foi o resultado?
- o erro reduziu?
- qual evidência confirma recuperação?

## 18. Timeline do incidente

Toda ocorrência relevante deve possuir uma timeline factual:

```text
17:02 — primeiro sinal
17:05 — triage iniciado
17:09 — SEV classificado
17:14 — contenção aplicada
17:21 — mitigação validada
17:36 — recovery iniciado
17:44 — smoke tests concluídos
17:51 — operação crítica restaurada
18:10 — incidente encerrado
```

Os horários são apenas exemplo de formato; nunca inventar timestamps em um incidente real.

## 19. Comunicação operacional

Mensagens de incidente devem informar:

- o que foi observado;
- impacto atual;
- ações em andamento;
- próximo ponto de atualização;
- estado da recuperação.

Evitar:

- especulação apresentada como fato;
- culpa individual;
- exposição de dados pessoais;
- secrets;
- detalhes de exploração ainda ativos.

## 20. Critérios de recuperação

A recuperação deve ser declarada somente quando houver evidência de:

- capacidades críticas funcionando;
- autenticação validada;
- leitura e escrita essenciais funcionando quando aplicáveis;
- deployment estável;
- dados íntegros quando houve incidente de dados;
- erros críticos sem tendência de crescimento;
- mitigação controlada;
- observabilidade funcional.

## 21. Critérios de encerramento

O incidente pode ser encerrado quando:

1. impacto crítico foi restaurado ou controlado;
2. os riscos imediatos foram contidos;
3. evidências essenciais foram preservadas;
4. owner e timeline foram registrados;
5. causa confirmada ou hipótese de investigação futura está registrada;
6. follow-ups possuem responsável e prioridade.

Encerrar o incidente não exige que toda causa raiz esteja solucionada.

## 22. Post-Incident Review

O PIR deve responder:

### O que aconteceu?

Descrever o evento de forma factual.

### Como foi detectado?

Registrar sinal inicial e tempo de detecção.

### Qual foi o impacto?

Separar impacto observado de impacto estimado.

### O que funcionou?

Identificar controles que reduziram o impacto.

### O que falhou?

Identificar lacunas de código, processo, observabilidade, configuração, segurança ou documentação.

### O que muda?

Cada follow-up deve ter:

| Campo | Conteúdo |
| --- | --- |
| Ação | mudança concreta |
| Owner | responsável |
| Prioridade | crítica / alta / média / baixa |
| Evidência | teste, PR, dashboard, runbook etc. |
| Prazo | quando aplicável |
| Estado | aberto / em andamento / concluído |

## 23. Métricas operacionais

Quando instrumentadas, acompanhar:

- MTTD — Mean Time To Detect;
- MTTA — Mean Time To Acknowledge;
- MTTC — Mean Time To Contain;
- MTTR — Mean Time To Recover;
- número de incidentes por severidade;
- reincidência;
- falhas de deployment;
- incidentes ligados a mudança;
- erros críticos por release.

As métricas devem ser medidas. Não inventar valores para preencher o relatório.

## 24. Mudanças relacionadas a incidentes

Depois de uma recuperação, mudanças definitivas devem voltar ao processo normal de PR/CI/CD sempre que possível.

Fluxo:

```text
Incident
  ↓
Contain / Recover
  ↓
Root-cause follow-up
  ↓
Issue / Design
  ↓
PR
  ↓
Quality Gate
  ↓
Deploy
  ↓
Validation
```

Mudanças emergenciais devem ser reconciliadas com o código versionado após a estabilização.

## 25. Integração com F6.13–F6.17

A sequência operacional consolidada é:

```text
F6.13 Backup / Recovery
        ↓
F6.14 Resilience / Availability
        ↓
F6.15 CI/CD / Automation
        ↓
F6.16 Deployment / Delivery
        ↓
F6.17 Disaster Recovery / Continuity
        ↓
F6.18 Operations / Incidents / Response
```

Cada camada cobre uma pergunta diferente:

| Fase | Pergunta |
| --- | --- |
| F6.13 | Como recuperar dados? |
| F6.14 | Como resistir a falhas? |
| F6.15 | Como validar e entregar mudanças? |
| F6.16 | Como promover, validar e reverter releases? |
| F6.17 | Como reconstruir após desastre? |
| F6.18 | Como operar, responder e aprender durante incidentes? |

## 26. Evidence Pack de incidente

Para cada SEV-1 ou SEV-2, preservar:

- identificador do incidente;
- horário de início e fim;
- severidade;
- ambiente;
- deployment e commit;
- sintoma;
- impacto;
- timeline;
- decisões;
- ações de contenção;
- mitigação;
- recovery;
- validações;
- causa confirmada ou hipótese;
- follow-ups;
- RTO/MTTR quando medidos.

Não incluir:

- secrets;
- tokens;
- senhas;
- dumps de dados pessoais;
- informações desnecessárias para investigação.

## 27. Exercícios operacionais

Antes de considerar a capacidade madura, executar exercícios progressivos:

### Exercício 1 — rollback de aplicação

Simular uma regressão e validar rollback + smoke tests.

### Exercício 2 — falha de deployment

Simular build/deployment failure e validar decision tree.

### Exercício 3 — degradação de dependência

Simular indisponibilidade de uma dependência secundária e validar safe degradation.

### Exercício 4 — incidente de dados

Executar restore isolado e validar integridade conforme F6.13/F6.17.

### Exercício 5 — credencial

Simular rotação/revogação sem exposição de secrets.

### Exercício 6 — incidente completo

Executar do sinal inicial ao PIR com timeline e evidence pack.

Um exercício só pode ser marcado como concluído com evidência.

## 28. Estado atual e pendências

| Capacidade | Estado |
| --- | --- |
| Ciclo de vida de incidentes | VERIFICADO / DOCUMENTADO |
| Classificação SEV | VERIFICADO / DOCUMENTADO |
| Papéis e responsabilidades | VERIFICADO / DOCUMENTADO |
| Contenção e mitigação | DOCUMENTADO |
| Rollback/recovery | DOCUMENTADO / PENDENTE DE EXERCÍCIO |
| Observabilidade operacional | DOCUMENTADO / PENDENTE DE EVIDÊNCIA |
| Alertas operacionais | PENDENTE DE EVIDÊNCIA |
| MTTD/MTTA/MTTC/MTTR | PENDENTE DE MEDIÇÃO |
| Exercícios de incidente | PENDENTE |
| Evidence Pack validado | PENDENTE |
| Post-Incident Review executado | PENDENTE |
| RTO/RPO medidos | PENDENTE, conforme F6.17 |

## 29. Critério de maturidade operacional

A existência deste documento não prova a operação em produção.

A capacidade passa de **DOCUMENTADA** para **VERIFICADA** somente quando:

1. o cenário foi executado;
2. o comportamento foi observado;
3. a recuperação foi validada;
4. a evidência foi preservada;
5. as lacunas foram registradas;
6. follow-ups foram encaminhados.

## 30. Conclusão

F6.18 estabelece o modelo operacional para a Academia Arcana responder a incidentes de aplicação, infraestrutura, dados, segurança e dependências.

O runbook conecta detecção, triage, severity, contenção, mitigação, recovery, validação, encerramento e aprendizado.

As capacidades que dependem de execução externa permanecem explicitamente pendentes até que exercícios e evidências mensuráveis sejam produzidos.

