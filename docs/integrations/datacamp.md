# DataCamp integration

Academia Arcana integrates DataCamp through DataCamp's documented Catalog API boundary.

## Runtime contract

- Provider: **DataCamp**
- Provider ID: `datacamp`
- Authentication: server-side API key
- Base URL: `https://lms-catalog-api.datacamp.com`
- Health check: `GET /v1/catalog/live-courses`
- Browser access to the API key: prohibited
- Runtime state: `connected` only after the health check succeeds

DataCamp documents this API as read-only and supports catalog content such as courses, projects, assessments, practices, tracks and custom tracks. It also exposes learner events such as completions and course-started events for the group associated with the API key.

## Environment variables

Configure these only in the server/runtime environment:

```text
DATACAMP_API_KEY=<secret supplied by DataCamp>
DATACAMP_CATALOG_API_BASE_URL=https://lms-catalog-api.datacamp.com
```

`DATACAMP_CATALOG_API_BASE_URL` is optional and defaults to the official DataCamp catalog API host. It exists to support controlled testing and future provider endpoint changes without changing application code.

## Security

- Never commit `DATACAMP_API_KEY`.
- Never prefix the variable with `NEXT_PUBLIC_`.
- Never send the API key to browser components.
- Never expose the Authorization header in status responses, logs, telemetry, or client errors.
- Keep DataCamp operations behind the existing integration boundary.

## Product behavior

The integration hub uses the existing distinction between catalog presence and verified runtime connectivity. Without a valid server-side key, DataCamp remains **Catalogado** instead of being presented as a fake connection. With a valid key and successful catalog verification, it becomes **Verificado**.

The repository does not embed DataCamp credentials or claim that the ChatGPT-side DataCamp connector is automatically callable by the website.
