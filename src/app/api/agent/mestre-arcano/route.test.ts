import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { POST } from "./route";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/application/intelligence/execute-mestre-arcano", () => ({
  executeMestreArcano: vi.fn(),
}));
vi.mock("@/infrastructure/openai/mestre-arcano", () => ({
  runMestreArcano: vi.fn(),
}));
vi.mock("@/infrastructure/openai/mestre-arcano-tool-context", () => ({
  createMestreArcanoToolContext: vi.fn(),
}));
vi.mock("@/infrastructure/integrations/microsoft-sharepoint", () => ({
  MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE: "synthetic-sharepoint-cookie",
  decryptMicrosoftSharePointCredentials: vi.fn(),
  encryptMicrosoftSharePointCredentials: vi.fn(),
  getValidMicrosoftSharePointCredentials: vi.fn(),
}));

async function postRawJson(raw: string) {
  return POST(
    new Request("http://localhost/api/agent/mestre-arcano", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAuthenticatedUser).mockResolvedValue({
    sub: "synthetic-learner",
  } as Awaited<ReturnType<typeof requireAuthenticatedUser>>);
});

describe("Mestre Arcano POST JSON validation", () => {
  it.each([
    ["null", "null"],
    ["array", "[]"],
    ["numeric primitive", "42"],
    ["boolean primitive", "false"],
    ["string primitive", '"hello"'],
    ["missing input", "{}"],
    ["null input", '{"input":null}'],
    ["whitespace input", '{"input":"  "}'],
  ])("returns 400 for %s without starting inference", async (_name, raw) => {
    const response = await postRawJson(raw);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Informe uma mensagem para o Mestre Arcano.",
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON without starting inference", async () => {
    const response = await postRawJson("{not-json");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "JSON inválido." });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects an overlong message before accessing provider state", async () => {
    const response = await postRawJson(
      JSON.stringify({ input: "a".repeat(8001) }),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: "A mensagem excede o limite permitido.",
    });
    expect(createClient).not.toHaveBeenCalled();
  });
});
