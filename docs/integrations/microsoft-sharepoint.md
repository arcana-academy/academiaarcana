# Microsoft SharePoint / OneDrive integration

The Academia Arcana integration layer treats Microsoft SharePoint/OneDrive as a read-oriented external document source.

## Responsibilities

- discover and search documents;
- read file metadata;
- enumerate folder contents;
- inspect file versions;
- provide controlled document context for Grimórios, Academia, Missões and the Mestre Arcano.

Supabase remains the source of truth for application state, authorization and learning data.

## Runtime configuration

The server-side adapter expects:

`MICROSOFT_GRAPH_ACCESS_TOKEN`

This token must be provided by a secure OAuth flow in the runtime environment. It must never be exposed through `NEXT_PUBLIC_*` variables or committed to Git.

The ChatGPT connector authorization does not automatically become a credential for the deployed Academia Arcana application.

## Security boundary

The initial adapter is intentionally read-only. Write, delete, anonymous sharing and permission mutation are not enabled by the application contract.

Before enabling production OAuth, the application must bind the Microsoft identity to the authenticated Academia Arcana user and enforce the application's authorization policy before fetching external documents.
