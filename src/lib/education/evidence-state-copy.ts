import type {
  EvidenceConfidence,
  EvidenceProjection,
  ObjectiveEvidenceProjection,
} from "@/domains/learning";
import type { PracticeOutcome } from "@/domains/education";

/** Maps internal objective-evidence states to learner-facing semantic labels. */
export function objectiveEvidenceStateLabel(
  state: ObjectiveEvidenceProjection["state"],
): string {
  switch (state) {
    case "confirmed":
      return "Confirmado";
    case "conflicting":
      return "Conflitante";
    case "unknown":
      return "Não avaliado";
    case "insufficient":
    case "developing":
      return "Não confirmado";
  }
}

/** Maps internal self-reported evidence states without implying mastery. */
export function selfAssessmentEvidenceStateLabel(
  state: EvidenceProjection["state"],
): string {
  switch (state) {
    case "unknown":
      return "Não avaliado";
    case "developing":
      return "Autoavaliação em desenvolvimento";
    case "consolidating":
      return "Autoavaliação em consolidação";
    case "strong-evidence":
      return "Autoavaliação forte";
  }
}

/** Maps internal retrieval outcomes to concise learner-facing copy. */
export function practiceOutcomeLabel(outcome: PracticeOutcome): string {
  switch (outcome) {
    case "strong":
      return "Forte";
    case "partial":
      return "Parcial";
    case "insufficient":
      return "Insuficiente";
  }
}

/** Maps evidence-confidence codes without implying educational mastery. */
export function evidenceConfidenceLabel(confidence: EvidenceConfidence): string {
  switch (confidence) {
    case "strong":
      return "Alta";
    case "partial":
      return "Parcial";
    case "insufficient":
      return "Insuficiente";
  }
}
