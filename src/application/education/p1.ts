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
  buildObjectiveEvidenceOverview,
  type EducationalStatistics,
  type EvidenceProjection,
  type ObjectiveEvidenceRecord,
} from "@/domains/learning";
import { buildAttemptInput as buildEducationAttemptInput } from "@/domains/education";

export type EducationalOverview = {
  reviews: ReviewRecommendation[];
  evidence: EvidenceProjection[];
  objectiveEvidence: ReturnType<typeof buildObjectiveEvidenceOverview>;
  learningGaps: LearningGapSignal[];
  profile: EducationalProfile;
  statistics: EducationalStatistics;
};

/** Builds all educational projections from persisted evidence. */
/** Builds the complete educational overview from persisted evidence. */
export function buildEducationalOverview(
  pages: Array<{ id: string; title: string }>,
  items: PracticeItem[],
  attempts: PracticeAttempt[],
  now = new Date(),
  objectiveEvidence: ObjectiveEvidenceRecord[] = [],
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
  const objectiveEvidenceProjection = buildObjectiveEvidenceOverview(
    items,
    objectiveEvidence,
  );
  const statistics = buildEducationalStatistics(
    items,
    attempts,
    evidence,
    reviews.filter((review) => review.due).length,
    objectiveEvidenceProjection,
  );

  return {
    reviews,
    evidence,
    objectiveEvidence: objectiveEvidenceProjection,
    learningGaps,
    profile,
    statistics,
  };
}

/** Loads and assembles the authenticated learner's educational overview. */
/** Loads educational evidence for an authenticated learner through the repository boundary. */
export async function getEducationalOverview(
  repository: EducationalPracticeRepository,
  ownerId: string,
): Promise<EducationalOverview> {
  const [pages, items, attempts, objectiveEvidence] = await Promise.all([
    repository.listPages(ownerId),
    repository.listPracticeItems(ownerId),
    repository.listPracticeAttempts(ownerId),
    repository.listObjectiveEvidences(ownerId),
  ]);

  return buildEducationalOverview(
    pages,
    items,
    attempts,
    new Date(),
    objectiveEvidence,
  );
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
    assessmentMode?: "self-assessment" | "criterion-referenced";
    criterionPhrases?: string[];
    criterionVersion?: number;
    minimumObjectiveAttempts?: number;
  },
) {
  return repository.createPracticeItem(input);
}

/** Converts an explicit retrieval outcome into normalized educational evidence. */
/** Converts a self-assessed recovery result into a persisted evidence input. */
export function buildAttemptInput(input: {
  answer: string;
  outcome: PracticeOutcome;
  practiceItemId: string;
}) {
  return buildEducationAttemptInput(input);
}
