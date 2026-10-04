# Relewise Search

## Runtime role

Relewise provides a server-side product/content search capability for the Academia Arcana Santuário search surface.

The integration uses the official `@relewise/client` TypeScript/JavaScript SDK. Search requests are created with `ProductSearchBuilder` and executed through `Searcher.searchProducts`.

## Configuration

The web runtime expects:

- `RELEWISE_DATASET_ID`
- `RELEWISE_API_KEY`
- `RELEWISE_SERVER_URL`

The API key is server-side only. It must never be exposed through a `NEXT_PUBLIC_*` variable or returned by the search route.

## Request boundary

The authenticated route `GET /api/search/relewise` accepts:

- `q`: required search term, maximum 120 characters;
- `language`: optional language, default `pt-BR`;
- `currency`: optional currency, default `BRL`;
- `page`: optional page number, minimum 1;
- `pageSize`: optional result count, bounded to 30.

The route associates the Relewise request with the authenticated Academia Arcana subject and returns private, non-cacheable responses.

## Failure behavior

Missing credentials, provider errors, and network failures do not expose provider secrets. The route returns a generic recoverable error to the browser while logging only the generic operation failure.

The Santuário search component remains optional and does not replace the core learning hierarchy or Supabase transactional state.

## Provider documentation

The implementation follows Relewise's official TypeScript/JavaScript SDK and product-search documentation.
