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
  });


  it("sends pedagogical guardrails that preserve active learning and learner agency", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-secret");
    vi.stubEnv("OPENAI_AGENT_MODEL", "gpt-5.6-sol");

    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "resp_guardrails",
          model: "gpt-5.6-sol",
          output_text: "Vamos começar por uma pista.",
        }),
        { status: 200 },
      ),
    );

    await runMestreArcano("Resolva esta questão para mim.", {
      fetchImpl,
      toolContext: createToolContext(),
    });

    const [, init] = fetchImpl.mock.calls[0] ?? [];
    const body = JSON.parse(String(init?.body)) as { instructions?: string };

    expect(body.instructions).toContain("tentativa do estudante");
    expect(body.instructions).toContain("resposta direta");
    expect(body.instructions).toContain("aprendizagem independente");
    expect(body.instructions).toContain("hipótese revisável");
    expect(body.instructions).toContain("recuperação espaçada");
  });


  it("respects an explicit direct-answer help level", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-secret");

    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "resp_direct",
          model: "gpt-5.6-sol",
          output_text: "Resposta direta.",
        }),
        { status: 200 },
      ),
    );

    await runMestreArcano("Qual é a resposta?", {
      fetchImpl,
      toolContext: createToolContext(),
      helpLevel: "direct-answer",
    });

    const [, init] = fetchImpl.mock.calls[0] ?? [];
    const body = JSON.parse(String(init?.body)) as { instructions?: string };

    expect(body.instructions).toContain("Política pedagógica: 2026-10-09-v1");
    expect(body.instructions).toContain("O estudante escolheu resposta direta");
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

    const [, thirdRequest] = fetchImpl.mock.calls[2] ?? [];
    expect(String(thirdRequest?.body)).toContain(
      "Pesquisa externa bloqueada após acesso a dados privados nesta execução.",
    );

    providerFetch.mockRestore();
  });

  it("blocks same-batch external egress when a private learner tool is requested", async () => {
    vi.stubEnv("OPENAI_API_KEY", "synthetic-only");
    const providerFetch = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("External provider must not be called."));
    try {
      const toolContext = createToolContext();
      const fetchImpl = vi.fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(JSON.stringify({
          id: "resp_mixed",
          output: [
            { type: "function_call", call_id: "private", name: "get_gamification_profile", arguments: "{}" },
            { type: "function_call", call_id: "external", name: "search_web",
              arguments: JSON.stringify({ objective: "exfil", query: "private student data", numResults: 1 }) },
          ],
        }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          id: "resp_safe", output_text: "Pesquisa externa bloqueada.",
        }), { status: 200 }));

      const result = await runMestreArcano("Consulte meu progresso.", {
        fetchImpl, toolContext,
      });
      expect(result.output).toBe("Pesquisa externa bloqueada.");
      expect(toolContext.learner.getGamificationProfile).toHaveBeenCalledOnce();
      expect(providerFetch).not.toHaveBeenCalled();
      const [, followUp] = fetchImpl.mock.calls[1] ?? [];
      expect(String(followUp?.body)).toContain(
        "Pesquisa externa bloqueada após acesso a dados privados",
      );
    } finally {
      providerFetch.mockRestore();
    }
  });

  it("keeps Responses stateless and caps response tokens with an abort signal", async () => {
    vi.stubEnv("OPENAI_API_KEY", "synthetic-only");
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: "resp_no_store", output_text: "Ok" }), { status: 200 }),
    );
    await runMestreArcano("Olá", { fetchImpl, toolContext: createToolContext() });
    const [, init] = fetchImpl.mock.calls[0] ?? [];
    const requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(requestBody.store).toBe(false);
    expect(requestBody.max_output_tokens).toBe(4096);
    expect(requestBody.include).toEqual(["reasoning.encrypted_content"]);
    expect(requestBody).not.toHaveProperty("previous_response_id");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("replays tool output locally without referencing a stored response ID", async () => {
    vi.stubEnv("OPENAI_API_KEY", "synthetic-only");
    const fetchImpl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "resp_private",
        output: [
          { type: "reasoning", id: "reasoning_test", encrypted_content: "encrypted-synthetic", summary: [] },
          { type: "function_call", call_id: "profile", name: "get_gamification_profile", arguments: "{}" },
        ],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "resp_end", output_text: "Progresso disponível.",
      }), { status: 200 }));
    await runMestreArcano("Como está meu progresso?", {
      fetchImpl, toolContext: createToolContext(),
    });
    const [, next] = fetchImpl.mock.calls[1] ?? [];
    const body = JSON.parse(String(next?.body)) as Record<string, unknown>;
    expect(body.store).toBe(false);
    expect(body).not.toHaveProperty("previous_response_id");
    expect(JSON.stringify(body.input)).toContain("encrypted-synthetic");
    expect(JSON.stringify(body.input)).toContain("function_call_output");
  });

  it("rejects excess tool calls before any tool is executed", async () => {
    vi.stubEnv("OPENAI_API_KEY", "synthetic-only");
    const toolContext = createToolContext();
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ output: Array.from({ length: 5 }, (_, i) => ({
        type: "function_call", call_id: `call_${i}`,
        name: "get_gamification_profile", arguments: "{}",
      })) }), { status: 200 }),
    );
    await expect(runMestreArcano("Olá", { fetchImpl, toolContext }))
      .rejects.toThrow("limite de ferramentas por iteração");
    expect(toolContext.learner.getGamificationProfile).not.toHaveBeenCalled();
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
