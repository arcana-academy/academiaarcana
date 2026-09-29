# Todoist integration

## Current state

Academia Arcana now contains a server-side Todoist OAuth adapter and an authenticated integration page at `/integracoes/todoist`.

The implementation uses Todoist's documented OAuth 2.0 authorization-code flow with PKCE and the `data:read_write` scope. Todoist's current API documentation defines `task:add`, `data:read`, and `data:read_write` permissions, and requires OAuth for authenticating users of an external application. citeturn896304search0

## Runtime surface

- `GET /api/integrations/todoist/connect` — begins OAuth.
- `GET /api/integrations/todoist/callback` — validates state/PKCE, exchanges the code and verifies the account.
- `GET /api/integrations/todoist/status` — returns the authenticated user's connection state.
- `GET /api/integrations/todoist/tasks` — reads active tasks and projects.
- `POST /api/integrations/todoist/tasks` — creates an active task.
- `POST /api/integrations/todoist/disconnect` — revokes and removes the local authorization cookie.

The adapter uses Todoist API v1 endpoints. The task endpoints support creating, reading, updating and closing tasks, and Todoist documents cursor-based pagination with a maximum page size of 200. The integration intentionally keeps the first application surface small and uses a 50-item view. citeturn207600search0turn405257search0

## Security

The access token is stored only in a Secure, HttpOnly, SameSite cookie for the authenticated browser session. It is never returned to client JavaScript, logs or API response bodies.

The OAuth state and PKCE verifier are stored in short-lived HttpOnly cookies. The callback rejects missing, mismatched or incomplete state.

No Todoist credential is persisted in Supabase. This avoids adding a plaintext credential table to the public database while the application is still operating with a browser-scoped integration.

## Required environment

- `TODOIST_CLIENT_ID`
- `TODOIST_CLIENT_SECRET`
- `TODOIST_REDIRECT_URI`

For local development, `NEXT_PUBLIC_APP_URL` can provide the redirect base. In production, configure an exact HTTPS redirect URI in Todoist's App Management Console and expose the same value to the runtime.

Todoist's official documentation states that OAuth applications must register valid redirect URLs and receive a Client ID and Client Secret. citeturn896304search0

## Product behavior

The integration complements, rather than replaces, Academia Arcana's Planning domain:

`Academia Arcana Planning` → `Todoist`

The Academy remains the source of truth for learning progress, missions, XP, streaks, achievements and study content. Todoist acts as an external productivity layer for tasks and scheduling.

## Current limitations

- The repository does not claim that the ChatGPT Todoist connector is itself the web-runtime API.
- The browser-scoped token means a user may need to reconnect on another browser/device.
- Automatic bidirectional reconciliation between `StudyTask` records and Todoist task IDs is not enabled yet; task export/import should only be added with a durable mapping and idempotency model.
- Vercel deployment/configuration remains intentionally outside this change.
