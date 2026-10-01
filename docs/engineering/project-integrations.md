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
- Adobe Fonts web runtime: configuration-ready, activated only when a valid published kit identifier is supplied.
- Firefly/Photoshop/Illustrator/Express direct web-runtime adapter: not connected because no verified application-facing API/OAuth contract has been established for this repository.

A future direct Adobe provider belongs behind `src/infrastructure/integrations/adobe.ts` and requires provider health, authorization, representative-operation, security and E2E verification before it can be marked `connected`.

## ChatGPT catalog

The repository contains the 118 plugin names supplied for the project as a catalog. The runtime status surface also registers two server-side web-research providers (Parallel and Exa), so the integration-status endpoint exposes 120 entries in total. Catalog presence is deliberately different from a live provider connection.

The application exposes `/integracoes` and `GET /api/integrations/status` so the current state is inspectable at runtime:

- `catalogued`: the supplied plugin name exists in the catalog, but no live external connection has been verified.
- `connected`: a provider-specific runtime verification has succeeded.
- `error`: the provider-specific verification was attempted but failed.

The first implemented provider verification is GitHub. It is a public, read-only API verification of `arcana-academy/academiaarcana`; it does **not** represent a user's GitHub account OAuth authorization.

A provider may move from `catalogued` to a real authenticated integration only after its documented API/OAuth/MCP mechanism, scopes, credentials and server-side adapter have been implemented and verified.

### Mestre Arcano web research

Parallel and Exa are server-side runtime providers for external evidence used by the Mestre Arcano. Their credentials are runtime-only. The integration hub reports whether each provider is configured, while remaining explicit that configuration is not the same as a verified connection. Exa requests are bounded by a deterministic 12-second timeout; the web-research boundary normalizes provider-specific responses before they reach the agent.

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

## Ace Knowledge Graph

The Academia Arcana catalog includes **Ace Knowledge Graph**. The app is available as an authenticated ChatGPT-side capability and can render non-hierarchical knowledge graphs, but the current project runtime does not have a provider API, OAuth contract, or MCP endpoint verified for direct web-server invocation.

The website integration hub therefore keeps this provider in `catalogued` state. It is not marked `connected`, and the repository does not invent an app URL or hard-code an unverified endpoint. Promotion to `connected` requires a documented provider contract, a server-side adapter, authorization/scopes when applicable, health and representative-operation checks, automated failure/security tests, and deployed E2E verification.

Until those conditions are met, `catalogued` is the correct observable state rather than a simulated connection.

## 1 Billion Brain Cells

The Academia Arcana catalog includes **1 Billion Brain Cells** and the integration hub exposes its official ChatGPT app entry as an explicit external bridge.

The current public app listing identifies the app as a ChatGPT app by Spheric Admin Ltd and provides its official ChatGPT installation surface. The website does **not** claim that the ChatGPT app itself is a web-runtime dependency.

A public directory currently reports an MCP endpoint for the app, but its live verification is not healthy. Therefore the repository does not hard-code that endpoint or mark the provider as runtime-connected. A direct website integration requires a stable, documented provider contract that can be verified from the application runtime.

This gives the project a complete and honest state:

- ChatGPT app catalog entry: available.
- Official ChatGPT launch bridge: available.
- Academia Arcana web-runtime adapter: not enabled until an external provider contract is verified.
- Credentials: none required or stored for the bridge.

## Astrologic

The Academia Arcana catalog includes **Astrologic**, a ChatGPT-side astrology capability that exposes personalized natal charts, daily horoscopes, transit charts, and compatibility reports through its connector tools.

The current project runtime registers the provider identity in the integration boundary, but it does not mark Astrologic as a live web-runtime connection. The connector is callable from this assistant environment, while the website still requires a documented server-side API/OAuth/MCP transport before it can invoke those capabilities directly.

Current state:

- ChatGPT-side connector: available in the current assistant environment.
- Academia Arcana catalog entry: available.
- Web-runtime provider adapter: not yet verified.
- Public ChatGPT launch URL: not hard-coded without a verified official app URL.
- Runtime status: `catalogued`.

Supported capabilities exposed by the connector are birth/natal chart generation, personalized daily horoscope generation, current transit-chart generation, and compatibility reports. The website must preserve provider-specific authorization and must not copy connector credentials into browser code.

## Spotify

The Academia Arcana catalog includes **Spotify**. The integration hub now provides
an explicit bridge to Spotify's official ChatGPT app:

- ChatGPT app bridge: available.
- Official app: https://chatgpt.com/plugins/plugin_asdk_app_68de829bf7648191acd70a907364c67c
- Web-runtime Spotify Web API adapter: not connected.
- Credentials stored by Academia Arcana: none.
- Runtime status: `catalogued`.

The bridge is navigation-only. It does not import, proxy, or iframe the Spotify
ChatGPT app into the Next.js runtime. A future direct Spotify account
integration must implement the documented Spotify authorization flow,
server-side credential storage, least-privilege scopes, authorization checks,
provider health/representative-operation checks, failure isolation, and E2E
verification before the state can become `connected`.


## Tarteel

The Academia Arcana catalog includes **Tarteel**. The current ChatGPT-side connector provides Quran study capabilities such as ayah search, translations, tafsir, repeated-phrase exploration, recitation playback and prayer times.

The web application keeps Tarteel in **catalogued** state. The repository does not claim that the ChatGPT connector is a web-runtime dependency, and it does not invent a public app URL or provider API endpoint.

Current state:

- ChatGPT catalog entry: available.
- ChatGPT-side Tarteel capability: available in the connected assistant environment.
- Official ChatGPT launch bridge: not configured because no verified public launch URL is available to this repository.
- Web-runtime Tarteel adapter: not connected.
- Credentials stored by Academia Arcana: none.

A future direct integration belongs behind `src/infrastructure/integrations` and requires a documented provider contract, server-side authorization model, least-privilege credentials when applicable, provider health and representative-operation checks, failure isolation, security tests, and deployed E2E verification before becoming `connected`.

## Outlook Calendar

Outlook Calendar is the scheduling layer for the Cronograma. The web runtime uses Microsoft Graph through a server-side authorization-code OAuth flow with PKCE and requests only offline access plus the delegated Calendars.ReadWrite permission.

Credentials are stored encrypted in the application database and scoped to the authenticated Academia Arcana subject. The runtime can read the user's upcoming events, derive available study slots, create calendar events for scheduled StudyTask records, refresh access tokens and disconnect the account.

Supabase remains the product source of truth for StudyTask and learning state. Outlook is an external calendar projection and must remain optional: provider failures are isolated from the core Cronograma experience.

Production activation requires the Microsoft Entra client ID/secret, redirect URI and the server-side session encryption secret to be configured in the final environment.
## Airtable

Airtable is a server-side operations and content-management integration. The runtime uses a Personal Access Token and a configured base identifier; neither value is exposed through NEXT_PUBLIC_* variables or returned in integration status payloads.

Supported runtime operations currently include base-access verification, bounded record listing, and batched record creation. The implementation enforces a maximum of 10 records per create batch and preserves Supabase as the product's transactional source of truth.

The current integration does not create a browser-side Airtable client and does not claim OAuth account connection. Production activation requires the Airtable PAT and base ID to be configured in the final deployment environment.
## Trello

Trello is a runtime application integration for operational planning and project execution. The website uses Atlassian's documented OAuth 2.0 transport and keeps credentials server-side in an encrypted, HTTP-only cookie bound to the authenticated user.

Supported runtime operations include connection verification, board/list/card/checklist reads and writes, and search. The integration does not replace Supabase as the transactional source of truth for study progress.

The provider remains separate from the ChatGPT connector layer: the web runtime calls Trello's application API directly through the server-side adapter.

## OpenAI Agents — Mestre Arcano\n\nA Academia Arcana agora possui um adapter server-side para o OpenAI Responses API, usado como runtime do **Mestre Arcano**. O endpoint autenticado `POST /api/agent/mestre-arcano` executa o agente sem expor `OPENAI_API_KEY` ao navegador.\n\nA configuração usa:\n\n- `OPENAI_API_KEY` — segredo obrigatório, somente em ambiente server-side/Render.\n- `OPENAI_AGENT_MODEL` — opcional; o padrão do projeto é `gpt-5.6-sol`.\n\nA integração é marcada como `connected` no hub somente quando a chave existe e o modelo configurado passa por uma verificação real contra a OpenAI. Sem a chave, o estado é `not_configured`; falhas de autenticação/rede/modelo resultam em `error`.\n\nO agente segue uma regra de segurança de produto: não inventa progresso, notas, tarefas, dados pessoais ou estado de integrações. Dados do aluno deverão ser fornecidos posteriormente por ferramentas autorizadas do próprio domínio da Academia Arcana.\n\nO SDK oficial de Agents pode evoluir separadamente; o adapter atual usa a Responses API diretamente para manter o runtime sem dependência adicional e com superfície mínima. A documentação atual do Agents SDK descreve Agents como modelos equipados com instruções e ferramentas e suporta function tools, MCP, handoffs e tracing.\n\n## Notion

Notion is a runtime application integration for knowledge and documentation workflows. The web runtime keeps the OAuth credentials server-side and binds the encrypted credential payload to the authenticated Academia Arcana subject.

Supported runtime operations:

- connect and verify the authorized user;
- search authorized pages;
- create a child page under an authorized parent page;
- disconnect and revoke the access token.

The current adapter intentionally does not treat the ChatGPT connector as a web dependency. It uses Notion's documented public OAuth/API transport and keeps the provider separate from the product's transactional source of truth.

## Runtime / delivery integrations

| Service | Role | Repository integration | External configuration | State |
| --- | --- | --- | --- | --- |
| GitHub | Source control + CI + verified provider reachability | Repository, branches, pull requests, Actions workflow, read-only public verification endpoint | Repository visibility / permissions for project operations | Connected for public read-only verification; account OAuth not configured |
| Render | Hosting + deployment | Next.js deployment target | Project configuration, aliases, environment variables | Connected / external configuration pending |
| Supabase | Auth + PostgreSQL persistence | Browser/server clients, session refresh, repositories, RLS-backed schema | Project URL + publishable key; Auth settings | Connected |
| Adobe | Visual production + web typography | Adobe configuration boundary, asset contract, optional Fonts kit loader | `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID` when a published kit exists | Configuration-ready; direct creative API not connected |
| Honeybadger | Error monitoring | Next.js, browser, server and edge configuration; error boundaries | API key, assets URL, revision | Integrated / credentials external |
| Todoist | Study task planning and external productivity | Server-side OAuth 2.0/PKCE adapter, encrypted credential cookie, task/project reads, task creation and completion | Todoist OAuth Client ID, Client Secret and exact Redirect URI | Runtime adapter implemented; per-user connection configured when authorized |\n| Asana | Study task planning and external productivity | Server-side OAuth 2.0/PKCE adapter, encrypted credential cookie, project/task reads, task creation and completion | Asana Client ID, Client Secret and exact Redirect URI | Runtime adapter implemented; per-user connection configured when authorized |
| Trello | Operational workflow and project execution | Server-side OAuth 2.0/PKCE adapter, encrypted credential cookie, board/list/card/checklist/search operations | Trello OAuth 2.0 Client ID, Client Secret and exact Redirect URI | Runtime adapter implemented; per-user connection configured when authorized |
| Airtable | Operations and structured content management | Server-side PAT adapter, base verification, bounded record reads and batched record creation | Airtable Personal Access Token and Base ID | Runtime adapter implemented; external credentials remain deployment configuration |
| Microsoft SharePoint | External document knowledge source | Server-side OAuth 2.0 adapter, encrypted credentials, site/drive/search/context routes | Microsoft OAuth client credentials and exact Redirect URI | Runtime adapter implemented; per-user connection configured when authorized |
| Notion | Knowledge + documentation | Server-side OAuth 2.0 adapter, encrypted user-bound credentials, page search and child-page creation | Notion Client ID, Client Secret and exact Redirect URI | Runtime adapter implemented; per-user connection configured when authorized |
| Outlook Calendar | Scheduling for Cronograma | Server-side Microsoft Entra authorization-code + PKCE adapter, encrypted per-user credentials, event reads/availability/event creation | Microsoft Entra client ID, client secret, exact Redirect URI and session encryption secret | Runtime adapter implemented; per-user connection configured when authorized |

## Required production variables

Optional Adobe web typography:

- `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID`


The application requires the following public runtime variables in every environment, including Render Preview and Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

There is no hard-coded Supabase fallback. The build-time verification and runtime client configuration fail closed when either value is missing. Both values are validated as HTTPS Supabase configuration and a modern `sb_publishable_` publishable key.

Optional Honeybadger variables:

- `NEXT_PUBLIC_HONEYBADGER_API_KEY`
- `NEXT_PUBLIC_HONEYBADGER_ASSETS_URL`
- `NEXT_PUBLIC_HONEYBADGER_REVISION`

Honeybadger remains optional from the build perspective.

## Services deliberately kept outside the runtime

Canva, Figma, Dropbox, Slack, Render connector actions, Supabase connector actions, and other ChatGPT-side tools are not automatically imported into the web runtime. They become application integrations only through a provider-specific API/OAuth/MCP adapter.

This prevents accidental exposure of connector credentials, unnecessary client dependencies, and coupling between the web application and the assistant tool layer.

## Operational verification

The integration baseline is considered operational only when all of these are true:

1. GitHub Quality Gate is green for the exact commit being released.
2. Render has a READY deployment for that same commit.
3. The public production alias serves that deployment.
4. Supabase project state is healthy and the expected RLS policies are present.
5. Production environment variables are configured in Render.
6. Honeybadger is configured when production error monitoring is required.
7. Runtime smoke checks return the expected application behavior.
8. Every application-facing provider marked `connected` has a provider-specific runtime check and an E2E test.

## Security rules

- Never commit real Supabase keys, Honeybadger keys, database credentials, service-role keys, OAuth client secrets, or connector credentials.
- Browser code may use only the Supabase publishable key.
- Server and edge code must continue using the established SSR/session adapters.
- RLS remains mandatory for protected data.
- Public integration endpoints must expose only the minimum verification metadata required for observability.

## True Sky

The Academia Arcana catalog includes **True Sky**. True Sky provides astrology capabilities through the connected ChatGPT host, including natal-chart data, transits, personalized horoscopes, natal readings, synastry, composite charts, and solar/lunar returns.

The repository now exposes a vendor-neutral True Sky integration boundary in `src/infrastructure/integrations/true-sky.ts`. It defines the seven supported operations without importing provider SDKs or exposing credentials to the browser.

Current state:

- ChatGPT-side capability: available in the host.
- Web-runtime provider adapter: not connected.
- Credentials stored by Academia Arcana: none.
- Runtime status: `catalogued`.
- Direct production invocation: disabled until a documented, stable provider transport and authorization contract is verified.

Astrology results should be presented as interpretive content rather than as medical, legal, financial, or other high-stakes advice. Personalized birth data should only be collected when the user explicitly requests a personalized calculation and should follow minimum-necessary retention and server-side authorization.
