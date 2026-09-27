# First functional provider connection

The ChatGPT catalog is an inventory of plugin names supplied for Academia Arcana. It is not itself a transport or credential store.

The first verified external provider is **GitHub**. The website performs a server-side read-only request to the public GitHub REST API for `arcana-academy/academiaarcana`.

## Verification endpoint

`GET /api/integrations/github/verify`

A successful response reports:

- provider: `github`
- plugin: `GitHub`
- status: `connected`
- repository identity and visibility
- verification timestamp

The verifier sends no user token, OAuth secret, service token, or API key. It is intentionally read-only and targets only the Academia Arcana public repository; it is not a general-purpose GitHub proxy.

For additional providers, the same integration boundary must be backed by the provider's documented API, OAuth flow, or MCP transport. A catalog entry alone is never treated as a live connection.
