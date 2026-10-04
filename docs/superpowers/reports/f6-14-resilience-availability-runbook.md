# F6.14 — Runbook de resiliência e disponibilidade

**Base observada:** `main` no commit `2e2aa683f79f88333e8866e7dd82c236b5fd1e50`  
**Escopo:** definir como a Academia Arcana deve detectar, isolar, degradar, recuperar e validar falhas sem ampliar impacto nem expor informações sensíveis.

> Resiliência não significa esconder falhas. Significa permitir que uma falha seja detectada, contida, comunicada de forma segura e recuperada com evidência.

## 1. Capacidades já observadas

A aplicação já possui mecanismos de tratamento de erro em nível de aplicação e superfície de usuário.

Há evidência versionada de que o erro de aplicação:

- é reportado ao Honeybadger;
- não deve expor detalhes diagnósticos ao usuário;
- possui teste específico para esses comportamentos.

O Santuário também possui estados de carregamento e recuperação para falhas de rota.

Essas capacidades são **resiliência de aplicação**. Elas não comprovam, isoladamente, alta disponibilidade de infraestrutura.

## 2. Modelo operacional de falha

A resposta padrão deve seguir:

```text
Normal
  ↓
Failure
  ↓
Detect
  ↓
Classify
  ↓
Isolate
  ↓
Degrade safely
  ↓
Recover
  ↓
Validate
  ↓
Resume
```

### Detect

A falha deve produzir um sinal observável apropriado:

- erro capturado pelo monitoramento;
- status de workflow;
- erro de deployment;
- falha de integração;
- indisponibilidade de banco;
- falha de Storage;
- timeout ou erro de rede.

### Classify

Classificar antes de agir:

- **transiente** — pode desaparecer sem intervenção;
- **dependência externa** — provedor ou serviço terceiro;
- **dados** — corrupção, perda ou inconsistência;
- **aplicação** — bug ou regressão;
- **infraestrutura** — deployment, runtime, banco ou rede;
- **segurança** — exposição, autenticação ou autorização.

## 3. Estratégias de degradação

### Operações de leitura

Quando uma dependência não essencial falhar:

- preservar a navegação principal;
- substituir somente a área afetada por estado seguro;
- não fabricar dados como se fossem reais;
- permitir nova tentativa quando tecnicamente apropriado.

### Operações de escrita

Em falhas de persistência:

- não confirmar sucesso antes da confirmação do backend;
- informar que a operação falhou;
- preservar dados ainda não persistidos no cliente somente quando isso não criar risco de inconsistência;
- permitir nova tentativa;
- nunca realizar múltiplas mutações automaticamente sem garantia de idempotência.

### Autenticação

Se a identidade não puder ser validada:

- negar operações protegidas;
- evitar fallback que transforme uma falha de autenticação em acesso anônimo;
- não expor informações internas da sessão.

## 4. Idempotência e retries

Retries automáticos somente devem ser aplicados quando:

1. a operação é classificada como segura para repetição;
2. existe limite de tentativas;
3. existe backoff;
4. a aplicação consegue distinguir timeout de sucesso confirmado;
5. a repetição não pode gerar duplicação indevida.

Operações de criação não devem receber retry cego.

Um retry não deve ser utilizado para mascarar uma falha persistente.

## 5. Timeouts

Toda integração externa deve possuir um tempo máximo operacionalmente definido.

Quando o timeout for excedido:

- encerrar a espera;
- registrar o sinal operacional adequado;
- retornar estado seguro;
- evitar bloquear indefinidamente a requisição;
- preservar correlation/request context quando disponível.

Os valores numéricos dos timeouts ainda precisam ser definidos por integração. Não preencher números arbitrários nesta documentação.

## 6. Banco de dados

Para falhas do Supabase/Postgres:

### Leitura

- apresentar estado temporário de indisponibilidade;
- não inventar conteúdo;
- permitir retry controlado.

### Escrita

- tratar erro antes de atualizar o estado definitivo da interface;
- evitar afirmar que a alteração foi persistida;
- registrar erro com contexto não sensível.

### Recuperação

A recuperação do banco depende do procedimento definido em F6.13:

```text
Failure
  ↓
Backup / recovery path
  ↓
Restore
  ↓
Integrity validation
  ↓
Application smoke tests
  ↓
Resume
```

## 7. Storage

Falha no Storage deve ser isolada do restante da aplicação sempre que possível.

O sistema não deve:

- assumir que um objeto existe porque seu metadata existe;
- quebrar toda a página porque uma mídia não carregou;
- expor caminhos privados ou credenciais.

A restauração de Storage deve seguir o runbook de F6.13.

## 8. Deployments

Deployment deve possuir estados claramente distinguíveis:

- build iniciado;
- build concluído;
- deployment criado;
- deployment promovido;
- deployment pronto;
- deployment falhou;
- rollback executado.

O estado do GitHub `main` não equivale automaticamente ao estado de produção.

O deployment de produção deve ser confirmado no provedor antes de declarar uma release operacionalmente disponível.

Quando um deployment falhar:

1. identificar o commit afetado;
2. verificar se a versão anterior continua íntegra;
3. impedir promoção de build não validado;
4. usar rollback quando necessário;
5. registrar a causa e a recuperação.

## 9. Rollback

Rollback deve ser preferencialmente realizado para o último deployment conhecido como saudável.

Antes da retomada:

- confirmar integridade do deployment;
- confirmar conectividade com dependências;
- executar smoke tests;
- validar autenticação;
- validar leitura e escrita essenciais;
- observar erros pós-rollback.

Rollback de aplicação não desfaz automaticamente migrations de banco.

Migrations incompatíveis devem possuir estratégia própria de compatibilidade/forward-fix.

## 10. Health e disponibilidade

A plataforma precisa distinguir:

### Disponibilidade técnica

O serviço responde.

### Disponibilidade funcional

Os fluxos críticos conseguem executar.

### Integridade

Os dados continuam consistentes.

Não declarar um sistema disponível apenas porque uma URL responde HTTP.

Os fluxos mínimos a validar após incidente são:

- autenticação;
- abertura do Santuário;
- abertura do Workspace;
- leitura da hierarquia;
- criação/edição;
- ordenação de páginas;
- persistência;
- carregamento de recursos essenciais.

## 11. Incidente

Todo incidente relevante deve possuir:

- identificação;
- horário de início;
- impacto;
- escopo;
- hipótese/causa;
- ação de contenção;
- ação de recuperação;
- validação;
- horário de encerramento;
- follow-up preventivo.

Dados pessoais, tokens, connection strings e segredos nunca devem entrar no registro do incidente.

## 12. Objetivos de recuperação

Os valores de RTO/RPO continuam sendo definidos em F6.13.

Até que sejam aprovados e medidos:

| Capacidade | Estado |
| --- | --- |
| Fallback de erro da aplicação | **VERIFICADO** |
| Não exposição de detalhes diagnósticos ao usuário | **VERIFICADO** |
| Estados resilientes no Santuário | **VERIFICADO** |
| Isolamento de falhas por superfície | **PARCIAL / PENDENTE** |
| Retry seguro e padronizado | **PENDENTE** |
| Timeouts definidos por integração | **PENDENTE** |
| Health checks funcionais | **PENDENTE** |
| Alertas operacionais com responsável | **PENDENTE** |
| Rollback testado | **PENDENTE** |
| RTO/RPO medidos | **PENDENTE** |
| Teste completo de recuperação | **PENDENTE** |

## 13. Critério de fechamento da F6.14

A capacidade somente pode ser declarada operacionalmente pronta quando existir evidência de:

- falha injetada ou incidente real controlado;
- detecção;
- contenção;
- comportamento seguro da interface;
- recuperação;
- validação pós-recuperação;
- rollback testado quando aplicável;
- alertas acionáveis;
- responsáveis definidos;
- RTO/RPO medidos;
- evidência registrada.

A existência de componentes de error handling não é suficiente para declarar alta disponibilidade.

## 14. Segurança

Durante degradação e recuperação:

- negar por padrão o acesso não autorizado;
- não revelar stack traces;
- não revelar SQL, tokens ou connection strings;
- não ampliar permissões como workaround;
- não executar reparos irreversíveis automaticamente sem confirmação operacional adequada;
- manter auditoria dos eventos relevantes.

## Conclusão

A Academia Arcana já possui elementos de resiliência no nível da aplicação. A F6.14 organiza esses elementos em um contrato operacional e explicita o que ainda exige evidência de infraestrutura.

O estado correto para alta disponibilidade, rollback testado, health checks, alertas e RTO/RPO permanece **PENDENTE** até que exista validação operacional real.
