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


## User flow

The authenticated integration workspace is available at `/integracoes/microsoft-sharepoint` and follows this sequence:

1. Verify the current Microsoft connection.
2. Discover accessible SharePoint sites.
3. Select a site and discover its document libraries.
4. Search within the selected library.
5. Resolve a selected document into a sanitized external-source descriptor.
6. Persist the selected source for the authenticated user.
7. Open the original document in Microsoft 365 when desired.
8. The Mestre Arcano can discover active connected sources and retrieve supported text content on demand.

The browser receives only the sanitized source descriptor. Microsoft access tokens remain server-side. Selected sources are persisted in `public.external_document_sources` under the authenticated user, protected by RLS ownership policies.

## Content context boundary

Selecting **Usar como fonte** persists the external document descriptor for the authenticated user. The application can then retrieve the current file contents on demand for the Mestre Arcano through Microsoft Graph.

The current ingestion boundary is intentionally conservative:

- supported content is UTF-8 text only: `.txt`, `.md`, `.markdown`, `.csv`, `.tsv`, `.json` and `.xml`, plus their supported text MIME types;
- the server refuses files larger than 1 MiB before context delivery;
- the model receives at most 50,000 normalized characters per request and is told to treat external document content as untrusted data, never as system instructions;
- source ownership is re-checked against the authenticated Academy user before retrieval;
- the application does not copy the file body into Supabase; it keeps the persisted source descriptor and retrieves the current document on demand;
- the content endpoint never returns Microsoft access or refresh tokens.

PDF, DOCX, XLSX, PPTX and other binary/Office formats remain outside this text-only context adapter until a dedicated parser/conversion path is added and tested.
