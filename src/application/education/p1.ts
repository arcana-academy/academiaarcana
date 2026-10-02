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
  buildEvidenceProjection,
  buildObjectiveEvidenceProjection,
  type EducationalStatistics,
  type EvidenceProjection,
  type ObjectiveEvidenceProjection,
} from "@/domains/learning";
import { buildAttemptInput as buildEducationAttemptInput } from "@/domains/education";

export type EducationalOverview = {
  reviews: ReviewRecommendation[];
  evidence: EvidenceProjection[];
  objectiveEvidence: ObjectiveEvidenceProjection[];
  learningGaps: LearningGapSignal[];
  profile: EducationalProfile;
  statistics: EducationalStatistics;
};

/** Builds the complete educational overview from persisted evidence. */
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
  const evidence = items.map((item) =>
    buildEvidenceProjection(item, attemptsByItem.get(item.id) ?? []),
  );
  const objectiveEvidence = items.map((item) =>
    buildObjectiveEvidenceProjection(item, attemptsByItem.get(item.id) ?? []),
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
    evidence,
    objectiveEvidence,
    reviews.filter((review) => review.due).length,
  );

  return { reviews, evidence, objectiveEvidence, learningGaps, profile, statistics };
}

/** Loads educational evidence for an authenticated learner through the repository boundary. */
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

/** Creates a native retrieval-practice activity through the repository contract. */
export function createPractice(
  repository: EducationalPracticeRepository,
  input: {
    ownerId: string;
    pageId: string;
    prompt: string;
    referenceAnswer: string;
    explanation?: string | null;
    difficulty: PracticeDifficulty;
    evidenceMode?: "self_assessment" | "criterion_exact_match";
  },
) {
  return repository.createPracticeItem(input);
}

/** Converts an explicit self-assessed retrieval outcome into normalized evidence. */
export function buildAttemptInput(input: {
  answer: string;
  outcome: PracticeOutcome;
  practiceItemId: string;
}) {
  return buildEducationAttemptInput(input);
}
