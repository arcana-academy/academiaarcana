import type {
  EducationalStatistics,
  EvidenceProjection,
  ObjectiveEvidenceProjection,
} from "./contracts";
import type { PracticeAttempt, PracticeItem } from "@/domains/education";

export type LearningEvidenceOverview = {
  evidence: EvidenceProjection[];
  objectiveEvidence: ObjectiveEvidenceProjection[];
  statistics: EducationalStatistics;
};

/** Derives confidence from the number of persisted retrieval attempts. */
const confidenceFor = (
  attemptCount: number,
): EvidenceProjection["confidence"] => {
  if (attemptCount >= 3) return "strong";
  if (attemptCount > 0) return "partial";
  return "insufficient";
};

/** Classifies self-reported evidence without confirming academic mastery. */
const evidenceStateFor = (
  repeated: boolean,
  score: number,
): EvidenceProjection["state"] => {
  const stateByScore = [
    "developing",
    "consolidating",
    "strong-evidence",
  ] as const;
  const scoreBand = Number(score >= 0.7) + Number(score >= 0.9);
  return repeated ? stateByScore[scoreBand] : "developing";
};

/** Explains the evidence state and its epistemic limit. */
const evidenceReasonFor = (
  state: EvidenceProjection["state"],
): string =>
  ({
    "strong-evidence":
      "As autoavaliações recentes apresentam evidência autorreportada consistente. Isso não confirma domínio acadêmico.",
    consolidating:
      "As autoavaliações recentes sugerem consolidação, mas o sinal é autorreportado e pode mudar com novas evidências.",
    developing:
      "As evidências autorreportadas atuais ainda merecem prática ou revisão; este sinal não confirma domínio acadêmico.",
    unknown:
      "Ainda não há autoavaliações registradas para este item.",
  })[state];

/** Returns the five most recent attempts used for a current evidence signal. */
const recentAttemptsFor = (attempts: PracticeAttempt[]): PracticeAttempt[] =>
  [...attempts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

/** Calculates the mean evidence score for a bounded recent sample. */
const averageEvidenceScoreFor = (attempts: PracticeAttempt[]): number =>
  attempts.reduce((total, attempt) => total + attempt.evidenceScore, 0) /
  attempts.length;

/** Projects item-level self-reported retrieval evidence without confirming mastery. */
export function buildEvidenceProjection(
  item: PracticeItem,
  attempts: PracticeAttempt[],
): EvidenceProjection {
  const recent = recentAttemptsFor(
    attempts.filter((attempt) => attempt.evidenceType === "self-assessment"),
  );

  if (!recent.length) {
    return {
      practiceItemId: item.id,
      pageId: item.pageId,
      pageTitle: item.pageTitle,
      state: "unknown",
      score: null,
      attemptCount: 0,
      confidence: "insufficient",
      reason: evidenceReasonFor("unknown"),
      source: "self-assessment",
      masteryConfirmed: false,
    };
  }

  const score = averageEvidenceScoreFor(recent);
  const state = evidenceStateFor(recent.length >= 3, score);

  return {
    practiceItemId: item.id,
    pageId: item.pageId,
    pageTitle: item.pageTitle,
    state,
    score,
    attemptCount: recent.length,
    confidence: confidenceFor(recent.length),
    reason: evidenceReasonFor(state),
    source: "self-assessment",
    masteryConfirmed: false,
  };
}

/** Explains a criterion-referenced evidence state without inflating its scope. */
const objectiveReasonFor = (
  state: ObjectiveEvidenceProjection["state"],
  minimumEvidence: number,
): string => {
  switch (state) {
    case "unknown":
      return "Ainda não há evidência objetiva registrada para esta atividade.";
    case "insufficient":
      return `Há evidência objetiva, mas ela ainda não atende ao mínimo de ${minimumEvidence} tentativa(s) aprovadas.`;
    case "developing":
      return "Há pelo menos uma tentativa objetiva aprovada, mas a amostra mínima para confirmação ainda não foi atingida.";
    case "confirmed":
      return "Os critérios objetivos desta atividade foram satisfeitos pela amostra mínima exigida.";
    case "conflicting":
      return "As evidências objetivas recentes entram em conflito. O domínio permanece sem confirmação automática enquanto o conflito existir.";
  }
};

/** Derives bounded objective mastery from the five most recent criterion attempts. */
export function buildObjectiveEvidenceProjection(
  item: PracticeItem,
  attempts: PracticeAttempt[],
): ObjectiveEvidenceProjection {
  if (item.evidenceMode !== "criterion_exact_match") {
    return {
      practiceItemId: item.id,
      pageId: item.pageId,
      pageTitle: item.pageTitle,
      state: "unknown",
      score: null,
      attemptCount: 0,
      passingAttemptCount: 0,
      minimumEvidence: item.minimumEvidence,
      confidence: "insufficient",
      reason:
        "Esta atividade não está configurada para produzir evidência objetiva.",
      source: "criterion-referenced",
      criterion: null,
      criterionVersion: null,
      scope: "practice-item",
      masteryConfirmed: false,
    };
  }

  const objectiveAttempts = recentAttemptsFor(
    attempts.filter(
      (attempt) => attempt.evidenceType === "criterion-referenced",
    ),
  );

  const latest = objectiveAttempts[0];
  const passingAttemptCount = objectiveAttempts.filter(
    (attempt) => attempt.criterionResult === "pass",
  ).length;
  const failingAttemptCount = objectiveAttempts.filter(
    (attempt) => attempt.criterionResult === "fail",
  ).length;
  let state: ObjectiveEvidenceProjection["state"] = "unknown";

  if (objectiveAttempts.length > 0) {
    if (passingAttemptCount >= item.minimumEvidence && failingAttemptCount === 0) {
      state = "confirmed";
    } else if (passingAttemptCount > 0 && failingAttemptCount > 0) {
      state = "conflicting";
    } else if (passingAttemptCount > 0) {
      state = "developing";
    } else {
      state = "insufficient";
    }
  }

  const score =
    objectiveAttempts.length === 0
      ? null
      : objectiveAttempts.reduce(
          (sum, attempt) => sum + attempt.evidenceScore,
          0,
        ) / objectiveAttempts.length;

  return {
    practiceItemId: item.id,
    pageId: item.pageId,
    pageTitle: item.pageTitle,
    state,
    score,
    attemptCount: objectiveAttempts.length,
    passingAttemptCount,
    minimumEvidence: item.minimumEvidence,
    confidence:
      state === "unknown"
        ? "insufficient"
        : state === "confirmed"
          ? "strong"
          : "partial",
    reason: objectiveReasonFor(state, item.minimumEvidence),
    source: "criterion-referenced",
    criterion: latest?.criterion ?? item.criterion,
    criterionVersion: latest?.criterionVersion ?? item.criterionVersion,
    scope: "practice-item",
    masteryConfirmed: state === "confirmed",
  };
}

/** Calculates learning statistics separately from gamification state. */
export function buildEducationalStatistics(
  items: PracticeItem[],
  attempts: PracticeAttempt[],
  evidence: EvidenceProjection[],
  objectiveEvidence: ObjectiveEvidenceProjection[],
  reviewDueCount: number,
): EducationalStatistics {
  const practicedItemIds = new Set(
    attempts.map((attempt) => attempt.practiceItemId),
  );
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
    itemsWithConfirmedObjectiveMastery: objectiveEvidence.filter(
      (entry) => entry.masteryConfirmed,
    ).length,
  };
}
