# Spotify integration

## Current state

Academia Arcana now exposes a verified navigation bridge from the web integration hub to the official Spotify app in ChatGPT.

- ChatGPT catalog entry: **Spotify**.
- Official ChatGPT app URL: https://chatgpt.com/plugins/plugin_asdk_app_68de829bf7648191acd70a907364c67c
- Web integration hub: `/integracoes`.
- Status: `catalogued` with a `chatgptAppUrl` bridge.
- Credentials stored by Academia Arcana: none.

The bridge intentionally does not claim that the Spotify ChatGPT app is a server-side dependency of the Academia Arcana runtime.

## User experience

The integration hub renders **Abrir no ChatGPT** for Spotify. The link opens the official Spotify app page in a new tab, where the user can connect Spotify to ChatGPT and use Spotify's supported conversational features.

## Why it is not marked `connected`

A true web-runtime Spotify account integration requires a provider-specific Spotify Web API adapter and user authorization. Spotify documents OAuth 2.0 authorization, including Authorization Code and Authorization Code with PKCE. For a server-hosted web application, Authorization Code is the documented choice when a client secret can be stored securely; PKCE is appropriate when a client secret cannot be kept safe.

Academia Arcana currently has no Spotify client credentials, no per-user token store for Spotify, and no deployed Spotify API adapter. It therefore keeps the provider in `catalogued` state rather than simulating a runtime connection.

## Future web-runtime adapter

A future direct Spotify integration should remain behind `src/infrastructure/integrations` and follow the existing provider boundary.

Minimum requirements before changing the state to `connected`:

1. Register the Academia Arcana application in Spotify for Developers.
2. Configure exact HTTPS redirect URIs for production and approved loopback development URIs.
3. Implement user authorization with least-privilege scopes.
4. Keep access/refresh credentials server-side and bind them to the authenticated Academia Arcana subject.
5. Validate token issuer, audience, expiry and scopes before protected calls.
6. Add provider health, representative operation, failure-isolation, authorization and E2E tests.
7. Configure the required production environment variables without committing secrets.

Spotify currently limits newly created apps in Development Mode to a small allowlist of authenticated users and requires the app owner to have Premium; wider access depends on Spotify's quota/partner rules. This is an external provider constraint, not a defect in the Academia Arcana integration layer.