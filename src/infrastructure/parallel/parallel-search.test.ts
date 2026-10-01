import { describe, expect, it, vi } from "vitest";

import {
  extractParallelWeb,
  searchParallelWeb,
  type ParallelSearchFetch,
} from "./parallel-search";

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("parallel search infrastructure", () => {
  it("sends search requests with the server-side API key and maps sources", async () => {
    process.env.PARALLEL_API_KEY = "test-key";

    const fetchImpl = vi.fn<ParallelSearchFetch>(() =>
      Promise.resolve(
        mockResponse({
          results: [
            {
              url: "https://example.com/article",
              title: "Example",
              publish_date: "2026-09-29",
              excerpts: ["Relevant excerpt"],
            },
          ],
          session_id: "session-1",
        }),
      ),
    );

    const result = await searchParallelWeb({
      objective: "Encontrar material educacional atual",
      searchQueries: ["material educacional"],
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.parallel.ai/v1/search",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-api-key": "test-key",
        }),
      }),
    );
    expect(result.sources[0]).toEqual({
      url: "https://example.com/article",
      title: "Example",
      publishDate: "2026-09-29",
      excerpts: ["Relevant excerpt"],
    });
  });

  it("rejects non-http URLs before calling the provider", async () => {
    process.env.PARALLEL_API_KEY = "test-key";
    const fetchImpl = vi.fn<ParallelSearchFetch>();

    await expect(
      extractParallelWeb({
        urls: ["ftp://example.com/unsupported"],
        fetchImpl,
      }),
    ).rejects.toThrow("Apenas URLs HTTP(S) são permitidas.");

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("maps extraction errors without exposing provider response bodies", async () => {
    process.env.PARALLEL_API_KEY = "test-key";

    const fetchImpl = vi.fn<ParallelSearchFetch>(() =>
      Promise.resolve(
        mockResponse({
          results: [
            {
              url: "https://example.com/document.pdf",
              title: "Document",
              excerpts: ["Excerpt"],
              full_content: "# Document",
            },
          ],
          errors: [
            {
              url: "https://example.com/private",
              error_type: "fetch_error",
              http_status_code: 403,
            },
          ],
        }),
      ),
    );

    const result = await extractParallelWeb({
      urls: ["https://example.com/document.pdf"],
      fetchImpl,
    });

    expect(result.sources[0].fullContent).toBe("# Document");
    expect(result.errors).toEqual([
      {
        url: "https://example.com/private",
        type: "fetch_error",
        status: 403,
      },
    ]);
  });

  it("fails closed when the API key is missing", async () => {
    delete process.env.PARALLEL_API_KEY;

    await expect(
      searchParallelWeb({
        objective: "Teste",
        searchQueries: ["teste"],
        fetchImpl: vi.fn<ParallelSearchFetch>(),
      }),
    ).rejects.toThrow("Parallel Search integration is not configured.");
  });
});
