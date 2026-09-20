# F6.17 — Disaster Recovery e continuidade

**Base:** `main` no commit `0c8cc88437c3380b704f37e0d91cb74c4a4b8267`  
**Escopo:** definir como a Academia Arcana deve preservar suas capacidades essenciais e recuperar infraestrutura, dados e serviços após um evento grave.

> Continuidade preserva funções críticas durante uma interrupção. Disaster Recovery reconstrói ou restaura a capacidade operacional depois de um evento grave.

## 1. Estado operacional conhecido

### GitHub

O repositório é a fonte versionada de:

- código;
- workflow de CI;
- migrations versionadas;
- documentação operacional;
- contratos e testes.

A recuperação do código parte do GitHub, portanto a integridade do repositório e o acesso às identidades administrativas são dependências do DR.

### Vercel

O projeto de produção observado é o projeto Next.js da Academia Arcana.

Deployment de produção atualmente confirmado:

- deployment: `dpl_5qsB7DP9oNnD3YgCPmtqMUQkfq5z`;
- estado: `READY`;
- target: `production`;
- commit: `2e2aa683f79f88333e8866e7dd82c236b5fd1e50`;
- região observada: `iad1`.

Os merges posteriores já estão em `main`, mas ainda não há evidência de deployment de produção correspondente a eles nesta inspeção. O estado de produção, portanto, deve ser validado separadamente do estado do Git.

### Supabase

O projeto remoto observado está:

- `ACTIVE_HEALTHY`;
- PostgreSQL 17.6.1;
- região `us-west-2`.

As tabelas de domínio observadas estão com RLS habilitado.

O projeto está associado a uma organização no plano Free. A estratégia de recuperação do banco depende do runbook de F6.13 e de backup externo ao repositório.

## 2. Classificação de desastre

Os cenários devem ser classificados antes da recuperação.

| Cenário | Exemplo | Impacto potencial | Caminho primário |
| --- | --- | --- | --- |
| Aplicação | regressão grave em release | Alto | rollback/redeploy |
| Deployment | build ou runtime indisponível | Alto | deployment saudável/rebuild |
| Banco | indisponibilidade/corrupção | Crítico | restore/F6.13 |
| Storage | perda de objetos | Alto | restauração de objetos/F6.13 |
| Credenciais | comprometimento de secret | Crítico | revogar, rotacionar, redeploy |
| Repositório | indisponibilidade do GitHub | Alto | acesso administrativo e recuperação de controle |
| Domínio/DNS | resolução indisponível | Alto | corrigir configuração externa |
| Dependência | serviço terceiro fora do ar | Variável | degradação/isolamento |
| Desastre amplo | perda simultânea de capacidade | Crítico | reconstrução coordenada |

## 3. Fluxo geral de DR

```text
Disaster / Major Incident
        ↓
Detection
        ↓
Assessment
        ↓
Containment
        ↓
Recovery Decision
        ↓
Restore / Rebuild / Rollback
        ↓
Validation
        ↓
Resume Critical Operations
        ↓
Observe
        ↓
Return to Normal
```

Nenhuma etapa de recuperação deve ser marcada como concluída apenas pela execução do comando. Cada etapa precisa de evidência.

## 4. Severity

### SEV-1 — Perda crítica

Indicadores:

- perda ou corrupção de dados;
- indisponibilidade total de produção;
- comprometimento de credenciais privilegiadas;
- impossibilidade de executar operações críticas.

A prioridade é preservar evidência, conter dano e recuperar o mínimo operacional.

### SEV-2 — Degradação importante

Indicadores:

- fluxo principal parcialmente indisponível;
- dependência crítica degradada;
- falha persistente de uma superfície importante.

A prioridade é isolar a falha e manter as capacidades essenciais.

### SEV-3 — Impacto limitado

Indicadores:

- funcionalidade não crítica indisponível;
- erro localizado;
- impacto sem risco relevante à integridade dos dados.

A correção pode seguir o fluxo normal de mudança, sem acionar DR completo.

## 5. Decisão de recuperação

Antes de restaurar ou reconstruir:

1. identificar o recurso afetado;
2. preservar evidências;
3. estimar impacto;
4. verificar se o problema é aplicação, infraestrutura, dados, credencial ou dependência;
5. escolher rollback, restore, rebuild ou mitigação;
6. registrar quem autorizou a ação;
7. verificar compatibilidade do caminho escolhido.

Em caso de dúvida entre rollback e restore, preservar primeiro os dados e evidências necessários para análise.

## 6. Recuperação da aplicação

Se o problema estiver limitado à aplicação:

```text
Identify bad release
      ↓
Select known healthy deployment
      ↓
Rollback / redeploy
      ↓
Smoke tests
      ↓
Observe
```

Um rollback de aplicação não restaura dados apagados nem desfaz migration incompatível automaticamente.

## 7. Recuperação do deployment

Se não houver deployment utilizável:

```text
Known-good commit
      ↓
CI validation
      ↓
Deploy
      ↓
READY
      ↓
Alias / domain validation
      ↓
Smoke tests
      ↓
Production observation
```

A reconstrução deve usar o commit e configuração conhecidos, não código alterado durante o incidente sem validação.

## 8. Recuperação do banco

A recuperação do Postgres segue F6.13:

```text
Identify recovery point
      ↓
Select private backup
      ↓
Restore isolated environment
      ↓
Validate schema
      ↓
Validate data integrity
      ↓
Run application smoke tests
      ↓
Validate authorization / RLS
      ↓
Prepare production recovery
      ↓
Observe
```

Não executar restore destrutivo em produção como primeira tentativa.

Primeiro validar o backup em ambiente isolado.

## 9. Recuperação do Storage

Como banco e objetos físicos são recursos diferentes:

```text
Restore database metadata
       +
Restore object data
       ↓
Reconcile paths / metadata
       ↓
Validate access
       ↓
Validate critical objects
```

A recuperação não pode assumir que metadata no Postgres implica existência do arquivo físico.

## 10. Recuperação de credenciais

Se houver suspeita de comprometimento:

1. revogar ou desabilitar a credencial comprometida;
2. verificar uso e escopo;
3. gerar nova credencial;
4. atualizar somente os ambientes necessários;
5. redeployar dependentes;
6. validar autenticação e integrações;
7. registrar o incidente.

Credenciais anteriores devem ser consideradas inválidas depois da rotação quando a natureza da ameaça exigir revogação imediata.

Não registrar secrets no incidente.

## 11. Continuidade funcional

Durante uma interrupção, preservar primeiro:

### Prioridade crítica

- autenticação;
- acesso ao Workspace;
- leitura de dados do usuário;
- persistência das operações essenciais.

### Prioridade alta

- Santuário;
- edição;
- ordenação;
- recursos essenciais de navegação.

### Prioridade menor

- analytics;
- recursos não críticos;
- integrações auxiliares.

Uma funcionalidade não crítica não deve bloquear a recuperação do núcleo do produto.

## 12. Rebuild completo

Quando houver necessidade de reconstrução:

```text
Repository
   ↓
Infrastructure account access
   ↓
Project recreation
   ↓
Environment configuration
   ↓
Database recovery
   ↓
Storage recovery
   ↓
Application deployment
   ↓
DNS / aliases
   ↓
Smoke tests
   ↓
Observation
```

A reconstrução deve ser documentada passo a passo para não depender de memória individual.

## 13. Validação pós-DR

### Infraestrutura

- projeto disponível;
- deployment READY;
- domínio correto;
- runtime executando;
- dependências conectadas.

### Banco

- schema presente;
- dados consistentes;
- RLS presente;
- policies válidas;
- migrations reconciliadas.

### Aplicação

- login;
- sessão;
- Santuário;
- Workspace;
- leitura;
- criação;
- edição;
- ordenação.

### Segurança

- secrets válidos;
- credenciais comprometidas revogadas;
- nenhum diagnóstico exposto;
- permissions verificadas.

### Observabilidade

- erros monitorados;
- logs disponíveis;
- alertas funcionais quando configurados;
- capacidade de detectar regressões pós-recuperação.

## 14. Reconciliação

Após a recuperação, comparar:

- versão do código;
- schema;
- migrations;
- dados;
- objetos de Storage;
- configuração;
- variáveis de ambiente;
- deployment;
- domínio;
- observabilidade.

A recuperação não deve criar um ambiente divergente silenciosamente.

## 15. Evidence Pack

Cada teste ou incidente de DR deve produzir um pacote mínimo contendo:

- incidente ou teste identificado;
- horário;
- cenário;
- ponto de recuperação escolhido;
- deployment/ambiente utilizado;
- ações realizadas;
- validações;
- falhas encontradas;
- resultado;
- RTO medido;
- RPO observado;
- ações corretivas.

Não incluir:

- senhas;
- tokens;
- connection strings;
- dumps de produção;
- dados pessoais desnecessários.

## 16. Exercícios de DR

Os exercícios devem progredir sem impacto desnecessário:

### Exercício 1 — Restore isolado

Restaurar um backup em ambiente não produtivo e validar integridade.

### Exercício 2 — Rebuild da aplicação

Reconstruir um ambiente a partir do repositório e configuração documentada.

### Exercício 3 — Rollback

Selecionar um deployment conhecido como saudável e executar rollback controlado.

### Exercício 4 — Recovery completo

Simular perda significativa do ambiente e executar o fluxo completo.

### Exercício 5 — Credencial comprometida

Simular rotação e revogação sem expor secrets.

Nenhum desses exercícios deve ser tratado como concluído sem evidência registrada.

## 17. RTO e RPO

Os valores não devem ser inventados.

Até que sejam medidos:

| Recurso | RPO | RTO | Estado |
| --- | --- | --- | --- |
| Workspace / Postgres | A definir | A definir | PENDENTE |
| Storage | A definir | A definir | PENDENTE |
| Aplicação | A definir | A definir | PENDENTE |
| Autenticação/configuração | A definir | A definir | PENDENTE |

O primeiro valor operacional deve vir de necessidade do produto e de teste real.

## 18. Responsabilidades

A recuperação precisa distinguir papéis:

| Função | Responsabilidade |
| --- | --- |
| Incident lead | coordenação e decisão do incidente |
| Application owner | comportamento da aplicação |
| Infrastructure owner | Vercel/rede/ambientes |
| Data owner | restore/integridade |
| Security owner | credenciais e contenção |
| Observer | evidência e monitoramento |

Os nomes concretos dos responsáveis devem ser mantidos em mecanismo operacional apropriado, não embutidos em código.

## 19. Comunicação

Durante um incidente:

- registrar fatos;
- evitar especulação;
- separar causa confirmada de hipótese;
- registrar impacto;
- registrar mudanças de estado;
- registrar decisões;
- comunicar quando a capacidade crítica estiver restaurada.

Não publicar informações que facilitem exploração de uma vulnerabilidade ativa.

## 20. Critérios de encerramento do desastre

O incidente pode sair de DR quando:

- capacidades críticas estiverem restauradas;
- integridade dos dados estiver validada;
- autenticação estiver funcional;
- deployment estiver estável;
- observabilidade estiver ativa;
- erros críticos não estiverem aumentando;
- ações de contenção estiverem completas;
- próximo passo preventivo estiver registrado.

Encerramento operacional não significa que a causa raiz já esteja totalmente corrigida.

## 21. Critérios de fechamento da F6.17

| Capacidade | Estado |
| --- | --- |
| Runbook de DR | VERIFICADO |
| Classificação de incidentes | VERIFICADO |
| Recovery decision tree | VERIFICADO |
| Aplicação: rollback/redeploy | DOCUMENTADO / PENDENTE DE TESTE |
| Banco: restore | DOCUMENTADO / PENDENTE DE TESTE |
| Storage: restore | DOCUMENTADO / PENDENTE DE TESTE |
| Credenciais: revogação/rotação | DOCUMENTADO / PENDENTE DE TESTE |
| Rebuild completo | DOCUMENTADO / PENDENTE DE TESTE |
| RTO/RPO medidos | PENDENTE |
| Exercício de DR executado | PENDENTE |
| Evidence Pack validado | PENDENTE |
| Continuidade funcional comprovada | PENDENTE |

## Conclusão

A Academia Arcana agora possui uma sequência documental contínua:

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
```

O conjunto estabelece o caminho operacional de proteção, detecção, entrega, rollback, restore, rebuild e retorno à operação.

As capacidades que exigem execução externa continuam explicitamente pendentes até que exercícios reais produzam evidência mensurável.
