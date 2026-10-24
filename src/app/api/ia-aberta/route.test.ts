import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invokeOpenSourceAi: vi.fn(),
  consume: vi.fn(),
  getUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/infrastructure/integrations/open-source-ai-gateway", () => ({
  invokeOpenSourceAi: mocks.invokeOpenSourceAi,
}));

vi.mock("@/infrastructure/integrations/open-source-ai", () => ({
  openSourceAiIntegrations: [],
  getOpenSourceAiStatus: () => ({ configured: false }),
  // Only the provider id matters for the route decision.
  getOpenSourceAiIntegration: (id: string) =>
    id === "ollama"
      ? { id: "ollama", name: "Ollama", product: "Ollama", capabilities: [], runtime: "local" }
      : undefined,
}));

vi.mock("@/infrastructure/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

vi.mock(
  "@/infrastructure/supabase/security/api-rate-limit-repository",
  () => ({
    SupabaseApiRateLimitRepository: class {
      consume = mocks.consume;
    },
  }),
);

import { POST } from "./route";

const validBody = {
  provider: "ollama",
  model: "llama3",
  messages: [{ role: "user", content: "Explique o Círculo Dourado." }],
};

function post(body: unknown) {
  return new Request("https://example.test/api/ia-aberta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ia-aberta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: mocks.getUser },
    });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "97000000-0000-4000-8000-000000000001" } },
      error: null,
    });
    mocks.consume.mockResolvedValue({
      allowed: true,
      remaining: 9,
      retryAfterSeconds: 0,
    });
    mocks.invokeOpenSourceAi.mockResolvedValue({ text: "resposta" });
  });

  it("calls the gateway once the quota allows the request", async () => {
    const response = await POST(post(validBody));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ text: "resposta" });
    expect(mocks.consume).toHaveBeenCalledWith("open-source-ai");
    expect(mocks.invokeOpenSourceAi).toHaveBeenCalledTimes(1);
  });

  it("refuses with 429 and never spends the provider call when the quota is exhausted", async () => {
    mocks.consume.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 42,
    });

    const response = await POST(post(validBody));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.invokeOpenSourceAi).not.toHaveBeenCalled();
  });

  it("stays fail-closed with 503 when the limiter cannot answer", async () => {
    mocks.consume.mockRejectedValue(new Error("connection reset"));

    const response = await POST(post(validBody));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(503);
    expect(mocks.invokeOpenSourceAi).not.toHaveBeenCalled();
    expect(payload.error).not.toMatch(/connection reset|quota|bucket/i);
  });

  it("does not consume the quota for an unauthenticated caller", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await POST(post(validBody));

    expect(response.status).toBe(401);
    expect(mocks.consume).not.toHaveBeenCalled();
    expect(mocks.invokeOpenSourceAi).not.toHaveBeenCalled();
  });

  it("does not consume the quota for an unsupported provider", async () => {
    const response = await POST(post({ ...validBody, provider: "openai" }));

    expect(response.status).toBe(400);
    expect(mocks.consume).not.toHaveBeenCalled();
    expect(mocks.invokeOpenSourceAi).not.toHaveBeenCalled();
  });
});
