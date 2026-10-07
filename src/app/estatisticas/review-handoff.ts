import type { ReviewRecommendation } from "@/domains/adaptive";

type ActivityProjection = {
  practiceItemId: string;
  pageId: string;
};

type ReviewHandoffContext = {
  evidence: ActivityProjection[];
  objectiveEvidence: ActivityProjection[];
};

/**
 * Resolves a review CTA only from authenticated educational projections.
 *
 * A review can target either a self-assessment activity or a criterion-referenced
 * activity. Ambiguous or missing context is treated as unresolved instead of
 * fabricating a page or activity selector.
 */
export function getReviewPracticeHref(
  review: Pick<ReviewRecommendation, "practiceItemId">,
  educational: ReviewHandoffContext,
): string | null {
  const selfAssessment = educational.evidence.find(
    (entry) => entry.practiceItemId === review.practiceItemId,
  );
  const objective = educational.objectiveEvidence.find(
    (entry) => entry.practiceItemId === review.practiceItemId,
  );

  if (Boolean(selfAssessment) === Boolean(objective)) {
    return null;
  }

  if (selfAssessment) {
    return (
      "/pratica?pagina=" +
      encodeURIComponent(selfAssessment.pageId) +
      "&item=" +
      encodeURIComponent(review.practiceItemId)
    );
  }

  return (
    "/pratica?pagina=" +
    encodeURIComponent(objective!.pageId) +
    "&avaliacao=" +
    encodeURIComponent(review.practiceItemId)
  );
}
