import type {
  EducationalPracticeRepository,
  PracticeAttempt,
  PracticeItem,
  PracticeOutcome,
  PracticeDifficulty,
} from "@/domains/education";
import {
  buildEducationalProfile,
  buildLearningGapSignal,
  buildReviewRecommendation,
  type EducationalProfile,
  type LearningGapSignal,
  type ReviewRecommendation,
} from "@/domains/adaptive";
import {
  buildEducationalStatistics,
  buildMasteryProjection,
  type EducationalStatistics,
  type MasteryProjection,
} from "@/domains/learning";
import { buildAttemptInput as buildEducationAttemptInput } from "@/domains/education";

export type EducationalOverview = {
  reviews: ReviewRecommendation[];
  mastery: MasteryProjection[];
  learningGaps: LearningGapSignal[];
  profile: EducationalProfile;
  statistics: EducationalStatistics;
};

export function buildEducationalOverview(
  pages: Array<{ id: string; title: string }>,
  items: PracticeItem[],
  attempts: PracticeAttempt[],
  now = new Date(),
): EducationalOverview {
  const attemptsByItem = new Map<string, PracticeAttempt[]>();

  for (const attempt of attempts) {
    const current = attemptsByItem.get(attempt.practiceItemId) ?? [];
    current.push(attempt);
    attemptsByItem.set(attempt.practiceItemId, current);
  }

  const reviews = items.map((item) =>
    buildReviewRecommendation(item, attemptsByItem.get(item.id) ?? [], now),
  );
  const mastery = items.map((item) =>
    buildMasteryProjection(item, attemptsByItem.get(item.id) ?? []),
  );
  const learningGaps = items
    .map((item) =>
      buildLearningGapSignal(item, attemptsByItem.get(item.id) ?? []),
    )
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

export async function getEducationalOverview(
  repository: EducationalPracticeRepository,
  ownerId: string,
): Promise<EducationalOverview> {
  const [pages, items, attempts] = await Promise.all([
    repository.listPages(ownerId),
    repository.listPracticeItems(ownerId),
    repository.listPracticeAttempts(ownerId),
  ]);

  return buildEducationalOverview(pages, items, attempts);
}

export async function createPractice(
  repository: EducationalPracticeRepository,
  input: {
    ownerId: string;
    pageId: string;
    prompt: string;
    referenceAnswer: string;
    explanation?: string | null;
    difficulty: PracticeDifficulty;
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
