import { buildEducationalOverview, type EducationalOverview } from "@/application/education/p1";
import { buildObjectiveEvidenceProjection } from "@/domains/learning";
import { buildReviewRecommendation } from "@/domains/adaptive";
import type {
  EducationalPracticeRepository,
  PracticeAttempt,
  PracticeItem,
} from "@/domains/education";

/**
 * Snapshot acumulado das atividades ATIVAS e paginas visiveis.
 * A ausencia de denominador e null, nao sucesso nem fracasso.
 * Nenhum indicador aqui afirma dominio academico global.
 */
export type PedagogicalKpis = {
  objectiveConfirmationRate: number | null; // P01
  confirmedObjectiveCount: number;
  objectiveAssessmentCount: number;
  practiceCoverageRate: number | null; // P02
  practicedPageCount: number;
  eligiblePageCount: number;
  reviewDueCount: number; // P03
  strongRetrievalRate: number | null; // P04
  meanSelfEvidenceScore: number | null; // P05
  eligibleSelfAttemptCount: number;
  objectiveConflictRate: number | null; // P06
  conflictingObjectiveCount: number;
  attemptedObjectiveCount: number;
};

export type PedagogicalSnapshot = {
  educational: EducationalOverview;
  pedagogicalKpis: PedagogicalKpis;
};

/** Returns a normalized ratio or null when there is no eligible denominator. */
function rate(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

/**
 * Calcula somente projecoes: sem escrita, analytics paralelo ou chamadas externas.
 * O historico original do EducationalOverview permanece intacto.
 */
export function buildPedagogicalKpis(
  pages: Array<{ id: string; title: string }>,
  items: PracticeItem[],
  attempts: PracticeAttempt[],
  ownerId: string,
  now = new Date(),
): PedagogicalKpis {
  const visiblePageIds = new Set(pages.map((page) => page.id));
  const activeItems = items.filter(
    (item) => item.active && item.ownerId === ownerId && visiblePageIds.has(item.pageId),
  );
  const activeById = new Map(activeItems.map((item) => [item.id, item]));
  const eligibleAttempts = attempts.filter((attempt) => {
    const item = activeById.get(attempt.practiceItemId);
    return item !== undefined && attempt.ownerId === item.ownerId;
  });
  const practicedPages = new Set<string>();
  const attemptsByItem = new Map<string, PracticeAttempt[]>();
  for (const attempt of eligibleAttempts) {
    const linkedItem = activeById.get(attempt.practiceItemId);
    if (linkedItem) practicedPages.add(linkedItem.pageId);
    const stored = attemptsByItem.get(attempt.practiceItemId) ?? [];
    stored.push(attempt);
    attemptsByItem.set(attempt.practiceItemId, stored);
  }

  // Filtrar simultaneamente o tipo de evidencia e o modo da atividade.
  const selfAttempts = eligibleAttempts.filter((attempt) => {
    const item = activeById.get(attempt.practiceItemId);
    return item?.evidenceMode !== "criterion_exact_match" &&
      attempt.evidenceType !== "criterion-referenced";
  });

  const objectiveItems = activeItems.filter(
    (item) => item.evidenceMode === "criterion_exact_match",
  );
  // Reutiliza o projetor canonico de Learning, com tentativas elegiveis por owner.
  const objectiveEvidence = objectiveItems.map((item) =>
    buildObjectiveEvidenceProjection(item, attemptsByItem.get(item.id) ?? []),
  );
  const attemptedObjective = objectiveEvidence.filter((entry) => entry.attemptCount > 0);
  const confirmedObjectiveCount = objectiveEvidence.filter((entry) =>
    entry.masteryConfirmed && entry.state === "confirmed",
  ).length;
  const conflictingObjectiveCount = attemptedObjective.filter((entry) =>
    entry.state === "conflicting",
  ).length;

  return {
    objectiveConfirmationRate: rate(confirmedObjectiveCount, objectiveItems.length),
    confirmedObjectiveCount,
    objectiveAssessmentCount: objectiveItems.length,
    practiceCoverageRate: rate(practicedPages.size, visiblePageIds.size),
    practicedPageCount: practicedPages.size,
    eligiblePageCount: visiblePageIds.size,
    reviewDueCount: activeItems.filter((item) =>
      buildReviewRecommendation(item, attemptsByItem.get(item.id) ?? [], now).due,
    ).length,
    strongRetrievalRate: rate(
      selfAttempts.filter((attempt) => attempt.outcome === "strong").length,
      selfAttempts.length,
    ),
    meanSelfEvidenceScore: selfAttempts.length === 0
      ? null
      : selfAttempts.reduce((total, attempt) => total + attempt.evidenceScore, 0) /
        selfAttempts.length,
    eligibleSelfAttemptCount: selfAttempts.length,
    objectiveConflictRate: rate(conflictingObjectiveCount, attemptedObjective.length),
    conflictingObjectiveCount,
    attemptedObjectiveCount: attemptedObjective.length,
  };
}

/**
 * Preserva as mesmas tres leituras concorrentes de getEducationalOverview.
 * A pagina autenticada fornece ownerId; o adapter e RLS aplicam o isolamento.
 */
export async function getPedagogicalSnapshot(
  repository: EducationalPracticeRepository,
  ownerId: string,
): Promise<PedagogicalSnapshot> {
  const [pages, items, attempts] = await Promise.all([
    repository.listPages(ownerId),
    repository.listPracticeItems(ownerId),
    repository.listPracticeAttempts(ownerId),
  ]);
  const now = new Date();
  const educational = buildEducationalOverview(pages, items, attempts, now);
  return {
    educational,
    pedagogicalKpis: buildPedagogicalKpis(pages, items, attempts, ownerId, now),
  };
}
