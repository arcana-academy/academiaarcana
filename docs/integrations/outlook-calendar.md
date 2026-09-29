# Outlook Calendar — Academia Arcana

## Runtime integration

The Academia Arcana Cronograma integrates a user's Outlook Calendar through
Microsoft Graph. The provider is isolated behind the vendor-neutral integration
boundary in `src/infrastructure/integrations`.

The browser never receives Microsoft access or refresh tokens.

## Permissions

The integration requests only:

- `offline_access`
- `Calendars.ReadWrite`

Microsoft Graph documents `Calendars.ReadWrite` as the delegated permission
for creating events in a user's calendar.

## Authentication and security

The connection uses Microsoft Entra's authorization-code flow with PKCE. The persistent token record is owned by the authenticated Academia Arcana user and protected by Supabase RLS.

- OAuth state and the PKCE verifier are short-lived HttpOnly cookies.
- Access and refresh tokens are encrypted with AES-256-GCM before being stored in
  the per-user Supabase `integration_credentials` record.
- The Microsoft client secret and encryption secret are server-side only.
- Protected routes require an authenticated Academia Arcana user.
- Refresh failures clear the local connection and require explicit reconnection.
- Outlook is optional; provider failures do not make the core Cronograma
  unavailable.

## Environment

Required server-side variables:

```text
MICROSOFT_ENTRA_CLIENT_ID=
MICROSOFT_ENTRA_CLIENT_SECRET=
MICROSOFT_ENTRA_REDIRECT_URI=https://<application-origin>/api/integrations/outlook/callback
OUTLOOK_CALENDAR_SESSION_SECRET=
```

The exact redirect URI must also be registered in Microsoft Entra.

## Cronograma behavior

A connected user sees Outlook status in the Cronograma. A task with a scheduled
time can be sent to Outlook as a 50-minute study event with a 15-minute
reminder.

The provider adapter also exposes calendar listing, event listing and
availability primitives so the Mestre Arcano can later use real calendar
windows for adaptive planning without changing the Planning domain.

## Completion criteria

The provider is not considered fully production-validated until the target
environment confirms:

1. OAuth consent and callback.
2. Access-token refresh.
3. Calendar read.
4. Event creation.
5. Unauthorized/failure-safe behavior.
6. Unit, accessibility and E2E coverage.
7. Required external configuration.

No Vercel production action is part of this integration change.
