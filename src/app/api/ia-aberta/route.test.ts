import { describe, expect, it, vi } from "vitest";

const { mockCreateSupabaseServerClient, mockInvokeOpenSourceAi } = vi.hoisted(
  () => ({
    mockCreateSupabaseServerClient: vi.fn(),
    mockInvokeOpenSourceAi: vi.fn(),
  }),
);

vi.mock("@/infrastructure/supabase/server", () => ({
  createSupabaseServerClient: mockCreateSupabaseServerClient,
}));

vi.mock(
  "@/infrastructure/integrations/open-source-ai-gateway",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("@/infrastructure/integrations/open-source-ai-gateway")
      >();

    return {
      ...actual,
      invokeOpenSourceAi: mockInvokeOpenSourceAi,
    };
  },
);

import { POST } from "./route";

describe("open source AI route secret boundary", () => {
  it("does not serialize upstream error details to the client", async () => {
    const sensitiveMarker = "qa-upstream-sensitive-marker";

    mockCreateSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "qa-user" } },
          error: null,
        }),
      },
    });

    mockInvokeOpenSourceAi.mockRejectedValue(
      new Error(`provider diagnostic: ${sensitiveMarker}`),
    );

    const response = await POST(
      new Request("https://academiaarcana.example/api/ia-aberta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "ollama",
          model: "qa-model",
          messages: [{ role: "user", content: "Olá" }],
        }),
      }),
    );

    expect(response.status).toBe(502);
    const body = await response.json();

    expect(body).toEqual({ error: "Falha inesperada no gateway." });
    expect(JSON.stringify(body)).not.toContain(sensitiveMarker);
  });
});
