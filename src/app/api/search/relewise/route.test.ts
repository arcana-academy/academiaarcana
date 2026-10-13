import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  createSearcher: vi.fn(),
  createUser: vi.fn(),
  searchProducts: vi.fn(),
}));

vi.mock("@/lib/auth/get-authenticated-user-claims", () => ({
  getAuthenticatedUserClaims: mocks.getClaims,
}));

vi.mock("@/lib/relewise/server", () => ({
  createRelewiseSearcher: mocks.createSearcher,
  createRelewiseSearchUser: mocks.createUser,
}));

vi.mock("@relewise/client", () => ({
  ProductSearchBuilder: class {
    setTerm() { return this; }
    setSelectedProductProperties() { return this; }
    pagination(callback: (pagination: {
      setPage: (page: number) => void;
      setPageSize: (size: number) => void;
    }) => void) {
      callback({ setPage: vi.fn(), setPageSize: vi.fn() });
      return this;
    }
    build() { return { kind: "synthetic-product-search" }; }
  },
}));

import { GET } from "./route";

const request = (query = "q=grimorio") =>
  new Request("https://example.invalid/api/search/relewise?" + query);

describe("Relewise search route: safe failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClaims.mockResolvedValue({ sub: "synthetic-learner" });
    mocks.createSearcher.mockReturnValue({ searchProducts: mocks.searchProducts });
    mocks.createUser.mockReturnValue({ id: "synthetic-learner" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redacts upstream exception details from both HTTP 502 and application logs", async () => {
    const canary = "PRIVATE_UPSTREAM_ERROR_CANARY_NOT_FOR_LOGS";
    mocks.searchProducts.mockRejectedValue(
      new Error("External provider failed: " + canary),
    );
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ error: "Não foi possível realizar a busca agora." });
    expect(JSON.stringify(body)).not.toContain(canary);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(log).toHaveBeenCalledWith("Relewise product search failed");
    expect(JSON.stringify(log.mock.calls)).not.toContain(canary);
  });

  it("preserves authenticated search responses and their private no-store boundary", async () => {
    mocks.searchProducts.mockResolvedValue({ results: [], total: 0 });
    const response = await GET(request("q=alquimia&page=2&pageSize=10"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ results: [], total: 0 });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.createUser).toHaveBeenCalledWith("synthetic-learner");
    expect(mocks.searchProducts).toHaveBeenCalledOnce();
  });

  it("rejects anonymous requests without contacting the upstream searcher", async () => {
    mocks.getClaims.mockResolvedValue(null);
    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(mocks.createSearcher).not.toHaveBeenCalled();
    expect(mocks.searchProducts).not.toHaveBeenCalled();
  });

  it("rejects an empty query before any authentication or upstream call", async () => {
    const response = await GET(request("q=%20"));

    expect(response.status).toBe(400);
    expect(mocks.getClaims).not.toHaveBeenCalled();
    expect(mocks.searchProducts).not.toHaveBeenCalled();
  });
});
