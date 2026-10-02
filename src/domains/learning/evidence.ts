import type {
  EducationalStatistics,
  MasteryProjection,
} from "./contracts";
import type { PracticeAttempt, PracticeItem } from "@/domains/education";

export type LearningEvidenceOverview = {
  mastery: MasteryProjection[];
  statistics: EducationalStatistics;
};

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
  const score = recent.reduce((total, a) => total + a.evidenceScore, 0) / recent.length;
  const confidence = attempts.length >= 3 ? "strong" : "partial";
  const base = {
    practiceItemId: item.id,
    pageId: item.pageId,
    pageTitle: item.pageTitle,
    score,
    attemptCount: attempts.length,
    confidence: confidence as MasteryProjection["confidence"],
  };

  if (attempts.length >= 3 && score >= 0.9) {
    return {
      ...base,
      state: "strong-evidence",
      reason: "As tentativas recentes apresentam evidência consistente e suficiente para este item.",
    };
  }

  if (attempts.length >= 3 && score >= 0.7) {
    return {
      ...base,
      state: "consolidating",
      reason: "O desempenho recente sugere consolidação, mas pode ser revisado por novas evidências.",
    };
  }

  return {
    ...base,
    state: "developing",
    reason:
      attempts.length < 3
        ? "Há alguma evidência, mas a amostra ainda é pequena."
        : "As evidências atuais indicam que este conteúdo ainda merece prática ou revisão.",
  };
}

/** Calculates learning statistics separately from gamification state. */
export function buildEducationalStatistics(
  items: PracticeItem[],
  attempts: PracticeAttempt[],
  mastery: MasteryProjection[],
  reviewDueCount: number,
): EducationalStatistics {
  const attemptedPages = new Set(
    items
      .filter((item) => attempts.some((attempt) => attempt.practiceItemId === item.id))
      .map((item) => item.pageId),
  );
  return {
    practiceItemCount: items.length,
    attemptCount: attempts.length,
    practicedPageCount: attemptedPages.size,
    retrievalSuccessRate:
      attempts.length === 0
        ? null
        : attempts.filter((a) => a.outcome === "strong").length / attempts.length,
    averageEvidenceScore:
      attempts.length === 0
        ? null
        : attempts.reduce((sum, a) => sum + a.evidenceScore, 0) / attempts.length,
    reviewDueCount,
    masteryWithStrongEvidence: mastery.filter((entry) => entry.state === "strong-evidence").length,
  };
}
