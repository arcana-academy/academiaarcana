import { afterEach, describe, expect, it, vi } from "vitest";

import {
  runMestreArcano,
  verifyOpenAIAgentConnection,
} from "./mestre-arcano";

describe("Mestre Arcano OpenAI integration", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("executes a Responses API request without exposing the API key to the payload", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-secret");
    vi.stubEnv("OPENAI_AGENT_MODEL", "gpt-5.6-sol");

    const supabase = {} as never;

    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "resp_test",
          model: "gpt-5.6-sol",
          output_text: "Resposta do Mestre Arcano.",
        }),
        { status: 200 },
      ),
    );

    const result = await runMestreArcano("Explique fotossíntese.", { fetchImpl, supabase, ownerId: "user-1" });

    expect(result).toEqual({
      output: "Resposta do Mestre Arcano.",
      responseId: "resp_test",
      model: "gpt-5.6-sol",
    });

    const [, init] = fetchImpl.mock.calls[0] ?? [];
    expect(init?.headers).toMatchObject({ Authorization: "Bearer test-secret" });
    expect(String(init?.body)).not.toContain("test-secret");
  });

  it("verifies the configured model", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-secret");
    vi.stubEnv("OPENAI_AGENT_MODEL", "gpt-5.6-sol");

    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: "model" }), { status: 200 }),
    );

    await expect(verifyOpenAIAgentConnection({ fetchImpl })).resolves.toMatchObject({
      providerId: "openai-agents",
      status: "connected",
      model: "gpt-5.6-sol",
    });
  });

  it("fails closed when the server key is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");

    await expect(runMestreArcano("Olá", { fetchImpl: vi.fn(), supabase: {} as never, ownerId: "user-1" })).rejects.toThrow(
      "OpenAI integration is not configured.",
    );
  });
});
