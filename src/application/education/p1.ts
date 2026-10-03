import type {
  EducationalPracticeRepository,
  PracticeAttempt,
  PracticeItem,
  PracticeOutcome,
  PracticeDifficulty,
  ObjectiveAssessment,
  ObjectiveAttempt,
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
  objectiveAssessments: ObjectiveAssessment[];
  objectiveEvidence: ObjectiveEvidenceProjection[];
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
  objectiveAssessments: ObjectiveAssessment[] = [],
  objectiveAttempts: ObjectiveAttempt[] = [],
): EducationalOverview {
  const attemptsByItem = new Map<string, PracticeAttempt[]>();

  for (const attempt of attempts) {
    const current = attemptsByItem.get(attempt.practiceItemId) ?? [];
    current.push(attempt);
    attemptsByItem.set(attempt.practiceItemId, current);
  }

  const objectiveAttemptsByAssessment = new Map<string, ObjectiveAttempt[]>();

  for (const attempt of objectiveAttempts) {
    const current =
      objectiveAttemptsByAssessment.get(attempt.assessmentId) ?? [];
    current.push(attempt);
    objectiveAttemptsByAssessment.set(attempt.assessmentId, current);
  }

  const objectiveEvidence = objectiveAssessments.map((assessment) =>
    buildObjectiveEvidenceProjection(
      assessment,
      objectiveAttemptsByAssessment.get(assessment.id) ?? [],
    ),
  );

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
  const statistics = buildEducationalStatistics(
    items,
    attempts,
    evidence,
    reviews.filter((review) => review.due).length,
    objectiveAssessments.length,
    objectiveAttempts.length,
    objectiveEvidence,
  );

  return {
    reviews,
    evidence,
    objectiveEvidence,
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
  const [pages, items, attempts, objectiveAssessments, objectiveAttempts] =
    await Promise.all([
      repository.listPages(ownerId),
      repository.listPracticeItems(ownerId),
      repository.listPracticeAttempts(ownerId),
      repository.listObjectiveAssessments?.(ownerId) ?? [],
      repository.listObjectiveAttempts?.(ownerId) ?? [],
    ]);

  return buildEducationalOverview(
    pages,
    items,
    attempts,
    new Date(),
    objectiveAssessments,
    objectiveAttempts,
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


/** Creates a bounded criterion-referenced objective assessment. */
export function createObjectiveAssessment(
  repository: EducationalPracticeRepository,
  input: {
    ownerId: string;
    pageId: string;
    prompt: string;
    referenceAnswer: string;
    minimumEvidence: number;
  },
): Promise<ObjectiveAssessment> {
  if (!repository.createObjectiveAssessment) {
    throw new Error("Avaliação objetiva indisponível neste repositório.");
  }
  return repository.createObjectiveAssessment(input);
}

/** Records an objective attempt; the server remains the source of pass/fail. */
export function recordObjectiveAttempt(
  repository: EducationalPracticeRepository,
  input: {
    ownerId: string;
    assessmentId: string;
    answer: string;
  },
): Promise<ObjectiveAttempt> {
  if (!repository.recordObjectiveAttemptAndProgress) {
    throw new Error("Avaliação objetiva indisponível neste repositório.");
  }
  return repository.recordObjectiveAttemptAndProgress(input);
}
