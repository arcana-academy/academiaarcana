# Dropbox runtime integration

## Purpose

Dropbox is a complementary document-storage provider for Academia Arcana. Supabase remains the source of truth for structured application data, authorization, learning progress and metadata.

Runtime boundary:

`UI -> application use case -> integration gateway -> Dropbox adapter -> Dropbox API`

The browser never receives the Dropbox credential.

## Current capabilities

- account verification;
- folder listing;
- file search;
- file metadata operations;
- a server-side boundary ready for the Grimório material-import flow.

The Dropbox API exposes file listing and search through API v2 and uses cursors for paginated results.

## Security

The adapter reads a server-only runtime credential named `DROPBOX_RUNTIME_TOKEN`. It must never be exposed through a `NEXT_PUBLIC_*` variable or persisted as plaintext in a public Supabase table.

The first implementation intentionally uses least-privilege read scopes. A future multi-user version should use Dropbox OAuth 2.0 with server-side credential storage and per-user authorization.

## Activation

Without the runtime credential, the integration remains `catalogued`; the application does not simulate a successful connection.

When the credential is configured, the integration status verifies the account through Dropbox before reporting `connected`.

## Grimório roadmap

1. browse/search Dropbox materials;
2. select a file;
3. download through the server adapter;
4. extract supported document content;
5. create or update a Grimório/Capítulo/Página through the existing authenticated workspace actions;
6. persist only the required source metadata and ownership relation in Supabase.

Bidirectional synchronization and webhooks are deliberately out of scope until the import path is validated end-to-end.

## Official references

- https://www.dropbox.com/developers/documentation/http/documentation
- https://www.dropbox.com/developers/reference/migration-guide
