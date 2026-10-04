# Tarot integration

## Current state

Academia Arcana exposes a verified navigation bridge from the web integration hub to the official **Tarot** app in ChatGPT.

- ChatGPT catalog entry: **Tarot**.
- Official ChatGPT app URL: https://chatgpt.com/plugins/plugin_asdk_app_6943a2c078b0819188de39e4fe168d9b
- Web integration hub: `/integracoes`.
- Status: `catalogued` with a `chatgptAppUrl` bridge.
- Credentials stored by Academia Arcana: none.

The official listing identifies Tarot as a ChatGPT app for tarot reading and divination. The website bridge is navigation-only; it does not claim that the ChatGPT app is a server-side dependency of the Academia Arcana runtime.

## User experience

The integration hub renders **Abrir no ChatGPT** for Tarot. The link opens the official Tarot app page in a new tab, where the user can connect and use the app through ChatGPT.

## Why it is not marked connected

A true web-runtime Tarot integration would require a documented provider API, MCP transport, or OAuth contract that Academia Arcana is authorized to invoke from its server runtime. No such web-runtime contract has been verified for this integration.

Therefore the project deliberately keeps Tarot in `catalogued` state rather than simulating a runtime connection.

## Security and product rules

- No Tarot credentials are stored in the repository.
- No provider token is exposed to browser code.
- The ChatGPT app URL is treated as an explicit external bridge only.
- The application must not scrape, iframe, proxy, or reverse-engineer the ChatGPT app.
- If a documented Tarot API/MCP contract becomes available, it must be implemented behind `src/infrastructure/integrations`, with least-privilege authorization, provider health checks, representative-operation tests, failure isolation, security tests, and deployed E2E verification before changing the runtime status to `connected`.

## Scope of readings

Tarot features are presented as reflective/entertainment content. They should not be represented as medical, legal, financial, safety, or other high-stakes professional advice.
