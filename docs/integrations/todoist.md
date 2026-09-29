# Todoist integration

## Current state

Academia Arcana contains a server-side Todoist OAuth adapter and an authenticated integration page at `/integracoes/todoist`.

The implementation uses Todoist's documented OAuth 2.0 authorization-code flow with the `data:read_write` scope. OAuth applications use a registered redirect URL and a Client ID/Client Secret. Newly created applications can issue refresh tokens; the integration refreshes expiring access tokens and stores the resulting credentials only in an encrypted, server-managed cookie. See the official [Todoist API documentation](https://developer.todoist.com/api/v1/).

## Runtime surface

- `GET /api/integrations/todoist/connect` — begins OAuth with state and PKCE protection.
- `GET /api/integrations/todoist/callback` — validates state/PKCE, exchanges the code and verifies the account.
- `GET /api/integrations/todoist/status` — returns the authenticated user's connection state and refreshes an expiring access token when a refresh token is available.
- `GET /api/integrations/todoist/tasks` — reads active tasks and projects.
- `POST /api/integrations/todoist/tasks` — creates an active task.
- `PATCH /api/integrations/todoist/tasks` — closes a Todoist task.
- `POST /api/integrations/todoist/disconnect` — revokes the remote access token when possible and removes the local credential cookie.

The API supports cursor-based pagination. The current UI intentionally exposes a small 50-item working set and keeps the page lightweight.

## Security

Todoist access and refresh tokens are encrypted with AES-GCM before being written to a Secure, HttpOnly, SameSite cookie. The encryption key is derived from the server-side Todoist client secret. Plaintext bearer credentials are never returned to client JavaScript, API response bodies, logs, or the public integration status.

The OAuth state and PKCE verifier are stored in short-lived HttpOnly cookies. The callback rejects missing, mismatched or incomplete state.

No Todoist credential is persisted in Supabase. The v1 implementation is browser-scoped, so another browser or device may require a new authorization.

## Required environment

- `TODOIST_CLIENT_ID`
- `TODOIST_CLIENT_SECRET`
- `TODOIST_REDIRECT_URI`

For local development, `TODOIST_REDIRECT_URI` may target the local callback URL registered in Todoist. In production, use the exact HTTPS redirect URI registered in Todoist App Management.

## Product behavior

The integration complements, rather than replaces, Academia Arcana's Planning domain:

`Academia Arcana Planning` → `Todoist`

The Academy remains the source of truth for learning progress, missions, XP, streaks, achievements and study content. Todoist acts as the external productivity layer for tasks and scheduling.

The integration page provides connection state, task creation, task completion, a task list, direct navigation to Todoist, and reconnect/disconnect flows.

## Deliberate boundary

The repository does not claim that the ChatGPT Todoist connector is itself the web-runtime API. The website uses Todoist's documented web API behind a server-side adapter and authenticated user flow.

Automatic bidirectional reconciliation between Academy `StudyTask` records and Todoist task IDs is deliberately not enabled yet. A future synchronization layer should introduce durable per-user mappings, idempotency keys and explicit conflict rules before claiming full two-way synchronization.

Vercel deployment and production environment configuration remain intentionally outside this change.
