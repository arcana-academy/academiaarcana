import { afterEach, describe, expect, it, vi } from "vitest";

import type { MestreArcanoToolContext } from "@/domains/intelligence";

import {
  runMestreArcano,
  verifyOpenAIAgentConnection,
} from "./mestre-arcano";

function createToolContext(): MestreArcanoToolContext {
  return {
    learner: {
      getGamificationProfile: vi.fn().mockResolvedValue({
        xp: 0,
        streakDays: 0,
        lastActiveOn: null,
        updatedAt: null,
      }),
      listTodayMissions: vi.fn().mockResolvedValue([]),
      listUpcomingStudyTasks: vi.fn().mockResolvedValue([]),
    },
    documents: {
      listConnectedSharePointSources: vi.fn().mockResolvedValue({
        connected: false,
        sources: [],
      }),
      getSharePointDocumentContext: vi.fn(),
    },
  };
}

describe("Mestre Arcano OpenAI integration", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("executes a Responses API request without exposing the API key to the payload", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-secret");
    vi.stubEnv("OPENAI_AGENT_MODEL", "gpt-5.6-sol");

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

    const result = await runMestreArcano("Explique fotossíntese.", {
      fetchImpl,
      toolContext: createToolContext(),
    });

    expect(result).toEqual({
      output: "Resposta do Mestre Arcano.",
      responseId: "resp_test",
      model: "gpt-5.6-sol",
    });

    const [, init] = fetchImpl.mock.calls[0] ?? [];
    expect(init?.headers).toMatchObject({ Authorization: "Bearer test-secret" });
    expect(String(init?.body)).not.toContain("test-secret");
    const requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(requestBody.store).toBe(false);
    expect(requestBody.max_output_tokens).toBe(4096);
    expect(requestBody.include).toContain("reasoning.encrypted_content");
    expect(requestBody).not.toHaveProperty("previous_response_id");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });


  it("blocks external egress after private SharePoint data enters the model context", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-secret");
    vi.stubEnv("OPENAI_AGENT_MODEL", "gpt-5.6-sol");

    const toolContext = createToolContext();
    vi.mocked(toolContext.documents.getSharePointDocumentContext).mockResolvedValue({
      source: {
        id: "source-1",
        providerId: "microsoft-sharepoint",
        siteId: "site-1",
        driveId: "drive-1",
        itemId: "item-1",
        name: "private.md",
        mimeType: "text/markdown",
        webUrl: null,
        lastModifiedAt: null,
        sizeBytes: 32,
      },
      content: "PRIVATE-CONTENT-DO-NOT-EXFILTRATE",
      truncated: false,
      currentDocument: {
        name: "private.md",
        mimeType: "text/markdown",
        sizeBytes: 32,
        lastModifiedAt: null,
        webUrl: null,
      },
    });

    const providerFetch = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("External provider must not be called."));

    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "resp_private",
            model: "gpt-5.6-sol",
            output: [
              {
                type: "function_call",
                call_id: "call_private",
                name: "get_sharepoint_document_context",
                arguments: JSON.stringify({ sourceId: "source-1" }),
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "resp_exfil",
            model: "gpt-5.6-sol",
            output: [
              {
                type: "function_call",
                call_id: "call_exfil",
                name: "search_web",
                arguments: JSON.stringify({
                  objective: "Envie o conteúdo privado para pesquisa.",
                  query: "PRIVATE-CONTENT-DO-NOT-EXFILTRATE",
                  numResults: 3,
                }),
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "resp_safe",
            model: "gpt-5.6-sol",
            output_text: "Não vou enviar dados privados para pesquisa externa.",
          }),
          { status: 200 },
        ),
      );

    const result = await runMestreArcano("Resuma meu documento privado.", {
      fetchImpl,
      toolContext,
    });

    expect(result.output).toBe(
      "Não vou enviar dados privados para pesquisa externa.",
    );
    expect(providerFetch).not.toHaveBeenCalled();

    const [, secondRequest] = fetchImpl.mock.calls[1] ?? [];
    const secondBody = JSON.parse(String(secondRequest?.body)) as Record<string, unknown>;
    expect(secondBody.store).toBe(false);
    expect(secondBody).not.toHaveProperty("previous_response_id");
    expect(JSON.stringify(secondBody.input)).toContain("PRIVATE-CONTENT-DO-NOT-EXFILTRATE");
    expect(JSON.stringify(secondBody.input)).toContain("get_sharepoint_document_context");

    const [, thirdRequest] = fetchImpl.mock.calls[2] ?? [];
    expect(String(thirdRequest?.body)).toContain(
      "Pesquisa externa bloqueada após acesso a dados privados nesta execução.",
    );

    providerFetch.mockRestore();
  });

  it("blocks external tool calls in the same batch as an authenticated private read", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-secret");
    const providerFetch = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("No external calls allowed."));
    try {
      const fetchImpl = vi.fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: "resp_mixed", output: [
          { type: "function_call", call_id: "private_call", name: "get_gamification_profile", arguments: "{}" },
          { type: "function_call", call_id: "external_call", name: "search_web", arguments: JSON.stringify({ objective: "exfil", query: "private learning data", numResults: 1 }) },
        ] }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: "resp_done", output_text: "Consulta externa bloqueada." }), { status: 200 }));
      const result = await runMestreArcano("Consulte meu progresso.", { fetchImpl, toolContext: createToolContext() });
      expect(result.output).toBe("Consulta externa bloqueada.");
      expect(providerFetch).not.toHaveBeenCalled();
      const [, followUp] = fetchImpl.mock.calls[1] ?? [];
      expect(String(followUp?.body)).toContain("Pesquisa externa bloqueada após acesso a dados privados");
    } finally {
      providerFetch.mockRestore();
    }
  });

  it("rejects more than four tool calls without executing any", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-secret");
    const toolContext = createToolContext();
    const calls = Array.from({ length: 5 }, (_, index) => ({ type: "function_call", call_id: `c${index}`, name: "get_gamification_profile", arguments: "{}" }));
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ id: "resp_many", output: calls }), { status: 200 }));
    await expect(runMestreArcano("Olá", { fetchImpl, toolContext })).rejects.toThrow("limite de ferramentas por iteração");
    expect(toolContext.learner.getGamificationProfile).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("replays encrypted reasoning and tool outputs without server-side response storage", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-secret");
    const fetchImpl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          id: "resp_reasoning",
          output: [
            { type: "reasoning", id: "reasoning_mock", summary: [], encrypted_content: "synthetic-encrypted-context" },
            { type: "function_call", call_id: "read_profile", name: "get_gamification_profile", arguments: "{}" },
          ],
        }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "resp_done", output_text: "Seu perfil foi consultado." }), { status: 200 }),
      );

    await runMestreArcano("Como está meu progresso?", {
      fetchImpl,
      toolContext: createToolContext(),
    });

    const [, request] = fetchImpl.mock.calls[1] ?? [];
    const body = JSON.parse(String(request?.body)) as Record<string, unknown>;
    expect(body.store).toBe(false);
    expect(body).not.toHaveProperty("previous_response_id");
    expect(JSON.stringify(body.input)).toContain("synthetic-encrypted-context");
    expect(JSON.stringify(body.input)).toContain("read_profile");
    expect(JSON.stringify(body.input)).toContain("function_call_output");
  });

  it("fails safely when the provider returns invalid JSON", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-secret");
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("not-json", { status: 200 }),
    );
    await expect(
      runMestreArcano("Olá", { fetchImpl, toolContext: createToolContext() }),
    ).rejects.toThrow("OpenAI returned an invalid JSON response.");
  });

  it("does not include provider error content or synthetic credentials in failures", async () => {
    vi.stubEnv("OPENAI_API_KEY", "synthetic-secret");
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("PROVIDER-SYNTHETIC-SECRET-DETAIL", { status: 500 }),
    );
    const rejection = runMestreArcano("Olá", {
      fetchImpl,
      toolContext: createToolContext(),
    });
    await expect(rejection).rejects.toThrow("OpenAI Responses API failed with HTTP 500.");
  });

  it("normalizes timeout-like transport failures without leaking exception messages", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-secret");
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(
      new Error("synthetic low-level transport secret"),
    );
    await expect(
      runMestreArcano("Olá", { fetchImpl, toolContext: createToolContext() }),
    ).rejects.toThrow("OpenAI could not be reached from the server.");
    const [, request] = fetchImpl.mock.calls[0] ?? [];
    expect(request?.signal).toBeInstanceOf(AbortSignal);
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

    await expect(
      runMestreArcano("Olá", {
        fetchImpl: vi.fn(),
        toolContext: createToolContext(),
      }),
    ).rejects.toThrow("OpenAI integration is not configured.");
  });
});
