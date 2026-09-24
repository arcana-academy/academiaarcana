# Academia Arcana — Fase 2: Auditoria de Segurança

**Status:** hardening aplicado; validação final em CI/Preview pendente.
**Escopo:** auditoria de segurança sem novas funcionalidades.

## Correções aplicadas

### 1. Privilégios PostgreSQL excessivos

As tabelas públicas `grimoires`, `notebooks`, `chapters` e `pages` tinham RLS e políticas de ownership, mas o papel `authenticated` também possuía `TRUNCATE`, `TRIGGER` e `REFERENCES`.

Foi aplicada a migração `20260921174822_revoke_excess_authenticated_table_privileges`, removendo somente esses três privilégios. Os privilégios CRUD permaneceram:

- SELECT
- INSERT
- UPDATE
- DELETE

Nenhuma policy, linha de dados ou regra de ownership foi alterada.

### 2. Headers HTTP de segurança

Adicionados no Next.js, para todas as rotas:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

CSP não foi adicionada nesta fase para evitar introduzir uma política restritiva sem validação específica dos fluxos OAuth, Supabase e Honeybadger.

## Validações de banco

- RLS habilitado nas quatro tabelas públicas auditadas.
- Policies de SELECT/INSERT/UPDATE/DELETE permanecem restritas ao proprietário autenticado.
- Policies de UPDATE possuem `USING` e `WITH CHECK`.
- Não existem views materializadas ou views comuns no schema `public` segundo a inspeção realizada.
- Security Advisor do Supabase: nenhum lint.
- Após a correção, `authenticated` possui somente CRUD nas quatro tabelas; `anon` não recebeu privilégios nessas tabelas.

## Autenticação e autorização

- Rotas/ações protegidas utilizam `requireAuthenticatedUser()`.
- O callback OAuth valida o parâmetro `next` para impedir redirecionamento para outra origem.
- Não foi encontrado uso de `SUPABASE_SERVICE_ROLE_KEY` no código auditado.
- A chave publicável do Supabase é tratada como credencial apropriada para cliente; nenhum segredo de serviço foi identificado no código.

## CI/CD

- GitHub Actions mantém `permissions: contents: read`.
- `actions/checkout` usa `persist-credentials: false`.
- Actions de checkout/setup-node estão fixadas por SHA.
- E2E no CI usa valores Supabase de teste isolados, sem segredo de produção.
- Pull request de auditoria: #275, mantido em draft; nenhum merge automático foi realizado.

## Achados não tratados como vulnerabilidades confirmadas

### Validação de entrada em Server Actions

As Server Actions verificam autenticação e fazem validações básicas de título, enquanto a autorização de acesso aos dados é reforçada por RLS. Os tipos TypeScript não são uma fronteira de segurança em runtime, portanto validação de schema em runtime continua sendo um hardening possível. Não foi introduzida uma nova biblioteca apenas para isso nesta fase porque não há evidência de bypass de autorização decorrente dessa lacuna.

### CSP

A ausência de CSP foi tratada como hardening pendente, não como exploração confirmada. Uma CSP exige inventário e teste dos recursos legítimos, especialmente OAuth/Supabase e telemetria.

### Vercel Environment Variables

A integração disponível não expôs uma operação segura para inventariar todos os valores/escopos das variáveis de ambiente do projeto. Portanto, a auditoria não declara esse item como verificado integralmente. Nenhum valor secreto foi exposto durante a auditoria.

## Resultado até o checkpoint

A vulnerabilidade estrutural de excesso de privilégios foi corrigida sem alteração das policies. O hardening HTTP foi aplicado de forma conservadora. O fechamento definitivo da Fase 2 depende da conclusão dos checks do Pull Request e do Preview da Vercel.

## Referência técnica

A orientação atual do Supabase recomenda RLS em tabelas expostas e grants mínimos para cada papel. A configuração aplicada segue esse princípio, mantendo CRUD para `authenticated` e removendo privilégios administrativos/desnecessários.
