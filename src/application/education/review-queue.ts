import { buildEducationalOverview } from "@/application/education/p1";
import type { PracticeAttempt, PracticeItem } from "@/domains/education";

export type ReviewQueueEntry = {
  practiceItemId: string;
  pageId: string;
  pageTitle: string;
  prompt: string;
  href: string;
  due: boolean;
  nextReviewAt: string;
  reason: string;
};

export type LearnerReviewQueue = {
  due: ReviewQueueEntry[];
  upcoming: ReviewQueueEntry[];
};

/**
 * Derives navigation-only review suggestions from existing owned, persisted evidence.
 * Never creates tasks, attempts, XP, missions, or a new source of truth.
 */
export function buildLearnerReviewQueue(
  ownerId: string,
  pages: Array<{ id: string; title: string }>,
  items: PracticeItem[],
  attempts: PracticeAttempt[],
  now = new Date(),
): LearnerReviewQueue {
  const knownPages = new Map(pages.map((page) => [page.id, page.title]));
  const ownedActiveItems = items.filter(
    (item) =>
      item.ownerId === ownerId &&
      item.active &&
      knownPages.has(item.pageId),
  );
  const validIds = new Set(ownedActiveItems.map((item) => item.id));
  const ownedAttempts = attempts.filter(
    (attempt) =>
      attempt.ownerId === ownerId &&
      validIds.has(attempt.practiceItemId),
  );
  const overview = buildEducationalOverview(
    pages,
    ownedActiveItems,
    ownedAttempts,
    now,
  );
  const recommendations = new Map(
    overview.reviews.map((review) => [review.practiceItemId, review]),
  );

  const entries: ReviewQueueEntry[] = ownedActiveItems.flatMap((item) => {
    const review = recommendations.get(item.id);
    // No recorded attempt means there is no supported review date.
    if (!review?.nextReviewAt) return [];
    const pageTitle = knownPages.get(item.pageId);
    if (!pageTitle) return [];

    const selector =
      item.evidenceMode === "criterion_exact_match" ? "avaliacao" : "item";
    return [{
      practiceItemId: item.id,
      pageId: item.pageId,
      pageTitle,
      prompt: item.prompt,
      href: `/pratica?pagina=${encodeURIComponent(item.pageId)}&${selector}=${encodeURIComponent(item.id)}`,
      due: review.due,
      nextReviewAt: review.nextReviewAt,
      reason: review.reason,
    }];
  });

  entries.sort(
    (a, b) =>
      Number(b.due) - Number(a.due) ||
      a.nextReviewAt.localeCompare(b.nextReviewAt) ||
      a.practiceItemId.localeCompare(b.practiceItemId),
  );

  return {
    due: entries.filter((entry) => entry.due),
    upcoming: entries.filter((entry) => !entry.due),
  };
}
