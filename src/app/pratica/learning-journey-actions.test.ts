import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  createClient: vi.fn(),
  revalidateLearningViews: vi.fn(),
  redirect: vi.fn(),
  createPracticeItem: vi.fn(),
  recordPracticeAttemptAndProgress: vi.fn(),
  recordCriterionReferencedPracticeAttempt: vi.fn(),
  listPracticeItems: vi.fn(),
  createObjectiveAssessment: vi.fn(),
  createStudyTask: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/learning/revalidate-learning-views", () => ({
  revalidateLearningViews: mocks.revalidateLearningViews,
}));
vi.mock("@/application/education/p1", () => ({
  createObjectiveAssessment: mocks.createObjectiveAssessment,
  buildAttemptInput: (input: {
    practiceItemId: string;
    answer: string;
    outcome: "strong" | "partial" | "insufficient";
  }) => ({ ...input, evidenceScore: 0.8, confidence: "moderate", feedback: "evidência sintética" }),
}));
vi.mock("@/infrastructure/supabase/education/practice-repository", () => ({
  SupabaseEducationalPracticeRepository: class {
    createPracticeItem = mocks.createPracticeItem;
    recordPracticeAttemptAndProgress = mocks.recordPracticeAttemptAndProgress;
    recordCriterionReferencedPracticeAttempt = mocks.recordCriterionReferencedPracticeAttempt;
    listPracticeItems = mocks.listPracticeItems;
  },
}));
vi.mock("@/application/planning/study-tasks", () => ({
  StudyTaskService: class {
    create = mocks.createStudyTask;
  },
}));
vi.mock("@/infrastructure/supabase/planning/study-task-repository", () => ({
  SupabaseStudyTaskRepository: class {},
}));

import {
  createPracticeItemAction,
  planPracticeReviewAction,
  submitObjectiveAssessmentAction,
  submitPracticeAttemptAction,
} from "./actions";

const item = {
  id: "practice-synthetic",
  pageId: "page-synthetic",
  prompt: "Que conceito você aprendeu?",
};

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAuthenticatedUser.mockResolvedValue({ sub: "learner-synthetic" });
  mocks.createClient.mockResolvedValue({});
  mocks.listPracticeItems.mockResolvedValue([item]);
  mocks.redirect.mockImplementation((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  });
});

describe("Practice to page progress and scheduling contracts", () => {
  it("refreshes only persisted practice evidence and redirects to its real page", async () => {
    mocks.recordPracticeAttemptAndProgress.mockResolvedValue({ id: "attempt-synthetic" });

    await expect(
      submitPracticeAttemptAction(form({
        practiceItemId: item.id,
        answer: "Aprendi o conceito",
        outcome: "partial",
      })),
    ).rejects.toThrow("NEXT_REDIRECT:/pratica?pagina=page-synthetic&item=practice-synthetic");

    expect(mocks.recordPracticeAttemptAndProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: "learner-synthetic",
        practiceItemId: item.id,
        outcome: "partial",
      }),
    );
    expect(mocks.revalidateLearningViews).toHaveBeenCalledWith("practice-evidence-recorded");
    expect(mocks.createStudyTask).not.toHaveBeenCalled();
  });

  it("does not claim progress when an educational attempt fails to persist", async () => {
    mocks.recordPracticeAttemptAndProgress.mockRejectedValue(new Error("attempt unavailable"));

    await expect(
      submitPracticeAttemptAction(form({
        practiceItemId: item.id,
        answer: "Tentativa",
        outcome: "partial",
      })),
    ).rejects.toThrow("attempt unavailable");

    expect(mocks.revalidateLearningViews).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("rejects forged or unknown practice items before recording progress", async () => {
    mocks.listPracticeItems.mockResolvedValue([]);

    await expect(submitPracticeAttemptAction(form({
      practiceItemId: "unknown-item",
      answer: "Tentativa",
      outcome: "strong",
    }))).rejects.toThrow("Atividade de prática não encontrada.");

    expect(mocks.recordPracticeAttemptAndProgress).not.toHaveBeenCalled();
    expect(mocks.revalidateLearningViews).not.toHaveBeenCalled();
  });

  it("refreshes learning evidence after the objective assessment RPC succeeds", async () => {
    mocks.recordCriterionReferencedPracticeAttempt.mockResolvedValue({ id: "objective-attempt" });

    await expect(submitObjectiveAssessmentAction(form({
      practiceItemId: item.id,
      answer: "Resposta objetiva",
    }))).rejects.toThrow(
      "NEXT_REDIRECT:/pratica?pagina=page-synthetic&avaliacao=practice-synthetic",
    );

    expect(mocks.recordCriterionReferencedPracticeAttempt).toHaveBeenCalledWith({
      ownerId: "learner-synthetic",
      practiceItemId: item.id,
      answer: "Resposta objetiva",
    });
    expect(mocks.revalidateLearningViews).toHaveBeenCalledWith("practice-evidence-recorded");
  });

  it("schedules a review only for the authenticated learner's practice item", async () => {
    mocks.createStudyTask.mockResolvedValue({ id: "task-synthetic" });

    await expect(planPracticeReviewAction(form({
      practiceItemId: item.id,
      dueAt: "2026-10-15T10:00:00.000Z",
      title: "Revisar esta página",
    }))).resolves.toBeUndefined();

    expect(mocks.createStudyTask).toHaveBeenCalledWith({
      ownerId: "learner-synthetic",
      title: "Revisar esta página",
      dueAt: "2026-10-15T10:00:00.000Z",
    });
    expect(mocks.revalidateLearningViews).toHaveBeenCalledWith("practice-review-planned");
  });

  it("does not refresh a nonexistent review task", async () => {
    mocks.createStudyTask.mockRejectedValue(new Error("task not created"));

    await expect(planPracticeReviewAction(form({
      practiceItemId: item.id,
      dueAt: "2026-10-15T10:00:00.000Z",
      title: "Revisar",
    }))).rejects.toThrow("task not created");

    expect(mocks.revalidateLearningViews).not.toHaveBeenCalled();
  });

  it("does not instantiate a client or record anything without authentication", async () => {
    mocks.requireAuthenticatedUser.mockRejectedValue(new Error("unauthenticated"));

    await expect(submitPracticeAttemptAction(form({
      practiceItemId: item.id,
      answer: "Respostas",
      outcome: "strong",
    }))).rejects.toThrow("unauthenticated");

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.recordPracticeAttemptAndProgress).not.toHaveBeenCalled();
    expect(mocks.revalidateLearningViews).not.toHaveBeenCalled();
  });

  it("keeps practice creation separate from awarding missions or XP", async () => {
    mocks.createPracticeItem.mockResolvedValue({ id: "practice-new" });
    await expect(createPracticeItemAction(form({
      pageId: item.pageId,
      prompt: "Pergunta",
      referenceAnswer: "Referência",
      difficulty: "3",
    }))).rejects.toThrow("NEXT_REDIRECT:/pratica?pagina=page-synthetic&item=practice-new");

    expect(mocks.createPracticeItem).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: "learner-synthetic",
      pageId: item.pageId,
      prompt: "Pergunta",
    }));
    expect(mocks.revalidateLearningViews).toHaveBeenCalledWith("practice-item-created");
    expect(mocks.createStudyTask).not.toHaveBeenCalled();
  });
});
