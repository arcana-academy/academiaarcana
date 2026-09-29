# Academia Arcana — Project Integrations

## Integration boundary

Only services that are part of the application's runtime or delivery path belong in the repository integration contract. ChatGPT connectors and development assistants are not runtime dependencies and must not be embedded as secrets or opaque client-side integrations.

## Adobe Creative Layer

Adobe is the project's visual-production layer for brand assets, illustrations, vector artwork, typography, educational documents, PDFs and promotional media.

The repository now exposes a vendor-neutral Adobe configuration boundary:

- optional public configuration: `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID`;
- when configured, the root layout loads the published Adobe Fonts stylesheet from `use.typekit.net`;
- no Adobe OAuth token, Creative Cloud credential or connector credential is stored in Git or browser state;
- approved web assets have a documented `public/assets/` structure;
- the Adobe ChatGPT connector is not falsely represented as a web-runtime API.

Runtime state:

- Adobe creative tooling: available in the connected assistant environment.
- Adobe Fonts web runtime: **configuration-ready**, activated only when a valid published kit identifier is supplied.
- Firefly/Photoshop/Illustrator/Express direct web-runtime adapter: **not connected** because no verified application-facing API/OAuth contract has been established for this repository.

A future direct Adobe provider belongs behind `src/infrastructure/integrations/adobe.ts` and requires provider health, authorization, representative-operation, security and E2E verification before it can be marked `connected`.

## ChatGPT catalog

The repository contains the 115 plugin names supplied for the project as a catalog. Catalog presence is deliberately different from a live provider connection.

The application exposes `/integracoes` and `GET /api/integrations/status` so the current state is inspectable at runtime:

- `catalogued`: the supplied plugin name exists in the catalog, but no live external connection has been verified.
- `connected`: a provider-specific runtime verification has succeeded.
- `error`: the provider-specific verification was attempted but failed.

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

## Runtime / delivery integrations

| Service | Role | Repository integration | External configuration | State |
| --- | --- | --- | --- | --- |
| GitHub | Source control + CI + verified provider reachability | Repository, branches, pull requests, Actions workflow, read-only public verification endpoint | Repository visibility / permissions for project operations | Connected for public read-only verification; account OAuth not configured |
| Vercel | Hosting + deployment | Next.js deployment target | Project configuration, aliases, environment variables | Connected / external configuration pending |
| Supabase | Auth + PostgreSQL persistence | Browser/server clients, session refresh, repositories, RLS-backed schema | Project URL + publishable key; Auth settings | Connected |
| Adobe | Visual production + web typography | Adobe configuration boundary, asset contract, optional Fonts kit loader | `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID` when a published kit exists | Configuration-ready; direct creative API not connected |
| Honeybadger | Error monitoring | Next.js, browser, server and edge configuration; error boundaries | API key, assets URL, revision | Integrated / credentials external |
| Todoist | Study task planning and external productivity | Server-side OAuth 2.0/PKCE adapter, encrypted credential cookie, task/project reads, task creation and completion | Todoist OAuth Client ID, Client Secret and exact Redirect URI | Runtime adapter implemented; per-user connection configured when authorized |
| Microsoft SharePoint | External document knowledge source | Server-side OAuth 2.0 adapter, encrypted credentials, site/drive/search/context routes | Microsoft OAuth client credentials and exact Redirect URI | Runtime adapter implemented; per-user connection configured when authorized |
| Notion | Knowledge + documentation | Server-side OAuth 2.0 adapter, encrypted user-bound credentials, page search and child-page creation | Notion Client ID, Client Secret and exact Redirect URI | Runtime adapter implemented; per-user connection configured when authorized |

## Required production variables

The application requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Optional Adobe web typography:

- `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID`

Optional Honeybadger variables:

- `NEXT_PUBLIC_HONEYBADGER_API_KEY`
- `NEXT_PUBLIC_HONEYBADGER_ASSETS_URL`
- `NEXT_PUBLIC_HONEYBADGER_REVISION`

No Adobe secret is required by the web runtime for the Fonts kit loader.

## Services deliberately kept outside the runtime

Canva, Figma, Dropbox, Slack, Vercel connector actions, Supabase connector actions, and other ChatGPT-side tools are not automatically imported into the web runtime. They become application integrations only through a provider-specific API/OAuth/MCP adapter.

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
9. If Adobe Fonts is enabled, the published kit identifier is valid and the stylesheet loads under the production CSP.

## Security rules

- Never commit real Supabase keys, Honeybadger keys, database credentials, service-role keys, OAuth client secrets, or connector credentials.
- Browser code may use only public configuration intended for the browser, including an Adobe Fonts kit identifier.
- Server and edge code must continue using the established SSR/session adapters.
- RLS remains mandatory for protected data.
- Public integration endpoints must expose only the minimum verification metadata required for observability.
