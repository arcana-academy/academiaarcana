import type { EducationalPracticeRepository, PracticeOutcome } from "@/domains/education";
import type {
  EducationalProfile,
  LearningGapSignal,
  ReviewRecommendation,
} from "@/domains/adaptive";
import type {
  EducationalStatistics,
  MasteryProjection,
} from "@/domains/learning";
import { buildAttemptInput as buildEducationAttemptInput } from "@/domains/education/p1";
import { buildEducationalStatistics, buildMasteryProjection } from "@/domains/learning/evidence";
import {
  buildEducationalProfile,
  buildLearningGapSignal,
  buildReviewRecommendation,
} from "@/domains/adaptive";

export type EducationalOverview = {
  reviews: ReviewRecommendation[];
  mastery: MasteryProjection[];
  learningGaps: LearningGapSignal[];
  profile: EducationalProfile;
  statistics: EducationalStatistics;
};

export async function getEducationalOverview(
  repository: EducationalPracticeRepository,
  ownerId: string,
): Promise<EducationalOverview> {
  const [pages, items, attempts] = await Promise.all([
    repository.listPages(ownerId),
    repository.listPracticeItems(ownerId),
    repository.listPracticeAttempts(ownerId),
  ]);
  const attemptsByItem = new Map<string, typeof attempts>();

  for (const attempt of attempts) {
    const current = attemptsByItem.get(attempt.practiceItemId) ?? [];
    current.push(attempt);
    attemptsByItem.set(attempt.practiceItemId, current);
  }

  const reviews = items.map((item) =>
    buildReviewRecommendation(item, attemptsByItem.get(item.id) ?? []),
  );
  const mastery = items.map((item) =>
    buildMasteryProjection(item, attemptsByItem.get(item.id) ?? []),
  );
  const learningGaps = items
    .map((item) => buildLearningGapSignal(item, attemptsByItem.get(item.id) ?? []))
    .filter((gap): gap is LearningGapSignal => gap !== null);

  const profile = buildEducationalProfile(
    pages.length,
    items,
    attempts,
    reviews,
  );
  const statistics = buildEducationalStatistics(
    items,
    attempts,
    mastery,
    reviews.filter((review) => review.due).length,
  );

  return { reviews, mastery, learningGaps, profile, statistics };
}

export async function createPractice(
  repository: EducationalPracticeRepository,
  input: {
    ownerId: string;
    pageId: string;
    prompt: string;
    referenceAnswer: string;
    explanation?: string | null;
    difficulty: import("@/domains/education").PracticeDifficulty;
  },
) {
  return repository.createPracticeItem(input);
}

export function buildAttemptInput(input: {
  answer: string;
  outcome: PracticeOutcome;
  practiceItemId: string;
}) {
  return buildEducationAttemptInput(input);
}
