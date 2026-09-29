# Microsoft SharePoint / OneDrive integration

The Academia Arcana integration layer treats Microsoft SharePoint/OneDrive as a read-oriented external document source.

## Responsibilities

- discover and search documents;
- read file metadata;
- enumerate folder contents;
- discover accessible SharePoint sites and document libraries;
- inspect file versions;
- refresh expiring OAuth access tokens automatically when a refresh token is available;
- provide controlled document context for Grimórios, Academia, Missões and the Mestre Arcano.

Supabase remains the source of truth for application state, authorization and learning data.

## Runtime configuration

The application now uses OAuth 2.0 Authorization Code + PKCE. Configure the server-side values:

- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_REDIRECT_URI`

Access and refresh tokens are encrypted before being stored in the HTTP-only integration cookie. No Microsoft secret or access token is exposed through `NEXT_PUBLIC_*` variables or committed to Git.

The ChatGPT connector authorization does not automatically become a credential for the deployed Academia Arcana application.

## Security boundary

The initial adapter is intentionally read-only. Write, delete, anonymous sharing and permission mutation are not enabled by the application contract.

Before enabling production OAuth, the application must bind the Microsoft identity to the authenticated Academia Arcana user and enforce the application's authorization policy before fetching external documents.
