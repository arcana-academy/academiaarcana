# Academic Writing Toolkit

## Integration status

The Academic Writing Toolkit is catalogued by Academia Arcana and its MCP
capabilities have been verified in the ChatGPT host.

The web application does **not** claim a direct runtime connection because the
connected tool currently exposes no public HTTP API, SDK, or repository-side
credential contract that the Next.js application can invoke.

## Supported operations

- `audit_citations`
- `check_british_english`
- `review_paragraph_logic`
- `verify_bibtex_references`
- `create_reading_note_template`

## Architecture

```
Academia Arcana application
        |
        v
academic-writing-toolkit.ts
        |
        v
ExternalIntegrationGateway
        |
        +---- host-provided MCP bridge (when available)
        |
        +---- future first-party HTTP/SDK adapter (if exposed)
```

No MCP or ChatGPT credentials are stored in the browser, Supabase, or Vercel
environment by this integration.

## Important boundary

A catalogue entry is not equivalent to a runtime connection. The integration
hub therefore continues to report this provider as **Catalogado** until an
actual web-runtime gateway can execute the provider operations and verify that
connection from the deployed application.
