# Agentic Course Redesign

## Integration contract

Academia Arcana recognizes **Agentic Course Redesign** as a ChatGPT-hosted
learning-design integration.

The web application may expose its discovery metadata, but it must not claim
that the site can invoke the provider directly unless an official HTTP API,
SDK, or MCP endpoint is made available and authenticated.

### Current state

- Provider ID: `agentic-course-redesign`
- Execution mode: `chatgpt-hosted`
- Runtime API available to Academia Arcana: **No**
- Direct website invocation: **No**
- Catalog discovery: **Yes**
- Server credentials required by the current integration: **None**

### Intended responsibilities

The provider can conceptually support:

1. course redesign;
2. learning-design workflows;
3. assessment design;
4. learning-material design;
5. instructional research.

These capabilities are metadata only until a supported runtime transport is
available.

### Activation rule

If the provider later exposes an official API/SDK/MCP transport, implement it
behind the existing ExternalIntegrationGateway. Do not place provider
credentials in client components, NEXT_PUBLIC_* variables, or Supabase tables.

The integration status UI must continue to distinguish:

- **Verificado** — a real runtime connection was successfully verified;
- **Hospedado no ChatGPT** — the provider is available in ChatGPT but is not
  directly invocable by the Academia Arcana web runtime;
- **Catalogado** — the provider is known to the catalog without a verified
  runtime connection.
