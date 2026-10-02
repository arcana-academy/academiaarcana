import type {
  EducationalStatistics,
  EvidenceProjection,
  ObjectiveEvidenceProjection,
} from "./contracts";
import type { PracticeAttempt, PracticeItem } from "@/domains/education";

export type LearningEvidenceOverview = {
  evidence: EvidenceProjection[];
  statistics: EducationalStatistics;
};

/** Derives confidence from the number of persisted retrieval attempts. */
const confidenceFor = (attemptCount: number): EvidenceProjection["confidence"] =>
  ["insufficient", "partial", "strong"][Math.min(attemptCount, 3) - 1] as EvidenceProjection["confidence"];

/** Classifies self-reported evidence without confirming academic mastery. */
const evidenceStateFor = (
  repeated: boolean,
  score: number,
): EvidenceProjection["state"] => {
  const stateByScore = ["developing", "consolidating", "strong-evidence"] as const;
  const scoreBand = Number(score >= 0.7) + Number(score >= 0.9);
  return repeated ? stateByScore[scoreBand] : "developing";
};

/** Explains the evidence state and its epistemic limit. */
const evidenceReasonFor = (
  state: EvidenceProjection["state"],
): string =>
  ({
    unknown: "Ainda não há evidência suficiente para produzir um sinal.",
    "strong-evidence":
      "As autoavaliações recentes apresentam evidência autorreportada consistente. Isso não confirma domínio acadêmico.",
    consolidating:
      "As autoavaliações recentes sugerem consolidação, mas o sinal é autorreportado e pode mudar com novas evidências.",
    developing:
      "As evidências autorreportadas atuais ainda merecem prática ou revisão; este sinal não confirma domínio acadêmico.",
  })[state];

/** Returns the five most recent attempts used for the current evidence signal. */
const recentAttemptsFor = (attempts: PracticeAttempt[]): PracticeAttempt[] =>
  [...attempts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

/** Calculates the mean explicit self-assessment evidence score. */
const averageEvidenceScoreFor = (attempts: PracticeAttempt[]): number =>
  attempts.reduce((total, attempt) => total + attempt.evidenceScore, 0) /
  attempts.length;

/**
 * Projects item-level self-reported retrieval evidence.
 *
 * This function deliberately does not infer or confirm academic mastery.
 */
// skipcq: complexity is intentionally bounded here; classification rules are isolated in documented helpers.
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

  const recent = recentAttemptsFor(attempts);
  const score = averageEvidenceScoreFor(recent);
  const repeated = attempts.length >= 3;
  const state = evidenceStateFor(repeated, score);

  return {
    practiceItemId: item.id,
    pageId: item.pageId,
    pageTitle: item.pageTitle,
    state,
    score,
    attemptCount: selfReportedAttempts.length,
    confidence: confidenceFor(attempts.length),
    reason: evidenceReasonFor(state),
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
  objectiveAssessmentCount = 0,
  objectiveAttemptCount = 0,
  objectiveEvidence: ObjectiveEvidenceProjection[] = [],
): EducationalStatistics {
  const selfReportedAttempts = attempts.filter(
    (attempt) => attempt.evidenceType !== "criterion-referenced",
  );
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
      selfReportedAttempts.length === 0
        ? null
        : selfReportedAttempts.filter(
            (attempt) => attempt.outcome === "strong",
          ).length / selfReportedAttempts.length,
    averageEvidenceScore:
      selfReportedAttempts.length === 0
        ? null
        : selfReportedAttempts.reduce(
            (sum, attempt) => sum + attempt.evidenceScore,
            0,
          ) / selfReportedAttempts.length,
    reviewDueCount,
    itemsWithStrongSelfReportedEvidence: evidence.filter(
      (entry) => entry.state === "strong-evidence",
    ).length,
    objectiveAssessmentCount,
    objectiveAttemptCount: objectiveAttemptCount || attempts.filter(
      (attempt) => attempt.evidenceType === "criterion-referenced",
    ).length,
    objectiveConfirmedCount: objectiveEvidence.filter(
      (entry) => entry.masteryConfirmed,
    ).length,
  };
}
