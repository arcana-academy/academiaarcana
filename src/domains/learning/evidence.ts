import type {
  EducationalStatistics,
  EvidenceProjection,
  ObjectiveEvidenceProjection,
  ObjectiveMasteryState,
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

const evidenceStates = [
  "developing",
  "consolidating",
  "strong-evidence",
] as const;

/** Classifies self-reported evidence without confirming academic mastery. */
const evidenceStateFor = (
  repeated: boolean,
  score: number,
): EvidenceProjection["state"] => {
  const scoreBand = Number(score >= 0.7) + Number(score >= 0.9);
  return repeated ? evidenceStates[scoreBand] : evidenceStates[0];
};

const evidenceReasons: Record<EvidenceProjection["state"], string> = {
  "strong-evidence":
    "As autoavaliações recentes apresentam evidência autorreportada consistente. Isso não confirma domínio acadêmico.",
  consolidating:
    "As autoavaliações recentes sugerem consolidação, mas o sinal é autorreportado e pode mudar com novas evidências.",
  developing:
    "As evidências autorreportadas atuais ainda merecem prática ou revisão; este sinal não confirma domínio acadêmico.",
  unknown:
    "Ainda não há autoavaliações registradas para este item.",
};

/** Explains the evidence state and its epistemic limit. */
const evidenceReasonFor = (
  state: EvidenceProjection["state"],
): string => evidenceReasons[state];

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

const objectiveReasons: Record<
  ObjectiveMasteryState,
  (minimumEvidence: number) => string
> = {
  unknown: () =>
    "Ainda não há evidência objetiva registrada para esta atividade.",
  insufficient: (minimum) =>
    `Há evidência objetiva, mas ela ainda não atende ao mínimo de ${minimum} tentativa(s) aprovadas.`,
  developing: () =>
    "Há pelo menos uma tentativa objetiva aprovada, mas a amostra mínima para confirmação ainda não foi atingida.",
  confirmed: () =>
    "Os critérios objetivos desta atividade foram satisfeitos pela amostra mínima exigida.",
  conflicting: () =>
    "As evidências objetivas recentes entram em conflito. O domínio permanece sem confirmação automática enquanto o conflito existir.",
};

/** Explains an objective evidence state without inflating its scope. */
const objectiveReasonFor = (
  state: ObjectiveMasteryState,
  minimumEvidence: number,
): string => objectiveReasons[state](minimumEvidence);

const objectiveStateRules = [
  (passing: number, failing: number, attempts: number, minimum: number) =>
    attempts === 0,
  (passing: number, failing: number, attempts: number, minimum: number) =>
    passing >= minimum && failing === 0,
  (passing: number, failing: number, attempts: number, minimum: number) =>
    passing > 0 && failing > 0,
  (passing: number, failing: number, attempts: number, minimum: number) =>
    passing > 0,
] as const;

const objectiveStates: ObjectiveMasteryState[] = [
  "unknown",
  "confirmed",
  "conflicting",
  "developing",
];

/** Derives an objective state from pass/fail evidence and the required sample size. */
const objectiveStateFor = (
  passing: number,
  failing: number,
  attemptCount: number,
  minimumEvidence: number,
): ObjectiveMasteryState => {
  const ruleIndex = objectiveStateRules.findIndex((rule) =>
    rule(passing, failing, attemptCount, minimumEvidence),
  );
  return objectiveStates[ruleIndex] ?? "insufficient";
}

const objectiveConfidences: Record<
  ObjectiveMasteryState,
  ObjectiveEvidenceProjection["confidence"]
> = {
  unknown: "insufficient",
  insufficient: "partial",
  developing: "partial",
  confirmed: "strong",
  conflicting: "partial",
};

/** Derives confidence for an objective evidence state. */
const objectiveConfidenceFor = (
  state: ObjectiveMasteryState,
): ObjectiveEvidenceProjection["confidence"] => objectiveConfidences[state];

/** Calculates the mean objective evidence score for the bounded sample. */
const objectiveScoreFor = (attempts: PracticeAttempt[]): number | null =>
  attempts.length === 0
    ? null
    : attempts.reduce((sum, attempt) => sum + attempt.evidenceScore, 0) /
      attempts.length;

/** Builds an empty projection used when objective evidence is not applicable. */
const emptyObjectiveProjection = (
  item: PracticeItem,
  reason: string,
): ObjectiveEvidenceProjection => ({
  practiceItemId: item.id,
  pageId: item.pageId,
  pageTitle: item.pageTitle,
  state: "unknown",
  score: null,
  attemptCount: 0,
  passingAttemptCount: 0,
  minimumEvidence: item.minimumEvidence,
  confidence: "insufficient",
  reason,
  source: "criterion-referenced",
  criterion: null,
  criterionVersion: null,
  scope: "practice-item",
  masteryConfirmed: false,
});

/** Counts passing and failing attempts in the bounded objective sample. */
const objectiveAttemptCounts = (
  attempts: PracticeAttempt[],
): { passing: number; failing: number } => ({
  passing: attempts.filter((attempt) => attempt.criterionResult === "pass")
    .length,
  failing: attempts.filter((attempt) => attempt.criterionResult === "fail")
    .length,
});

/** Derives bounded objective mastery from recent criterion-referenced evidence. */
export function buildObjectiveEvidenceProjection(
  item: PracticeItem,
  attempts: PracticeAttempt[],
): ObjectiveEvidenceProjection {
  if (item.evidenceMode !== "criterion_exact_match") {
    return emptyObjectiveProjection(
      item,
      "Esta atividade não está configurada para produzir evidência objetiva.",
    );
  }

  const objectiveAttempts = recentAttemptsFor(
    attempts.filter(
      (attempt) => attempt.evidenceType === "criterion-referenced",
    ),
  );
  const latest = objectiveAttempts[0];
  const counts = objectiveAttemptCounts(objectiveAttempts);
  const state = objectiveStateFor(
    counts.passing,
    counts.failing,
    objectiveAttempts.length,
    item.minimumEvidence,
  );

  return {
    practiceItemId: item.id,
    pageId: item.pageId,
    pageTitle: item.pageTitle,
    state,
    score: objectiveScoreFor(objectiveAttempts),
    attemptCount: objectiveAttempts.length,
    passingAttemptCount: counts.passing,
    minimumEvidence: item.minimumEvidence,
    confidence: objectiveConfidenceFor(state),
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
  const selfReportedAttempts = attempts.filter(
    (attempt) => attempt.evidenceType === "self-assessment",
  );
  const objectiveAttempts = attempts.filter(
    (attempt) => attempt.evidenceType === "criterion-referenced",
  );

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
    objectiveAttemptCount: objectiveAttempts.length,
    objectivePassRate:
      objectiveAttempts.length === 0
        ? null
        : objectiveAttempts.filter(
            (attempt) => attempt.criterionResult === "pass",
          ).length / objectiveAttempts.length,
    reviewDueCount,
    itemsWithStrongSelfReportedEvidence: evidence.filter(
      (entry) => entry.state === "strong-evidence",
    ).length,
    itemsWithConfirmedObjectiveMastery: objectiveEvidence.filter(
      (entry) => entry.masteryConfirmed,
    ).length,
  };
}
