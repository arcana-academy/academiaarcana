import type {
  EducationalStatistics,
  MasteryProjection,
} from "./contracts";
import type { PracticeAttempt, PracticeItem } from "@/domains/education";

export type LearningEvidenceOverview = {
  mastery: MasteryProjection[];
  statistics: EducationalStatistics;
};

function confidenceFor(attemptCount: number): MasteryProjection["confidence"] {
  if (attemptCount >= 3) return "strong";
  if (attemptCount > 0) return "partial";
  return "insufficient";
}

function masteryStateFor(
  attempts: number,
  score: number,
): MasteryProjection["state"] {
  if (attempts >= 3 && score >= 0.9) return "strong-evidence";
  if (attempts >= 3 && score >= 0.7) return "consolidating";
  return "developing";
}

function masteryReasonFor(
  attempts: number,
  state: MasteryProjection["state"],
): string {
  if (state === "strong-evidence") {
    return "As tentativas recentes apresentam evidência consistente e suficiente para este item.";
  }
  if (state === "consolidating") {
    return "O desempenho recente sugere consolidação, mas pode ser revisado por novas evidências.";
  }
  return attempts < 3
    ? "Há alguma evidência, mas a amostra ainda é pequena."
    : "As evidências atuais indicam que este conteúdo ainda merece prática ou revisão.";
}

/** Projects item-level mastery only from repeated educational evidence. */
export function buildMasteryProjection(
  item: PracticeItem,
  attempts: PracticeAttempt[],
): MasteryProjection {
  if (!attempts.length) {
    return {
      practiceItemId: item.id,
      pageId: item.pageId,
      pageTitle: item.pageTitle,
      state: "unknown",
      score: null,
      attemptCount: 0,
      confidence: "insufficient",
      reason: "Ainda não há tentativas suficientes para produzir evidência.",
    };
  }

  const recent = [...attempts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const score =
    recent.reduce((total, attempt) => total + attempt.evidenceScore, 0) /
    recent.length;
  const state = masteryStateFor(attempts.length, score);

  return {
    practiceItemId: item.id,
    pageId: item.pageId,
    pageTitle: item.pageTitle,
    state,
    score,
    attemptCount: attempts.length,
    confidence: confidenceFor(attempts.length),
    reason: masteryReasonFor(attempts.length, state),
  };
}

function practicedPageCount(
  items: PracticeItem[],
  attempts: PracticeAttempt[],
): number {
  const attemptedItemIds = new Set(attempts.map((attempt) => attempt.practiceItemId));
  return new Set(
    items
      .filter((item) => attemptedItemIds.has(item.id))
      .map((item) => item.pageId),
  ).size;
}

/** Calculates learning statistics separately from gamification state. */
export function buildEducationalStatistics(
  items: PracticeItem[],
  attempts: PracticeAttempt[],
  mastery: MasteryProjection[],
  reviewDueCount: number,
): EducationalStatistics {
  return {
    practiceItemCount: items.length,
    attemptCount: attempts.length,
    practicedPageCount: practicedPageCount(items, attempts),
    retrievalSuccessRate:
      attempts.length === 0
        ? null
        : attempts.filter((attempt) => attempt.outcome === "strong").length /
          attempts.length,
    averageEvidenceScore:
      attempts.length === 0
        ? null
        : attempts.reduce(
            (sum, attempt) => sum + attempt.evidenceScore,
            0,
          ) / attempts.length,
    reviewDueCount,
    masteryWithStrongEvidence: mastery.filter(
      (entry) => entry.state === "strong-evidence",
    ).length,
  };
}
