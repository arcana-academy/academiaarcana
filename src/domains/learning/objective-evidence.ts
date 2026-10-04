import type { PracticeAttempt, PracticeItem } from "@/domains/education";
import type { ObjectiveEvidenceProjection } from "./contracts";

function objectiveAttemptsFor(attempts: PracticeAttempt[]): PracticeAttempt[] {
  return attempts.filter(
    (attempt) => attempt.evidenceType === "criterion-referenced",
  );
}

function stateFor(
  attempts: PracticeAttempt[],
  passingAttemptCount: number,
  minimumEvidence: number,
): ObjectiveEvidenceProjection["state"] {
  if (attempts.length === 0) return "unknown";

  const hasPass = passingAttemptCount > 0;
  const hasFail = attempts.some((attempt) => attempt.criterionResult === "fail");

  if (hasPass && hasFail) return "conflicting";
  if (passingAttemptCount >= minimumEvidence) return "confirmed";
  if (hasPass) return "developing";
  return "insufficient";
}

function reasonFor(
  state: ObjectiveEvidenceProjection["state"],
  passingAttemptCount: number,
  minimumEvidence: number,
): string {
  switch (state) {
    case "confirmed":
      return (
        "O critério foi satisfeito em " +
        passingAttemptCount +
        " tentativa(s), atingindo o mínimo objetivo de " +
        minimumEvidence +
        " para esta atividade."
      );
    case "developing":
      return (
        "Há " +
        passingAttemptCount +
        " tentativa(s) objetiva(s) aprovada(s), mas ainda não foi atingido o mínimo de " +
        minimumEvidence +
        "."
      );
    case "insufficient":
      return "As tentativas objetivas registradas não satisfizeram o critério desta atividade.";
    case "conflicting":
      return "Há evidências conflitantes que impedem uma confirmação automática.";
    default:
      return "Ainda não há evidência objetiva registrada para esta atividade.";
  }
}

/** Projects objective evidence only within the criterion-bearing practice item. */
export function buildObjectiveEvidenceProjection(
  item: PracticeItem,
  attempts: PracticeAttempt[],
): ObjectiveEvidenceProjection {
  const objectiveAttempts = objectiveAttemptsFor(attempts);
  const passingAttemptCount = objectiveAttempts.filter(
    (attempt) => attempt.criterionResult === "pass",
  ).length;
  const minimumEvidence = item.minimumEvidence ?? 2;
  const state = stateFor(
    objectiveAttempts,
    passingAttemptCount,
    minimumEvidence,
  );
  const score =
    objectiveAttempts.length === 0
      ? null
      : objectiveAttempts.reduce(
          (sum, attempt) => sum + attempt.evidenceScore,
          0,
        ) / objectiveAttempts.length;
  const criterionVersion = item.criterionVersion ?? "1";

  return {
    practiceItemId: item.id,
    pageId: item.pageId,
    pageTitle: item.pageTitle,
    state,
    score,
    attemptCount: objectiveAttempts.length,
    passingAttemptCount,
    confidence:
      objectiveAttempts.length > 0 ? "strong" : "insufficient",
    source: "criterion-referenced",
    criterion:
      item.criterion ??
      "Critério objetivo não informado para esta atividade.",
    scoringPolicy: "normalized-exact-match",
    minimumEvidence,
    criterionVersion,
    validityScope: "practice-item",
    reason: reasonFor(state, passingAttemptCount, minimumEvidence),
    masteryConfirmed: state === "confirmed",
  };
}
