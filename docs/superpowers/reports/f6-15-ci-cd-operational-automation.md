# F6.15 — CI/CD e automação operacional

**Base:** `main` no commit `3459444851bca0ee763845a891a251e72af3c7a4`  
**Escopo:** consolidar o fluxo de mudança da Academia Arcana em processos reproduzíveis, auditáveis e controlados, separando validação automática de decisões operacionais.

> Automatizar o que é determinístico. Manter controle explícito onde há privilégio elevado, impacto destrutivo ou dependência de julgamento humano.

## 1. Pipeline atual observado

O repositório possui um Quality Gate em GitHub Actions acionado por:

- `workflow_dispatch`;
- push em `main`;
- push em `feat/**`;
- pull requests direcionados a `main`.

O workflow utiliza:

- Ubuntu;
- Node.js 22;
- npm;
- `npm ci --legacy-peer-deps`;
- Playwright para E2E.

A sequência atualmente observada é:

```text
Checkout
  ↓
Node 22
  ↓
Install
  ↓
Typecheck
  ↓
Lint
  ↓
Unit
  ↓
Accessibility
  ↓
Production Build
  ↓
Playwright Browser
  ↓
E2E
```

## 2. Princípio de mudança

Toda mudança deve atravessar quatro estados:

```text
Change
  ↓
Validation
  ↓
Eligibility
  ↓
Delivery
```

### Change

Alteração proposta em branch ou PR.

### Validation

Evidência automática de qualidade, segurança e compatibilidade.

### Eligibility

Decisão de que o artefato validado pode ser entregue ao ambiente pretendido.

### Delivery

Deployment, promoção ou rollback realizado de forma rastreável.

## 3. Quality Gates

O gate funcional mínimo atual compreende:

- TypeScript typecheck;
- ESLint;
- testes unitários;
- testes de acessibilidade;
- build de produção;
- testes E2E.

Os gates complementares observados incluem:

- CodeQL;
- Gitleaks;
- Dependency Review;
- DeepSource JavaScript;
- DeepSource SQL;
- DeepSource Secrets;
- qlty;
- AccessLint;
- pre-commit.ci;
- CommitCheck;
- CodeRabbit.

Um PR não deve ser considerado validado apenas porque um único teste passou.

## 4. Concurrency e cancelamento

O Quality Gate utiliza `concurrency` por workflow/ref com `cancel-in-progress: true`.

Objetivo operacional:

- evitar consumo simultâneo desnecessário;
- cancelar uma execução obsoleta quando uma alteração mais recente substituí-la;
- reduzir feedback conflitante sobre o mesmo branch/PR.

## 5. Permissões do CI

O Quality Gate possui:

```yaml
permissions:
  contents: read
```

e o checkout usa `persist-credentials: false`.

Esses controles devem permanecer como padrão: workflows não devem adquirir escrita administrativa ou acesso a secrets sem requisito concreto documentado.

## 6. Segredos e configurações

O CI utiliza variáveis necessárias para os testes E2E.

A chave publishable do Supabase pode aparecer em contexto público de cliente/teste; isso não deve ser confundido com:

- service-role key;
- database password;
- connection string privilegiada;
- token de administração.

Nenhuma dessas credenciais privilegiadas deve ser colocada diretamente em workflow, issue, PR ou código.

Para qualquer novo secret:

1. identificar finalidade;
2. limitar escopo;
3. armazenar no mecanismo de secrets apropriado;
4. limitar ambientes autorizados;
5. definir rotação/revogação;
6. evitar impressão em logs.

## 7. Automação segura

### Pode ser automatizado

- lint;
- typecheck;
- testes;
- accessibility;
- build;
- scans de segurança;
- validação de dependências;
- criação de artifacts;
- execução de checks;
- cancelamento de runs obsoletas.

### Exige controle operacional

- alteração de produção;
- alteração de credenciais;
- alteração destrutiva de banco;
- restore;
- rollback;
- mudança de permissões;
- migração incompatível;
- alteração de infraestrutura crítica.

Automação não deve transformar um comando com potencial destrutivo em operação sem guardrails.

## 8. Database changes

Mudanças de banco devem passar pelo fluxo:

```text
Migration proposal
  ↓
Review
  ↓
Validation
  ↓
Apply in intended environment
  ↓
Observe
  ↓
Recovery path
```

Uma migration não deve ser considerada segura apenas porque compila.

Para mudanças destrutivas:

- possuir backup conforme F6.13;
- possuir estratégia de recuperação;
- avaliar compatibilidade entre versões;
- evitar acoplamento irreversível quando uma etapa expand/contract for possível.

## 9. Deployment

CI e deployment são responsabilidades relacionadas, mas distintas.

```text
GitHub Actions
  = validates artifact
```

```text
Vercel / infrastructure
  = delivers artifact
```

O commit em `main` não comprova que uma nova versão está em produção.

O estado operacional deve ser confirmado pelo deployment real.

## 10. Promotion

Uma promoção deve exigir:

- artefato validado;
- configuração correspondente;
- dependências compatíveis;
- banco compatível;
- observabilidade disponível;
- caminho de rollback conhecido;
- ausência de bloqueio operacional.

Não promover um artefato apenas porque o pipeline terminou.

## 11. Rollback

Rollback deve apontar para um deployment conhecido como saudável e seguir o runbook de F6.14.

Após rollback:

1. verificar deployment;
2. verificar autenticação;
3. verificar leitura;
4. verificar escrita crítica;
5. observar erros;
6. registrar resultado.

Rollback de aplicação não desfaz automaticamente alterações de banco.

## 12. Artifacts

Artifacts de CI devem conter somente aquilo que seja necessário para diagnóstico ou distribuição.

Nunca incluir:

- dumps de produção;
- service-role keys;
- passwords;
- connection strings;
- tokens;
- dados pessoais desnecessários.

Quando um artifact puder conter dados sensíveis, aplicar retenção e controle de acesso apropriados.

## 13. Reprodutibilidade

O projeto deve manter alinhados:

- `.nvmrc`;
- `packageManager`;
- lockfile;
- versões dos workflows;
- versão de Playwright utilizada no Quality Gate.

Uma diferença entre ambiente local e CI deve ser tratada como risco de reprodutibilidade, não como detalhe irrelevante.

## 14. Falhas de automação

### Falha transitória

Pode ser reexecutada quando não houver indício de alteração necessária.

### Falha determinística

Corrigir a causa antes de repetir indefinidamente.

### Falha de infraestrutura externa

Registrar claramente como dependência externa, por exemplo o bloqueio atual do Vercel por `build-rate-limit`.

Não mascarar uma falha do provedor como sucesso do deployment.

## 15. Dependabot e atualizações

Atualizações automáticas de dependência devem:

- passar pelo mesmo Quality Gate;
- verificar compatibilidade;
- respeitar lockfile;
- revisar impacto de segurança;
- evitar merges automáticos quando a mudança exigir decisão operacional.

## 16. Critérios de fechamento da F6.15

Para considerar CI/CD operacionalmente consolidado, devem existir evidências de:

| Capacidade | Estado |
| --- | --- |
| Quality Gate automatizado | **VERIFICADO** |
| Testes funcionais no PR | **VERIFICADO** |
| Security scanning | **VERIFICADO** |
| Cancelamento de runs obsoletas | **VERIFICADO** |
| Princípio de menor privilégio no CI | **VERIFICADO** |
| Fluxo de deployment rastreável | **PARCIAL / EXTERNO** |
| Promotion testada | **PENDENTE** |
| Rollback testado | **PENDENTE** |
| Gates de banco em mudanças críticas | **PENDENTE** |
| Artifacts auditados para retenção/sensibilidade | **PENDENTE** |
| Automação operacional de incidentes | **PENDENTE** |
| Evidência completa de produção após merge | **PENDENTE** enquanto Vercel estiver bloqueado |

## 17. Regra de governança

A automação deve diminuir variabilidade sem apagar responsabilidade.

Nenhum workflow deve:

- contornar RLS;
- ignorar falha de segurança;
- promover código não validado;
- publicar secret;
- aplicar mudança destrutiva sem guardrail;
- declarar produção saudável sem evidência de runtime.

## Conclusão

A Academia Arcana já possui um pipeline CI significativo e com múltiplas camadas de validação. A F6.15 transforma esse estado existente em um contrato operacional explícito, preservando menor privilégio e distinguindo claramente validação automática de operações de entrega e recuperação que ainda dependem de infraestrutura externa.

As lacunas restantes são apresentadas como pendentes, e não como capacidades já comprovadas.
