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
 * Resolves a review CTA from authenticated educational projections.
 *
 * The review's page context must agree with the projection that proves the
 * activity's evidence mode. Missing, ambiguous or inconsistent context is
 * treated as unresolved instead of fabricating a destination.
 */
export function getReviewPracticeHref(
  review: Pick<ReviewRecommendation, "practiceItemId" | "pageId">,
  educational: ReviewHandoffContext,
): string | null {
  const selfAssessment = educational.evidence.find(
    (entry) => entry.practiceItemId === review.practiceItemId,
  );
  const objective = educational.objectiveEvidence.find(
    (entry) => entry.practiceItemId === review.practiceItemId,
  );

  if (selfAssessment && objective) {
    return null;
  }

  const activity = selfAssessment ?? objective;

  if (!activity || activity.pageId !== review.pageId) {
    return null;
  }

  const selector = selfAssessment ? "item" : "avaliacao";

  return (
    "/pratica?pagina=" +
    encodeURIComponent(activity.pageId) +
    "&" +
    selector +
    "=" +
    encodeURIComponent(review.practiceItemId)
  );
}
