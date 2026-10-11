import { beforeEach, describe, expect, it, vi } from "vitest";

const { createFeedback } = vi.hoisted(() => ({
  createFeedback: vi.fn(),
}));

vi.mock("@/infrastructure/supabase/feedback-repository", () => ({
  createFeedback,
  FeedbackAuthenticationError: class FeedbackAuthenticationError extends Error {},
}));

import { FeedbackAuthenticationError } from "@/infrastructure/supabase/feedback-repository";
import { POST } from "./route";

function feedbackRequest(body: unknown) {
  return new Request("https://example.com/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validInput = {
  name: "",
  email: "student@example.com",
  feedback: "Gostei do Santuário.",
};

describe("POST /api/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists valid feedback without caching", async () => {
    createFeedback.mockResolvedValue({
      id: "feedback-1",
      createdAt: "2026-10-11T10:00:00.000Z",
    });

    const response = await POST(feedbackRequest(validInput));

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      id: "feedback-1",
      createdAt: "2026-10-11T10:00:00.000Z",
    });
    expect(createFeedback).toHaveBeenCalledWith({
      name: null,
      email: validInput.email,
      feedback: validInput.feedback,
    });
  });

  it("rejects invalid input without persisting it", async () => {
    const response = await POST(feedbackRequest({
      name: "",
      email: "invalid-email",
      feedback: "",
    }));

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Revise os campos do formulário.",
    });
    expect(createFeedback).not.toHaveBeenCalled();
  });

  it("treats malformed JSON as a client input error, without persistence", async () => {
    const request = new Request("https://example.com/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"name":',
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Revise os campos do formulário.",
    });
    expect(createFeedback).not.toHaveBeenCalled();
  });

  it("keeps server-side SyntaxError classified as internal failure", async () => {
    createFeedback.mockRejectedValueOnce(
      new SyntaxError("internal parser detail must remain private"),
    );
    const response = await POST(feedbackRequest(validInput));
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Não foi possível salvar o feedback.",
    });
  });

  it("returns 401 only for a typed authentication failure", async () => {
    createFeedback.mockRejectedValueOnce(new FeedbackAuthenticationError());

    const response = await POST(feedbackRequest(validInput));

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Entre na sua conta para enviar feedback.",
    });
  });

  it("does not disclose internal exception details to clients", async () => {
    createFeedback.mockRejectedValueOnce(
      new Error("internal database host=db.private.example credential=secret"),
    );

    const response = await POST(feedbackRequest(validInput));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({ error: "Não foi possível salvar o feedback." });
    expect(JSON.stringify(body)).not.toContain("db.private.example");
    expect(JSON.stringify(body)).not.toContain("secret");
  });
});
