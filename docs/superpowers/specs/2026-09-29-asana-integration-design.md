# Academia Arcana — Asana Integration Design

## Context

A Academia Arcana já possui um domínio de planejamento com `StudyTask`, um hub de integrações em `/integracoes`, contratos vendor-neutral em `src/infrastructure/integrations/contracts.ts` e uma integração funcional com Todoist. Asana será adicionada como uma integração de produtividade complementar, sem substituir Supabase como fonte de verdade do produto nem transformar o conector Asana do ChatGPT em dependência do runtime web.

## Goal

Adicionar uma integração Asana opcional, autenticada por usuário, que permita conectar uma conta Asana, verificar a conexão, listar projetos e tarefas, criar tarefas derivadas do planejamento da Academia Arcana e concluir tarefas externas, mantendo toda credencial no servidor e deixando a sincronização bidirecional durável para uma etapa posterior.

## Product boundary

Academia Arcana continua sendo a fonte de verdade para:

- identidade e sessão;
- conteúdo educacional;
- progresso;
- missões;
- XP, streaks e conquistas;
- `StudyTask` e estado educacional.

Asana será uma camada externa para:

- projetos de produtividade;
- tarefas;
- prazos;
- execução externa;
- colaboração disponível no serviço.

O fluxo inicial é intencionalmente unidirecional a partir da Academia Arcana para criação/fechamento de tarefas e leitura operacional. Não haverá espelhamento automático de todos os `StudyTask` nem sincronização bidirecional nesta primeira implementação.

## Authentication

Usar o OAuth 2.0 Authorization Code Grant documentado pela Asana.

Endpoints do provedor:

- Authorization: `https://app.asana.com/-/oauth_authorize`
- Token exchange/refresh: `https://app.asana.com/-/oauth_token`
- Revoke: `https://app.asana.com/-/oauth_revoke`
- API base: `https://app.asana.com/api/1.0`

Aplicar:

- state criptograficamente aleatório e associado à sessão;
- PKCE S256;
- redirect URI explícita;
- client secret somente server-side;
- access token e refresh token nunca retornados ao navegador;
- tratamento explícito de autorização expirada/revogada.

Asana access tokens expiram e devem ser renovados por refresh token quando disponível.

## Minimum scope

Solicitar apenas os escopos necessários para a experiência inicial:

- `openid`
- `profile`
- `email`
- `tasks:read`
- `tasks:write`
- `projects:read`
- `projects:write`

O código deve tratar os escopos como configuração explícita e não assumir que outros recursos da API são permitidos.

## Runtime architecture

Flow:

`UI -> authenticated application action/route -> integration gateway -> Asana adapter -> Asana REST API`

The adapter lives in `src/infrastructure/integrations/asana.ts` and exports:

- provider metadata;
- authorization URL construction;
- state/verifier/challenge helpers;
- token exchange;
- refresh;
- revoke;
- connection verification;
- project listing;
- task listing/search;
- task creation;
- task completion.

No Asana SDK is required for the first implementation; use the documented REST API behind the existing provider boundary to minimize dependency and bundle surface.

## Integration routes

Create authenticated server routes following the established Todoist pattern:

- `GET /api/integrations/asana/connect`
- `GET /api/integrations/asana/callback`
- `GET /api/integrations/asana/status`
- `GET /api/integrations/asana/projects`
- `GET /api/integrations/asana/tasks`
- `POST /api/integrations/asana/tasks`
- `PATCH /api/integrations/asana/tasks`
- `POST /api/integrations/asana/disconnect`

The API surface must expose sanitized provider metadata only. Tokens, client secrets and raw Authorization headers must never appear in responses, logs, telemetry or client code.

## Credential storage

Follow the existing server-managed credential pattern used by Todoist.

For the first implementation, store encrypted OAuth credentials in a Secure, HttpOnly, SameSite cookie scoped to the application integration.

Credentials must contain:

- subject/user identifier;
- access token;
- refresh token when supplied;
- access-token expiry when supplied.

Use authenticated-session binding and reject credentials whose subject does not match the current user.

No Asana credential is persisted in public Supabase tables in v1.

## Planning integration

Add an explicit product action from the planning surface:

`StudyTask -> Create in Asana`

Input:

- title;
- optional description;
- optional due datetime;
- optional selected Asana project;
- optional priority mapped through a documented product rule.

The Academia Arcana UI should make clear that this creates an external task and does not move the source of truth out of the Academy.

Completion flow:

`StudyTask completion -> optional Asana task close`

This action must be explicit in the first version rather than implicit bulk synchronization.

## UI

Add:

- `/integracoes/asana` authenticated management page;
- Asana connection card in `/integracoes`;
- Asana action in `/configuracoes`;
- planning control to create an Asana task from a `StudyTask`;
- connection states: not configured, connected, reauthorization required, error;
- non-blocking empty/error/loading states;
- accessible keyboard/focus behavior;
- copy explaining that Asana complements, but does not replace, Academy planning data.

The page should follow the established Academia Arcana visual system rather than exposing raw provider UI.

## Error handling

Normalize provider failures into the integration boundary.

Expected classes:

- missing configuration;
- invalid/expired authorization;
- insufficient scope;
- rate limit;
- network/provider outage;
- malformed provider response;
- invalid user input.

For reauthorization-required failures, clear or quarantine the stale credential and direct the user to reconnect. Do not silently retry indefinitely.

## Security

- Never use `NEXT_PUBLIC_*` for Asana credentials.
- Never log access tokens, refresh tokens, client secrets, authorization codes or PKCE verifiers.
- Validate OAuth state against the initiating session.
- Bind external credentials to the authenticated Academia Arcana user.
- Validate and sanitize user-provided task fields.
- Keep provider operations server-side.
- Return the minimum fields needed by the UI.
- Preserve existing RLS boundaries for all Academy-owned data.
- Do not introduce a generic Asana proxy endpoint.

## Testing

Unit tests:

- authorization URL contains exact required parameters;
- state/PKCE generation is non-empty and unpredictable;
- malformed credentials are rejected;
- expired access tokens are refreshed when refresh token exists;
- revoked/unauthorized provider responses map to reauthorization-required;
- task payloads are normalized and validated;
- tokens are absent from serialized results.

Integration tests:

- connect -> callback -> status flow with provider calls mocked;
- list projects/tasks;
- create task;
- close task;
- disconnect/revoke.

E2E:

- Asana integration page renders;
- unauthenticated access redirects/blocks according to existing auth policy;
- status endpoint reports catalogued/not_configured without secrets;
- connected fixture renders a connected state;
- planning page exposes the explicit Asana task action without breaking native `StudyTask` completion.

Quality gates:

`npm run lint`
`npm run typecheck`
`npm test`
`npm run test:a11y`
`npm run build`
`npm run test:e2e`

## Documentation

Create:

- `docs/integrations/asana.md`
- update `docs/engineering/project-integrations.md`
- update the integration hub documentation/catalog only with verified states.

The documentation must distinguish the Asana web API integration from the Asana ChatGPT connector.

## Environment

Define only server-side variables required by the OAuth app:

- `ASANA_CLIENT_ID`
- `ASANA_CLIENT_SECRET`
- `ASANA_REDIRECT_URI`

No production/Render environment mutation is part of this change.

## Deliberate non-goals

Not included in v1:

- automatic two-way synchronization of all `StudyTask` records;
- durable StudyTask <-> Asana task mapping in Supabase;
- webhooks;
- background reconciliation jobs;
- Asana custom-field mirroring;
- portfolio/goal synchronization;
- direct embedding of Asana's web UI;
- dependence on the ChatGPT Asana connector from the website runtime;
- Render deployment or production configuration.

## Acceptance criteria

The integration work is ready to move to the final validation stage when:

1. the adapter and routes are implemented behind the existing integration boundary;
2. OAuth state and PKCE are verified;
3. no credential reaches browser code, logs, telemetry or public responses;
4. connection, project/task read, task creation, completion and disconnect flows are tested;
5. the planning action creates an external task without changing Academy source-of-truth semantics;
6. the integration hub reports an honest state;
7. lint, typecheck, unit, accessibility, build and E2E checks pass for the exact commit;
8. documentation matches the real runtime behavior;
9. Render is the only intentionally remaining deployment/infrastructure step.
