import { describe, expect, it, vi } from "vitest";

import { searchWebWithExa } from "./search";

describe("searchWebWithExa", () => {
  it("keeps the Exa API key server-side and normalizes search evidence", async () => {
    process.env.EXA_API_KEY = "test-key";
    const fetchImpl = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toEqual({
        "Content-Type": "application/json",
        "x-api-key": "test-key",
      });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return Promise.resolve(new Response(JSON.stringify({
        results: [{
          title: "Fonte de estudo",
          url: "https://example.com/study",
          publishedDate: "2026-09-29",
          author: "Autor",
          highlights: ["Trecho relevante"],
        }],
      }), { status: 200 }));
    });

    await expect(searchWebWithExa({ query: "fotossíntese", numResults: 3 }, { fetchImpl }))
      .resolves.toEqual([{
        title: "Fonte de estudo",
        url: "https://example.com/study",
        publishedDate: "2026-09-29",
        author: "Autor",
        highlights: ["Trecho relevante"],
      }]);
  });

  it("rejects empty queries", () => {
    process.env.EXA_API_KEY = "test-key";
    expect(() => searchWebWithExa({ query: "  " })).toThrow("consulta");
  });
});