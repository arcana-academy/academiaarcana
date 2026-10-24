import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  invokeOpenSourceAi: vi.fn(),
}));

vi.mock("@/infrastructure/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/infrastructure/integrations/open-source-ai-gateway", () => ({
  invokeOpenSourceAi: mocks.invokeOpenSourceAi,
}));

import { POST } from "./route";

function jsonRequest(body: unknown) {
  return new Request("https://app.example/api/ia-aberta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  provider: "ollama",
  model: "llama3.2",
  messages: [{ role: "user", content: "Olá" }],
};

describe("POST /api/ia-aberta security contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  });

  it("requires an authenticated user before parsing or invoking a provider", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(401);
    expect(mocks.invokeOpenSourceAi).not.toHaveBeenCalled();
  });

  it("rejects invalid or over-budget generation inputs", async () => {
    const response = await POST(jsonRequest({ ...validBody, maxTokens: 100_000 }));

    expect(response.status).toBe(400);
    expect(mocks.invokeOpenSourceAi).not.toHaveBeenCalled();
  });

  it("returns a private non-cacheable result for valid requests", async () => {
    mocks.invokeOpenSourceAi.mockResolvedValue({
      provider: "ollama",
      model: "llama3.2",
      content: "Resposta de teste",
    });

    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      provider: "ollama",
      model: "llama3.2",
      content: "Resposta de teste",
    });
  });

  it("does not reflect upstream errors or secrets", async () => {
    mocks.invokeOpenSourceAi.mockRejectedValue(
      new Error("api-key=synthetic-secret provider trace"),
    );

    const response = await POST(jsonRequest(validBody));
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(JSON.stringify(payload)).not.toContain("synthetic-secret");
  });
});
