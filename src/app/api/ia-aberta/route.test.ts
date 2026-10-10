import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockInvoke } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockInvoke: vi.fn(),
}));

vi.mock("@/infrastructure/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/infrastructure/integrations/open-source-ai-gateway", () => ({
  invokeOpenSourceAi: mockInvoke,
}));

vi.mock("@/infrastructure/integrations/open-source-ai", () => ({
  getOpenSourceAiIntegration: (provider: string) =>
    provider === "ollama" ? { id: "ollama" } : undefined,
  getOpenSourceAiStatus: vi.fn(),
  openSourceAiIntegrations: [],
}));

import { POST } from "./route";

const validPayload = {
  provider: "ollama",
  model: "synthetic-model",
  messages: [{ role: "user", content: "Olá" }],
};

function createRequest() {
  return new Request("https://example.invalid/api/ia-aberta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validPayload),
  });
}

describe("POST /api/ia-aberta — upstream exception redaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "synthetic-account" } },
      error: null,
    });
  });

  it("never reflects arbitrary upstream error text or secrets to the client", async () => {
    const upstreamDiagnostic =
      "Open Source AI gateway error (502): secret=synthetic-sensitive-credential";
    mockInvoke.mockRejectedValueOnce(new Error(upstreamDiagnostic));

    const response = await POST(createRequest());
    const responseText = await response.text();

    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(JSON.parse(responseText)).toEqual({
      error: "Não foi possível processar a solicitação de IA.",
    });
    expect(responseText).not.toContain("synthetic-sensitive-credential");
    expect(responseText).not.toContain("Open Source AI gateway error");
  });

  it("retains the success response contract", async () => {
    const result = {
      provider: "ollama",
      model: "synthetic-model",
      content: "Resposta sintética.",
    };
    mockInvoke.mockResolvedValueOnce(result);
    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(result);
  });

  it("does not invoke the provider without an authenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    const response = await POST(createRequest());
    expect(response.status).toBe(401);
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
