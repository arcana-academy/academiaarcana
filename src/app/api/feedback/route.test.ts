import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateFeedback } = vi.hoisted(() => ({ mockCreateFeedback: vi.fn() }));

vi.mock("@/infrastructure/supabase/feedback-repository", () => ({
  createFeedback: mockCreateFeedback,
  FeedbackAuthenticationError: class FeedbackAuthenticationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "FeedbackAuthenticationError";
    }
  },
}));

import { FeedbackAuthenticationError } from "@/infrastructure/supabase/feedback-repository";
import { POST } from "./route";

const valid = JSON.stringify({
  name: "",
  email: "student@example.com",
  feedback: "Sugestão.",
});
function makeRequest(body: string) {
  return new Request("https://example.com/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
describe("POST /api/feedback", () => {
  beforeEach(() => mockCreateFeedback.mockReset());

  it("returns 201 on successful persistence", async () => {
    mockCreateFeedback.mockResolvedValue({ id: "feedback-1", createdAt: "2026-10-10T12:00:00Z" });
    const response = await POST(makeRequest(valid));
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      id: "feedback-1", createdAt: "2026-10-10T12:00:00Z",
    });
    expect(mockCreateFeedback).toHaveBeenCalledWith({
      name: null, email: "student@example.com", feedback: "Sugestão.",
    });
  });

  it("rejects invalid fields with 400 before persistence", async () => {
    const response = await POST(makeRequest(JSON.stringify({
      name: "", email: "wrong", feedback: "",
    })));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Revise os campos do formulário." });
    expect(mockCreateFeedback).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON with safe 400", async () => {
    const response = await POST(makeRequest('{"email":'));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Revise os campos do formulário." });
    expect(mockCreateFeedback).not.toHaveBeenCalled();
  });

  it("returns 401 for typed authentication errors", async () => {
    mockCreateFeedback.mockImplementationOnce(async () => {
      throw new FeedbackAuthenticationError("É necessário estar autenticado para enviar feedback.");
    });
    const response = await POST(makeRequest(valid));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "É necessário estar autenticado para enviar feedback.",
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 500 without leaking unexpected storage error details", async () => {
    mockCreateFeedback.mockImplementationOnce(async () => {
      throw new Error("internal credential: private-value");
    });
    const response = await POST(makeRequest(valid));
    const body = await response.text();
    expect(response.status).toBe(500);
    expect(JSON.parse(body)).toEqual({ error: "Não foi possível salvar o feedback." });
    expect(body).not.toContain("private-value");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
