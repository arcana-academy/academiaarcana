import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCookies,
  mockCreateClient,
  mockCreateToolContext,
  mockDecryptSharePointCredentials,
  mockRequireAuthenticatedUser,
  mockRunMestreArcano,
} = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockCreateClient: vi.fn(),
  mockCreateToolContext: vi.fn(),
  mockDecryptSharePointCredentials: vi.fn(),
  mockRequireAuthenticatedUser: vi.fn(),
  mockRunMestreArcano: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mockRequireAuthenticatedUser,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/infrastructure/openai/mestre-arcano", () => ({
  runMestreArcano: mockRunMestreArcano,
}));

vi.mock("@/infrastructure/openai/mestre-arcano-tool-context", () => ({
  createMestreArcanoToolContext: mockCreateToolContext,
}));

vi.mock("@/infrastructure/integrations/microsoft-sharepoint", () => ({
  MICROSOFT_SHAREPOINT_CREDENTIALS_COOKIE: "sharepoint-test",
  decryptMicrosoftSharePointCredentials: mockDecryptSharePointCredentials,
  encryptMicrosoftSharePointCredentials: vi.fn(),
  getValidMicrosoftSharePointCredentials: vi.fn(),
}));

import { POST } from "./route";

describe("Mestre Arcano agent route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue({ sub: "user-1" });
    mockCreateClient.mockResolvedValue({ client: true });
    mockCookies.mockResolvedValue({
      get: () => undefined,
      set: vi.fn(),
    });
    mockDecryptSharePointCredentials.mockResolvedValue(null);
    mockCreateToolContext.mockReturnValue({ context: true });
    mockRunMestreArcano.mockResolvedValue({
      output: "Resposta.",
      responseId: "resp_test",
      model: "gpt-5.6-sol",
    });
  });

  it("rejects unsupported help levels before creating runtime context", async () => {
    const response = await POST(
      new Request("https://example.com/api/agent/mestre-arcano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: "Ajude-me.",
          helpLevel: "full-solution",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Nível de ajuda inválido.",
    });
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(mockRunMestreArcano).not.toHaveBeenCalled();
  });

  it("passes an explicit supported help level to the runtime", async () => {
    const response = await POST(
      new Request("https://example.com/api/agent/mestre-arcano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: "Quero uma pista.",
          helpLevel: "hint",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockRunMestreArcano).toHaveBeenCalledWith(
      "Quero uma pista.",
      expect.objectContaining({
        toolContext: { context: true },
        helpLevel: "hint",
      }),
    );
  });
});
