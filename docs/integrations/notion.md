# Notion integration

## Current state

Academia Arcana now contains a server-side Notion OAuth adapter and an authenticated integration page at `/integracoes/notion`.

The integration uses Notion's public connection OAuth flow. The website requests a user-authorized connection, stores the resulting credentials in an encrypted HTTP-only cookie bound to the authenticated Academia Arcana subject, and keeps provider credentials out of browser JavaScript.

## Supported web-runtime operations

- Connect and verify the user's Notion authorization.
- Search pages shared with the connection.
- Select an authorized page as a parent.
- Create a child page with an initial title and optional paragraph.
- Disconnect and revoke the current access token.

Search is intentionally limited to pages in this first adapter. Database-specific writing, block editing, file uploads and broader content traversal should only be added behind explicit provider contracts and focused tests.

## Security boundary

- Notion credentials are server-side only.
- OAuth state is stored in a short-lived HTTP-only cookie and checked at callback time.
- Credentials are encrypted with AES-GCM before being stored.
- The encrypted credential payload is bound to the authenticated Academia Arcana subject.
- Search and write responses expose only normalized page metadata to the UI.
- The provider remains an external knowledge/documentation layer; Supabase remains the product source of truth.

## Environment

Required server-side variables:

- `NOTION_CLIENT_ID`
- `NOTION_CLIENT_SECRET`
- `NOTION_REDIRECT_URI`

`NOTION_REDIRECT_URI` must exactly match the redirect URI configured in the Notion integration settings.

## API version

The adapter sends `Notion-Version: 2026-03-11` to the Notion API.

## Runtime states

- `disconnected`: the user has not authorized Notion for the current Academia Arcana account.
- `connected`: the current access token has been successfully verified with Notion.
- `reauthorization_required`: Notion rejected the token and the stored refresh flow could not restore the connection.
