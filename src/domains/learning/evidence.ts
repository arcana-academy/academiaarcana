import type {
  EducationalStatistics,
  EvidenceProjection,
} from "./contracts";
import type { PracticeAttempt, PracticeItem } from "@/domains/education";

export type LearningEvidenceOverview = {
  evidence: EvidenceProjection[];
  statistics: EducationalStatistics;
};

/** Derives confidence from the number of persisted retrieval attempts. */
const confidenceFor = (attemptCount: number): EvidenceProjection["confidence"] => {
  if (attemptCount >= 3) return "strong";
  if (attemptCount > 0) return "partial";
  return "insufficient";
};

/** Classifies self-reported evidence without confirming academic mastery. */
const evidenceStateFor = (
  attempts: number,
  score: number,
): EvidenceProjection["state"] => {
  if (attempts >= 3 && score >= 0.9) return "strong-evidence";
  if (attempts >= 3 && score >= 0.7) return "consolidating";
  return "developing";
};

/** Explains the evidence state and its epistemic limit. */
const evidenceReasonFor = (
  attempts: number,
  state: EvidenceProjection["state"],
): string => {
  if (state === "strong-evidence") {
    return "As autoavaliações recentes apresentam evidência autorreportada consistente. Isso não confirma domínio acadêmico.";
  }
  if (state === "consolidating") {
    return "As autoavaliações recentes sugerem consolidação, mas o sinal é autorreportado e pode mudar com novas evidências.";
  }
  return attempts < 3
    ? "Há alguma evidência autorreportada, mas a amostra ainda é pequena."
    : "As evidências autorreportadas atuais indicam que este conteúdo ainda merece prática ou revisão.";
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
  const state = evidenceStateFor(attempts.length, score);

  return {
    practiceItemId: item.id,
    pageId: item.pageId,
    pageTitle: item.pageTitle,
    state,
    score,
    attemptCount: attempts.length,
    confidence: confidenceFor(attempts.length),
    reason: evidenceReasonFor(attempts.length, state),
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
