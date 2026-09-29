# Parallel Search

A Academia Arcana uses Parallel Search as a server-side web research adapter for the Mestre Arcano.

## Scope

The integration currently exposes two capabilities to the Mestre Arcano:

- web search through Parallel Search;
- extraction of content from selected HTTP(S) URLs through Parallel Extract.

The provider is intentionally kept behind `src/infrastructure/parallel/parallel-search.ts`. Application and UI code should not call Parallel directly.

## Configuration

Set the server-side secret:

`PARALLEL_API_KEY`

Optional:

`PARALLEL_API_BASE_URL`

The default API origin is `https://api.parallel.ai`.

Never use a `NEXT_PUBLIC_*` variable for the Parallel API key.

## Data flow

Frontend → authenticated Mestre Arcano route → application intelligence → OpenAI tool call → Parallel infrastructure adapter → normalized sources → Mestre Arcano response.

The existing authenticated route remains the security boundary. Parallel credentials and outbound requests stay server-side.

## Source traceability

Search and extraction results retain:

- source URL;
- title when available;
- publication date when available;
- excerpts;
- extracted full content when requested by the provider.

The Mestre Arcano is instructed to identify externally researched sources in its response rather than presenting them as internally known facts.

## Limits

The adapter bounds:

- search queries to 3;
- search results to 8;
- extracted URLs to 5;
- URL length to 2,048 characters;
- provider request time to 12 seconds.

The adapter accepts only HTTP(S) URLs for extraction and does not expose provider response bodies on unexpected transport errors.

## Vercel

This integration does not configure or mutate Vercel. The secret must be added to the runtime environment only in the later deployment/configuration phase.
