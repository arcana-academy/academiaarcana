import type { PracticeItem } from "@/domains/education";

export type ObjectiveEvidenceState =
  | "insufficient"
  | "developing"
  | "criteria-satisfied"
  | "confirmed"
  | "conflicting";

export type ObjectiveEvidenceRecord =
  import("@/domains/education").ObjectiveEvidenceRepositoryRecord;

export type ObjectiveEvidenceProjection = {
  practiceItemId: string;
  pageId: string;
  pageTitle: string;
  state: "unknown" | ObjectiveEvidenceState;
  score: number | null;
  evidenceCount: number;
  matchedCriteria: number;
  totalCriteria: number;
  criterionVersion: number | null;
  source: "criterion-referenced";
  masteryConfirmed: boolean;
  reason: string;
};

/** Normalizes criterion text deterministically without semantic inference. */
function normalizeCriterionText(value: string): string {
  return value
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Evaluates required phrases against a learner response. */
export function evaluateRequiredPhrases(
  answer: string,
  phrases: string[],
): {
  score: number;
  matchedCriteria: number;
  totalCriteria: number;
  state: Exclude<ObjectiveEvidenceState, "conflicting">;
} {
  const normalizedAnswer = normalizeCriterionText(answer);
  const normalizedPhrases = [
    ...new Set(phrases.map(normalizeCriterionText).filter(Boolean)),
  ];

  if (!normalizedPhrases.length) {
    return {
      score: 0,
      matchedCriteria: 0,
      totalCriteria: 0,
      state: "insufficient",
    };
  }

  const paddedAnswer = ` ${normalizedAnswer} `;
  const matchedCriteria = normalizedPhrases.filter((phrase) =>
    paddedAnswer.includes(` ${phrase} `),
  ).length;
  const score = matchedCriteria / normalizedPhrases.length;

  return {
    score,
    matchedCriteria,
    totalCriteria: normalizedPhrases.length,
    state:
      score === 1
        ? "criteria-satisfied"
        : score >= 0.5
          ? "developing"
          : "insufficient",
  };
}

/** Builds the empty objective projection used when no objective result exists. */
function unknownObjectiveEvidence(
  item: PracticeItem,
  reason: string,
  criterionVersion: number | null,
  totalCriteria: number,
): ObjectiveEvidenceProjection {
  return {
    practiceItemId: item.id,
    pageId: item.pageId,
    pageTitle: item.pageTitle,
    state: "unknown",
    score: null,
    evidenceCount: 0,
    matchedCriteria: 0,
    totalCriteria,
    criterionVersion,
    source: "criterion-referenced",
    masteryConfirmed: false,
    reason,
  };
}

/** Builds learner-facing copy from an objective evidence state. */
function objectiveEvidenceReason(state: ObjectiveEvidenceState): string {
  switch (state) {
    case "confirmed":
      return "Os critérios objetivos validados desta atividade foram satisfeitos.";
    case "criteria-satisfied":
      return "Todos os critérios explícitos desta atividade foram atendidos. Isso é evidência objetiva de desempenho nesta tarefa, mas não confirma domínio acadêmico por si só.";
    case "developing":
      return "Parte dos critérios objetivos foi satisfeita; o sinal permanece em desenvolvimento.";
    case "conflicting":
      return "As evidências objetivas relevantes estão em conflito; domínio não é confirmado automaticamente.";
    default:
      return "Os critérios objetivos não foram suficientemente satisfeitos nesta tentativa.";
  }
}

/** Projects the latest criterion-referenced result for the current criterion version. */
export function buildObjectiveEvidenceProjection(
  item: PracticeItem,
  evidences: ObjectiveEvidenceRecord[],
): ObjectiveEvidenceProjection {
  const criteria = item.criterionPhrases;

  if (item.assessmentMode !== "criterion-referenced" || criteria.length === 0) {
    return unknownObjectiveEvidence(
      item,
      "Esta atividade usa autoavaliação; ainda não existe evidência objetiva configurada.",
      null,
      0,
    );
  }

  const current = evidences
    .filter((evidence) => evidence.criterionVersion === item.criterionVersion)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const latest = current[0];
  if (!latest) {
    return unknownObjectiveEvidence(
      item,
      "Os critérios objetivos estão configurados, mas ainda não há uma tentativa avaliada por eles.",
      item.criterionVersion,
      criteria.length,
    );
  }

  return {
    practiceItemId: item.id,
    pageId: item.pageId,
    pageTitle: item.pageTitle,
    state: latest.state,
    score: latest.score,
    evidenceCount: current.length,
    matchedCriteria: latest.matchedCriteria,
    totalCriteria: latest.totalCriteria,
    criterionVersion: latest.criterionVersion,
    source: "criterion-referenced",
    masteryConfirmed: latest.state === "confirmed",
    reason: objectiveEvidenceReason(latest.state),
  };
}
