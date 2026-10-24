import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createFeedback: vi.fn(),
  consume: vi.fn(),
  createClient: vi.fn(async () => ({ from: vi.fn() })),
}));

vi.mock("@/infrastructure/supabase/feedback-repository", () => ({
  createFeedback: mocks.createFeedback,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
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
  name: "Estudante",
  email: "estudante@example.test",
  feedback: "O Santuário está claro.",
};

function post(body: unknown) {
  return new Request("https://example.test/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createFeedback.mockResolvedValue({
      id: "feedback-1",
      createdAt: "2026-10-24T12:00:00.000Z",
    });
    mocks.consume.mockResolvedValue({
      allowed: true,
      remaining: 9,
      retryAfterSeconds: 0,
    });
  });

  it("stores the feedback and returns 201 when the quota allows it", async () => {
    const response = await POST(post(validBody));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: "feedback-1",
      createdAt: "2026-10-24T12:00:00.000Z",
    });
    expect(mocks.consume).toHaveBeenCalledWith("feedback");
    expect(mocks.createFeedback).toHaveBeenCalledTimes(1);
  });

  it("returns 429 with Retry-After and stores nothing once the quota is exhausted", async () => {
    mocks.consume.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 30,
    });

    const response = await POST(post(validBody));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(mocks.createFeedback).not.toHaveBeenCalled();
  });

  it("does not consume the quota for a malformed body", async () => {
    const response = await POST(post({ ...validBody, email: "não-é-email" }));

    expect(response.status).toBe(400);
    expect(mocks.consume).not.toHaveBeenCalled();
    expect(mocks.createFeedback).not.toHaveBeenCalled();
  });

  it("does not echo an internal error message to the client", async () => {
    mocks.createFeedback.mockRejectedValue(
      new Error('duplicate key value violates unique constraint "feedback_pkey"'),
    );

    const response = await POST(post(validBody));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Não foi possível salvar o feedback.");
    expect(payload.error).not.toMatch(/duplicate key|constraint|feedback_pkey/);
  });

  it("stays fail-open when the limiter is unavailable", async () => {
    mocks.consume.mockRejectedValue(new Error("relation does not exist"));

    const response = await POST(post(validBody));

    expect(response.status).toBe(201);
    expect(mocks.createFeedback).toHaveBeenCalledTimes(1);
  });

  it("keeps the 401 contract for an unauthenticated submission", async () => {
    mocks.createFeedback.mockRejectedValue(
      new Error("É necessário estar autenticado para enviar feedback."),
    );

    const response = await POST(post(validBody));

    expect(response.status).toBe(401);
  });
});
