import { beforeEach, describe, expect, it, vi } from "vitest";

const { searchParallelWeb, searchWebWithExa, extractParallelWeb } = vi.hoisted(() => ({
  searchParallelWeb: vi.fn(),
  searchWebWithExa: vi.fn(),
  extractParallelWeb: vi.fn(),
}));

vi.mock("@/infrastructure/parallel/parallel-search", () => ({
  searchParallelWeb,
  extractParallelWeb,
}));
vi.mock("@/infrastructure/exa/search", () => ({ searchWebWithExa }));

import {
  extractWebResearch,
  resolveWebResearchProvider,
  searchWebResearch,
} from "./search";

describe("web research router", () => {
  beforeEach(() => {
    delete process.env.MESTRE_ARCANO_WEB_RESEARCH_PROVIDER;
    delete process.env.PARALLEL_API_KEY;
    delete process.env.EXA_API_KEY;
    searchParallelWeb.mockReset();
    searchWebWithExa.mockReset();
    extractParallelWeb.mockReset();
  });

  it("selects the only configured provider", () => {
    process.env.PARALLEL_API_KEY = "parallel-key";
    expect(resolveWebResearchProvider()).toBe("parallel");
    delete process.env.PARALLEL_API_KEY;
    process.env.EXA_API_KEY = "exa-key";
    expect(resolveWebResearchProvider()).toBe("exa");
  });

  it("requires explicit provider selection when both are configured", () => {
    process.env.PARALLEL_API_KEY = "parallel-key";
    process.env.EXA_API_KEY = "exa-key";
    expect(() => resolveWebResearchProvider()).toThrow("Both web research providers are configured");
  });

  it("routes search through Parallel", async () => {
    process.env.PARALLEL_API_KEY = "parallel-key";
    searchParallelWeb.mockResolvedValue({
      sources: [{
        url: "https://example.test/a",
        title: "Fonte",
        publishDate: "2026-09-29",
        excerpts: ["Trecho"],
      }],
      sessionId: "session-1",
    });

    await expect(searchWebResearch({ objective: "Estudar", query: "anatomia" }))
      .resolves.toMatchObject({
        provider: "parallel",
        sources: [{ provider: "parallel", url: "https://example.test/a" }],
        sessionId: "session-1",
      });
  });

  it("routes search through Exa", async () => {
    process.env.EXA_API_KEY = "exa-key";
    searchWebWithExa.mockResolvedValue([{
      title: "Fonte",
      url: "https://example.test/a",
      publishedDate: "2026-09-29",
      author: "Autor",
      highlights: ["Trecho"],
    }]);

    await expect(searchWebResearch({ objective: "Estudar", query: "anatomia", numResults: 3 }))
      .resolves.toMatchObject({
        provider: "exa",
        sources: [{ provider: "exa", url: "https://example.test/a", author: "Autor" }],
        sessionId: null,
      });
  });

  it("keeps extraction bound to Parallel", async () => {
    process.env.PARALLEL_API_KEY = "parallel-key";
    extractParallelWeb.mockResolvedValue({
      sources: [{
        url: "https://example.test/a",
        title: "Documento",
        publishDate: null,
        excerpts: [],
        fullContent: "Conteúdo",
      }],
      errors: [],
      sessionId: "session-2",
    });
    await expect(extractWebResearch({ urls: ["https://example.test/a"], objective: "Resumo" }))
      .resolves.toMatchObject({ provider: "parallel", sources: [{ fullContent: "Conteúdo" }] });

    delete process.env.PARALLEL_API_KEY;
    process.env.EXA_API_KEY = "exa-key";
    await expect(extractWebResearch({ urls: ["https://example.test/a"] }))
      .rejects.toThrow("Web extraction requires the Parallel web research provider.");
  });
});
