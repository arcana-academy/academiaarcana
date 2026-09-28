# Academia Arcana — Project Integrations

## Integration boundary

Only services that are part of the application's runtime or delivery path belong in the repository integration contract. ChatGPT connectors and development assistants are not runtime dependencies and must not be embedded as secrets or opaque client-side integrations.

## ChatGPT catalog

The repository contains the 114 plugin names supplied for the project as a catalog. Catalog presence is deliberately different from a live provider connection.

The application exposes `/integracoes` and `GET /api/integrations/status` so the current state is inspectable at runtime:

- `catalogued`: the supplied plugin name exists in the catalog, but no live external connection has been verified.
- `connected`: a provider-specific runtime verification has succeeded.
- `error`: the provider-specific verification was attempted but failed.

The first implemented provider verification is GitHub. It is a public, read-only API verification of `arcana-academy/academiaarcana`; it does **not** represent a user's GitHub account OAuth authorization.

A provider may move from `catalogued` to a real authenticated integration only after its documented API/OAuth/MCP mechanism, scopes, credentials and server-side adapter have been implemented and verified.

## A-Z Daily Word

The Academia Arcana catalog includes **A-Z Daily Word**. Its current ChatGPT app listing provides an official ChatGPT launch surface, which the integration hub exposes as an explicit bridge.

The bridge is intentionally navigation-only. It does **not** claim that the A-Z Daily Word ChatGPT app is callable by the Academia Arcana web runtime. The website must not invent or scrape a provider API, proxy the ChatGPT app, or store credentials that the provider has not documented for this application.

Current state:

- ChatGPT catalog entry: available.
- Official ChatGPT launch bridge: available.
- Web-runtime provider adapter: not connected.
- Credentials stored by Academia Arcana: none.
- Runtime status: `catalogued`, not `connected`.

If the provider later exposes a documented, stable API or MCP contract that the Academia Arcana runtime is authorized to consume, that contract can be implemented behind `src/infrastructure/integrations` and promoted to `connected` only after health, authorization, representative-operation and E2E verification pass.

## 1 Billion Brain Cells

The Academia Arcana catalog includes **1 Billion Brain Cells** and the integration hub exposes its official ChatGPT app entry as an explicit external bridge.

The current public app listing identifies the app as a ChatGPT app by Spheric Admin Ltd and provides its official ChatGPT installation surface. The website does **not** claim that the ChatGPT app itself is a web-runtime dependency.

A public directory currently reports an MCP endpoint for the app, but its live verification is not healthy. Therefore the repository does not hard-code that endpoint or mark the provider as runtime-connected. A direct website integration requires a stable, documented provider contract that can be verified from the application runtime.

This gives the project a complete and honest state:

- ChatGPT app catalog entry: available.
- Official ChatGPT launch bridge: available.
- Academia Arcana web-runtime adapter: not enabled until an external provider contract is verified.
- Credentials: none required or stored for the bridge.

## Runtime / delivery integrations

| Service | Role | Repository integration | External configuration | State |
| --- | --- | --- | --- | --- |
| GitHub | Source control + CI + verified provider reachability | Repository, branches, pull requests, Actions workflow, read-only public verification endpoint | Repository visibility / permissions for project operations | Connected for public read-only verification; account OAuth not configured |
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

Canva, Figma, Notion, Dropbox, Slack, Vercel connector actions, Supabase connector actions, and other ChatGPT-side tools are not automatically imported into the web runtime. They become application integrations only through a provider-specific API/OAuth/MCP adapter.

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
8. Every application-facing provider marked `connected` has a provider-specific runtime check and an E2E test.

## Security rules

- Never commit real Supabase keys, Honeybadger keys, database credentials, service-role keys, OAuth client secrets, or connector credentials.
- Browser code may use only the Supabase publishable key.
- Server and edge code must continue using the established SSR/session adapters.
- RLS remains mandatory for protected data.
- Public integration endpoints must expose only the minimum verification metadata required for observability.
