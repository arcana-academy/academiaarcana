# Academia Arcana — External Integration Strategy

## Decision

The ChatGPT Plugins directory is a discovery and connection surface for
ChatGPT and Codex. A plugin listed at https://chatgpt.com/plugins is not a
package that can be installed into the Academia Arcana Next.js bundle.

Academia Arcana therefore does not import, proxy, iframe, or blindly bundle
every directory plugin.

The site uses a vendor-neutral integration boundary in
src/infrastructure/integrations. Provider adapters are added independently,
with credentials and authorization kept on the server.

## Two supported directions

### Academia Arcana consuming an external service

Each provider follows:

UI -> application use case -> authorization -> integration gateway ->
provider adapter -> external API

The UI never receives provider secrets or service credentials.

User-account integrations should use OAuth 2.1 authorization-code flow with
PKCE where the provider supports it. Access tokens must be checked for issuer,
audience, expiry and granted scopes before every protected tool or action.
Refresh tokens and other long-lived credentials remain server-side.

### Academia Arcana exposed to ChatGPT

When the product is ready to be controlled from ChatGPT, expose a dedicated MCP
server for Academia Arcana's own authorized capabilities. Do not attempt to
turn the complete ChatGPT plugin directory into a dependency of the site.

For authenticated MCP tools, follow the MCP authorization contract and use
OAuth 2.1. Tool metadata must declare its security scheme and every request
must be authorized against the user's scopes.

## Integration policy

1. Least privilege: request only the scopes and capabilities required.
2. Explicit consent: linking an account and granting write access must be
   visible and intentional.
3. Server-side secrets only: API keys, service tokens and refresh tokens must
   never ship to the browser.
4. Per-tool authorization: a connected account does not imply universal
   permission to every provider operation.
5. Auditability: sensitive writes must be attributable to the authenticated
   subject and provider.
6. Failure isolation: an unavailable provider must not break core learning.
7. No speculative integrations: connection status is only "connected" after
   credentials, scopes, health check and a representative operation succeed.
8. No catalog scraping: the public ChatGPT directory is dynamic and is not a
   runtime API or source of truth for application behavior.
9. No provider lock-in: domain and application contracts must not import vendor
   SDKs.
10. No service-role bypass: Supabase service credentials are never a substitute
    for per-user authorization.

## Current implementation state

The repository already contains the intelligence domain's tool-authorization
boundary and the data domain's infrastructure boundary. The integration
contracts preserve that direction instead of introducing another business
domain.

The contracts in src/infrastructure/integrations/contracts.ts are a foundation
only. They intentionally do not claim that any external provider is connected.
A provider becomes production-ready only after its adapter and environment
configuration exist and the integration's functional, authorization,
accessibility and end-to-end tests pass.

## First-wave provider candidates

The first wave should be limited to services that materially support Academia
Arcana operations or product workflows, such as GitHub, Vercel, Supabase,
Notion, Slack, Google Drive/Calendar, Outlook, Dropbox, Canva, Figma, Stripe
and Firecrawl.

This list is not an exhaustive copy of the ChatGPT plugin directory.
Additional providers can be added through the same contract without changing
the domain model.

## Quality gate for every provider

A provider adapter is not complete until:

- authentication/linking works in the target environment;
- only documented scopes are requested and accepted;
- expired or revoked credentials fail closed;
- unauthorized tools and actions are rejected;
- no credential reaches client bundles or logs;
- timeout and provider-outage behavior is bounded and non-fatal;
- representative read/write cases, when supported, pass;
- adapter and authorization-boundary tests pass;
- production has the required environment configuration;
- the integration can be disabled without breaking core product functionality.

## Consequence

The product can support a large and evolving set of external services without
coupling education domains to third-party SDKs. The integration layer grows by
adding adapters instead of modifying domain rules or importing the entire
ChatGPT plugin catalog.
