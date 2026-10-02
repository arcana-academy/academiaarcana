import type {
  EducationalStatistics,
  EvidenceProjection,
} from "./contracts";
import type { PracticeAttempt, PracticeItem } from "@/domains/education";

export type LearningEvidenceOverview = {
  evidence: EvidenceProjection[];
  statistics: EducationalStatistics;
};

/**
 * Projects item-level self-reported retrieval evidence.
 *
 * This function deliberately does not infer or confirm academic mastery.
 */
export function buildEvidenceProjection(
  item: PracticeItem,
  attempts: PracticeAttempt[],
): EvidenceProjection {
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
      source: "self-assessment",
      masteryConfirmed: false,
    };
  }

  const recent = [...attempts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const score =
    recent.reduce((total, attempt) => total + attempt.evidenceScore, 0) /
    recent.length;
  const confidence =
    attempts.length >= 3 ? "strong" : attempts.length > 0 ? "partial" : "insufficient";
  const state =
    attempts.length >= 3 && score >= 0.9
      ? "strong-evidence"
      : attempts.length >= 3 && score >= 0.7
        ? "consolidating"
        : "developing";
  const reason =
    state === "strong-evidence"
      ? "As autoavaliações recentes apresentam evidência autorreportada consistente. Isso não confirma domínio acadêmico."
      : state === "consolidating"
        ? "As autoavaliações recentes sugerem consolidação, mas o sinal é autorreportado e pode mudar com novas evidências."
        : attempts.length < 3
          ? "Há alguma evidência autorreportada, mas a amostra ainda é pequena."
          : "As evidências autorreportadas atuais indicam que este conteúdo ainda merece prática ou revisão.";

  return {
    practiceItemId: item.id,
    pageId: item.pageId,
    pageTitle: item.pageTitle,
    state,
    score,
    attemptCount: attempts.length,
    confidence,
    reason,
    source: "self-assessment",
    masteryConfirmed: false,
  };
}

/** Calculates learning statistics separately from gamification state. */
export function buildEducationalStatistics(
  items: PracticeItem[],
  attempts: PracticeAttempt[],
  evidence: EvidenceProjection[],
  reviewDueCount: number,
): EducationalStatistics {
  const practicedItemIds = new Set(attempts.map((attempt) => attempt.practiceItemId));
  const practicedPageCount = new Set(
    items
      .filter((item) => practicedItemIds.has(item.id))
      .map((item) => item.pageId),
  ).size;

  return {
    practiceItemCount: items.length,
    attemptCount: attempts.length,
    practicedPageCount,
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
    itemsWithStrongSelfReportedEvidence: evidence.filter(
      (entry) => entry.state === "strong-evidence",
    ).length,
  };
}
