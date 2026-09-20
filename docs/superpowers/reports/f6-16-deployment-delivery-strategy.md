# F6.16 — Deploy e estratégias de entrega

Base: main no commit 21e1a2f6366e40fbf9bbaf0e651d2d350c1bfacd
Escopo: definir a estratégia operacional de entrega da Academia Arcana entre GitHub, CI, Vercel, Supabase e ambientes de execução.

> Um commit em main, um build bem-sucedido e um deployment de produção são estados diferentes e devem possuir evidência própria.

## 1. Estado atual observado

A cadeia atual é:

GitHub
  ↓
GitHub Actions
  ↓
Quality / Security Gates
  ↓
Vercel
  ↓
Production

O projeto Vercel observado é um projeto Next.js.

O deployment de produção mais recente confirmado pelo provedor é:

- deployment: dpl_5qsB7DP9oNnD3YgCPmtqMUQkfq5z;
- estado: READY;
- target: production;
- commit: 2e2aa683f79f88333e8866e7dd82c236b5fd1e50;
- commit associado: merge do PR #259.

Os merges posteriores (#260, #261 e #262) já alteraram main, mas não há evidência, nesta inspeção, de um novo deployment de produção correspondente a esses commits.

Isso confirma a necessidade de separar source state, validated artifact e production state.

## 2. Estados de entrega

### Source
Commit versionado no branch apropriado.

### Validated
Commit submetido aos Quality Gates e aprovado pelos testes definidos.

### Deployable
Versão com dependências, configuração, banco, observabilidade e recuperação compatíveis.

### Deployed
Artefato efetivamente executado pelo provedor de infraestrutura.

### Production-ready
Deployment em produção validado funcionalmente e operacionalmente.

Uma versão pode ser validated e ainda não estar deployed.

## 3. Eligibility de deployment

Antes de promover qualquer versão, validar:

- Quality Gate;
- security scans;
- compatibilidade de dependências;
- migrations;
- variáveis de ambiente;
- configuração do Supabase;
- compatibilidade de Storage;
- observabilidade;
- estratégia de rollback;
- recovery path.

Para mudanças de banco, aplicar também a política de F6.13.

## 4. Estratégia de ambientes

Os ambientes devem ser logicamente separados:

Local
  ↓
CI
  ↓
Preview / Validation
  ↓
Production

Cada ambiente deve possuir:

- credenciais próprias quando necessárias;
- configuração explicitamente identificável;
- dados compatíveis com sua finalidade;
- regras de acesso adequadas.

Dados de produção não devem ser copiados para ambientes de desenvolvimento/teste sem sanitização e controle.

## 5. Preview

Preview é destinado a verificar o artefato fora da produção.

Objetivos:

- validar integração da aplicação;
- verificar renderização;
- executar smoke tests;
- observar configuração;
- detectar regressões visuais ou funcionais.

Preview não deve ser tratado automaticamente como produção.

## 6. Production

Uma release só deve ser declarada em produção quando houver evidência do deployment real.

Checklist mínimo pós-deploy:

1. deployment READY;
2. domínio/alias correto;
3. autenticação funcionando;
4. Santuário carregando;
5. Workspace carregando;
6. leitura da hierarquia;
7. escrita essencial;
8. ausência de aumento anormal de erros;
9. smoke tests concluídos.

## 7. Promotion

Promotion deve ser uma operação explícita:

Validated Artifact
      ↓
Eligibility Check
      ↓
Promotion
      ↓
Smoke / Health
      ↓
Observe
      ↓
Keep / Rollback

A promoção deve ser rastreável por commit, deployment, horário, ambiente, resultado e responsável operacional.

## 8. Rollback

Rollback deve utilizar um deployment conhecido como saudável.

Antes do rollback:

- registrar o incidente;
- identificar o deployment atual;
- identificar o último deployment saudável;
- verificar compatibilidade do banco.

Depois:

- confirmar novo estado do deployment;
- executar smoke tests;
- verificar erros;
- confirmar autenticação;
- validar fluxo principal.

Rollback de aplicação não desfaz automaticamente migrations.

Para schema incompatível, preferir desenho expand/contract quando possível.

## 9. Deployment failure

Quando o provedor recusar ou falhar um deployment:

### Falha de build
Corrigir o artefato.

### Falha de configuração
Corrigir ambiente/configuração e repetir a validação.

### Rate limit / capacidade do provedor
Registrar como bloqueio externo. A falha atual observada de build-rate-limit não deve ser reinterpretada como falha de código.

### Deployment criado mas não pronto
Não promover nem declarar produção saudável até obter estado final e validação funcional.

## 10. Vercel como infraestrutura externa

O Vercel controla:

- execução do Next.js;
- deployments;
- aliases;
- regiões;
- build runtime;
- logs;
- rollback/promotion conforme disponibilidade da conta/projeto.

O repositório controla:

- código;
- workflow;
- testes;
- contratos;
- migrations versionadas;
- documentação.

A fronteira precisa permanecer explícita.

## 11. Supabase como dependência de runtime

A aplicação depende do Supabase para autenticação, persistência, RLS, dados do Workspace e recursos de Storage quando utilizados.

Deployment da aplicação sem verificar compatibilidade do backend não é suficiente para declarar a release pronta.

Mudanças de banco devem ser compatíveis com a versão da aplicação durante a janela de rollout.

## 12. Smoke tests

Após um deployment, executar pelo menos:

### Auth
- login;
- sessão;
- logout.

### Learning / Workspace
- abertura;
- leitura;
- edição;
- criação;
- ordenação.

### Sanctuary
- carregamento autenticado;
- estados vazio e erro;
- preservação de contexto.

### Integridade
- ausência de erros críticos;
- persistência correta;
- RLS funcionando.

## 13. Observabilidade pós-release

A janela pós-deploy deve observar:

- erros do runtime;
- erros de autenticação;
- falhas de persistência;
- aumento de latência;
- falhas de carregamento;
- erros de integração;
- sinais do Honeybadger;
- logs do provedor.

## 14. Estratégia de mudança

Para alterações pequenas e backward-compatible:

PR
 ↓
Quality Gates
 ↓
Merge
 ↓
Deployment
 ↓
Smoke
 ↓
Observe

Para alterações de alto risco:

PR
 ↓
Quality Gates
 ↓
Preview
 ↓
Compatibility Review
 ↓
Database / Config Preparation
 ↓
Deployment
 ↓
Smoke
 ↓
Observation Window
 ↓
Promotion / Hold / Rollback

## 15. Governança

Nenhuma alteração deve usar deployment para contornar:

- falha de teste;
- falha de segurança;
- RLS;
- incompatibilidade de migration;
- ausência de observabilidade;
- ausência de recovery path.

O provedor de deploy não deve se tornar autoridade de domínio.

## 16. Critérios de fechamento da F6.16

| Capacidade | Estado |
| --- | --- |
| Separação GitHub → CI → Vercel | VERIFICADO |
| Quality Gates antes de entrega | VERIFICADO |
| Deployment rastreável por commit | VERIFICADO |
| Production deployment observável | VERIFICADO |
| Promoção explicitamente definida | DOCUMENTADO / PENDENTE DE TESTE |
| Smoke test pós-deploy | DOCUMENTADO / PENDENTE DE TESTE |
| Rollback testado | PENDENTE |
| Compatibilidade de migrations no rollout | PENDENTE |
| Janela de observação pós-release | PENDENTE |
| Produção atualizada para os merges mais recentes | PENDENTE DE EVIDÊNCIA |

## 17. Critério de evidência

Uma release deve ser registrada como:

Commit
+ Quality Gate
+ Deployment ID
+ Environment
+ Smoke Test
+ Observation Result
= Release Evidence

Somente essa combinação deve ser usada para fechar uma entrega de produção.

## Conclusão

A Academia Arcana possui uma cadeia GitHub → GitHub Actions → Vercel funcional e auditável, mas a evidência operacional de uma release termina somente no deployment real e na validação pós-deploy.

O deployment de produção atualmente confirmado aponta para o merge do PR #259. Os merges seguintes precisam de nova evidência de deployment antes de serem considerados publicados em produção.

Esta F6.16 formaliza essa governança sem presumir que um commit em main seja automaticamente uma release em produção.