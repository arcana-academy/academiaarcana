import type { PracticeItem } from "@/domains/education";

export type ObjectiveEvidenceState =
  | "insufficient"
  | "developing"
  | "confirmed"
  | "conflicting";

export type ObjectiveEvidenceRecord = import("@/domains/education").ObjectiveEvidenceRepositoryRecord;


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

function normalizeCriterionText(value: string): string {
  return value
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Evaluates a deterministic required-phrases criterion without semantic inference. */
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
  const normalizedPhrases = [...new Set(
    phrases.map(normalizeCriterionText).filter(Boolean),
  )];

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
        ? "confirmed"
        : score >= 0.5
          ? "developing"
          : "insufficient",
  };
}

/** Projects the latest criterion-referenced result for the current criterion version. */
export function buildObjectiveEvidenceProjection(
  item: PracticeItem,
  evidences: ObjectiveEvidenceRecord[],
): ObjectiveEvidenceProjection {
  if (item.assessmentMode !== "criterion-referenced" || !item.criterionPhrases.length) {
    return {
      practiceItemId: item.id,
      pageId: item.pageId,
      pageTitle: item.pageTitle,
      state: "unknown",
      score: null,
      evidenceCount: 0,
      matchedCriteria: 0,
      totalCriteria: 0,
      criterionVersion: null,
      source: "criterion-referenced",
      masteryConfirmed: false,
      reason:
        "Esta atividade usa autoavaliação; ainda não existe evidência objetiva configurada.",
    };
  }

  const current = evidences
    .filter((evidence) => evidence.criterionVersion === item.criterionVersion)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const latest = current[0];
  if (!latest) {
    return {
      practiceItemId: item.id,
      pageId: item.pageId,
      pageTitle: item.pageTitle,
      state: "unknown",
      score: null,
      evidenceCount: 0,
      matchedCriteria: 0,
      totalCriteria: item.criterionPhrases.length,
      criterionVersion: item.criterionVersion,
      source: "criterion-referenced",
      masteryConfirmed: false,
      reason:
        "Os critérios objetivos estão configurados, mas ainda não há uma tentativa avaliada por eles.",
    };
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
    reason:
      latest.state === "confirmed"
        ? "Todos os critérios objetivos desta atividade foram satisfeitos nesta tentativa."
        : latest.state === "developing"
          ? "Parte dos critérios objetivos foi satisfeita; o sinal permanece em desenvolvimento."
          : latest.state === "conflicting"
            ? "As evidências objetivas relevantes estão em conflito; domínio não é confirmado automaticamente."
            : "Os critérios objetivos não foram suficientemente satisfeitos nesta tentativa.",
  };
}
