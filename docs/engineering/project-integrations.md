# Academia Arcana — Project Integrations

## Integration boundary

Only services that are part of the application's runtime or delivery path belong in the repository integration contract. ChatGPT connectors and development assistants are not runtime dependencies and must not be embedded as secrets or opaque client-side integrations.

## Runtime / delivery integrations

| Service | Role | Repository integration | External configuration | State |
| --- | --- | --- | --- | --- |
| GitHub | Source control + CI | Repository, branches, pull requests, Actions workflow | Repository permissions / branch rules | Connected |
| Vercel | Hosting + deployment | Next.js deployment target | Project configuration, aliases, environment variables | Connected / external configuration pending |
| Supabase | Auth + PostgreSQL persistence | Browser/server clients, session refresh, repositories, RLS-backed schema | Project URL + publishable key; Auth settings | Connected |
| Honeybadger | Error monitoring | Next.js, browser, server and edge configuration; error boundaries | API key, assets URL, revision | Integrated / credentials external |

## Required production variables

The application requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Production builds now fail early when either is missing. Vercel production also rejects a non-HTTPS/non-Supabase URL or a key that is not a modern `sb_publishable_` key.

Optional Honeybadger variables:

- `NEXT_PUBLIC_HONEYBADGER_API_KEY`
- `NEXT_PUBLIC_HONEYBADGER_ASSETS_URL`
- `NEXT_PUBLIC_HONEYBADGER_REVISION`

Honeybadger remains optional from the build perspective.

## Services deliberately kept outside the runtime

Canva, Figma, Notion, Dropbox, Slack, GitHub connector actions, Vercel connector actions, Supabase connector actions, and other ChatGPT-side tools are operational/development integrations. They should be used to work on the project, not bundled into the public application unless a separate product requirement explicitly defines an application-facing API integration.

This prevents accidental exposure of connector credentials, unnecessary client dependencies, and coupling between the web application and the assistant tool layer.

## Operational verification

The integration baseline is considered operational only when all of these are true:

1. GitHub Quality Gate is green for the exact commit being released.
2. Vercel has a READY deployment for that same commit.
3. The public production alias serves that deployment.
4. Supabase project state is healthy and the expected RLS policies are present.
5. Production environment variables are configured in Vercel.
6. Honeybadger is configured when production error monitoring is required.
7. Runtime smoke checks return the expected application behavior.

## Current observations

- The current Vercel project is `academiaarcana`.
- The current Supabase project is healthy and exposes the project's publishable key through the provider configuration.
- Historical Vercel runtime errors include missing Supabase public environment variables; the repository now fails earlier during production build rather than waiting for a request-time failure.
- The public Vercel alias has previously served an older deployment than the current `main` deployment. This must be resolved in Vercel before treating the delivery path as fully reconciled.
- Web Analytics and Speed Insights are not currently wired into the application. Activating them should be a separate, explicit change because it adds telemetry and requires provider-side enablement.

## Security rules

- Never commit real Supabase keys, Honeybadger keys, database credentials, service-role keys, OAuth client secrets, or connector credentials.
- Browser code may use only the Supabase publishable key.
- Server and edge code must continue using the established SSR/session adapters.
- RLS remains mandatory for protected data.
