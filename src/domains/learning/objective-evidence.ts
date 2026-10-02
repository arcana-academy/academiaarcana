import type {
  ObjectiveAssessment,
  ObjectiveAttempt,
} from "@/domains/education";
import type { ObjectiveEvidenceProjection } from "./contracts";

function stateFor(
  attemptCount: number,
  passingAttemptCount: number,
  minimumEvidence: number,
): ObjectiveEvidenceProjection["state"] {
  if (attemptCount === 0) return "unknown";
  if (passingAttemptCount >= minimumEvidence) return "confirmed";
  if (passingAttemptCount > 0) return "developing";
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
        "."
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
      return "As tentativas registradas não satisfizeram o critério objetivo desta tarefa.";
    case "conflicting":
      return "Há evidências conflitantes que impedem uma confirmação automática.";
    default:
      return "Ainda não há evidência objetiva registrada para esta tarefa.";
  }
}

/** Projects criterion-referenced evidence only within the assessment's declared scope. */
export function buildObjectiveEvidenceProjection(
  assessment: ObjectiveAssessment,
  attempts: ObjectiveAttempt[],
): ObjectiveEvidenceProjection {
  const passingAttemptCount = attempts.filter(
    (attempt) => attempt.outcome === "pass",
  ).length;
  const state = stateFor(
    attempts.length,
    passingAttemptCount,
    assessment.minimumEvidence,
  );
  const score =
    attempts.length === 0
      ? null
      : attempts.reduce((sum, attempt) => sum + attempt.evidenceScore, 0) /
        attempts.length;

  return {
    assessmentId: assessment.id,
    pageId: assessment.pageId,
    pageTitle: assessment.pageTitle,
    state,
    score,
    attemptCount: attempts.length,
    passingAttemptCount,
    confidence: attempts.length ? "strong" : "insufficient",
    source: "criterion-referenced",
    criterion: assessment.criterion,
    scoringPolicy: assessment.scoringPolicy,
    minimumEvidence: assessment.minimumEvidence,
    criterionVersion: assessment.criterionVersion,
    validityScope: assessment.validityScope,
    reason: reasonFor(state, passingAttemptCount, assessment.minimumEvidence),
    masteryConfirmed: state === "confirmed",
  };
}
