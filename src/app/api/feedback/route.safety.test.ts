import { beforeEach, describe, expect, it, vi } from "vitest";

const createFeedbackMock = vi.hoisted(() => vi.fn());

vi.mock("@/infrastructure/supabase/feedback-repository", () => ({
  createFeedback: createFeedbackMock,
  FeedbackAuthenticationError: class FeedbackAuthenticationError extends Error {},
}));

import { FeedbackAuthenticationError } from "@/infrastructure/supabase/feedback-repository";
import { POST } from "./route";

const valid = { name: "", email: "pessoa@exemplo.com", feedback: "Funciona" };
const request = (payload: unknown) => new Request("https://example.com/api/feedback", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
});

describe("POST /api/feedback — segurança de erros", () => {
  beforeEach(() => vi.resetAllMocks());

  it("retorna 400 para validação e não chama o repositório", async () => {
    const response = await POST(request({ ...valid, email: "invalido" }));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(createFeedbackMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ error: "Revise os campos do formulário." });
  });

  it("retorna 401 para sessão não autenticada sem detalhes privados", async () => {
    createFeedbackMock.mockRejectedValue(new FeedbackAuthenticationError("private-session"));
    const response = await POST(request(valid));
    expect(response.status).toBe(401);
    const payload = await response.json();
    expect(payload.error).toBe("Faça login novamente antes de enviar feedback.");
    expect(JSON.stringify(payload)).not.toContain("private-session");
  });

  it("retorna 500 sem vazar detalhes de armazenamento", async () => {
    createFeedbackMock.mockRejectedValue(new Error("relation private.feedback_responses; token=SECRET"));
    const response = await POST(request(valid));
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const payload = await response.json();
    expect(payload.error).toContain("não está confirmado");
    expect(JSON.stringify(payload)).not.toContain("SECRET");
  });

  it("retorna 201 quando criação foi confirmada", async () => {
    createFeedbackMock.mockResolvedValue({ id: "entry-1", createdAt: "2026-10-10T10:00:00Z" });
    const response = await POST(request(valid));
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: "entry-1", createdAt: "2026-10-10T10:00:00Z",
    });
  });
});
