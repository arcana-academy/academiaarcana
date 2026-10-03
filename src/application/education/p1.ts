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

function isObjectiveItem(item: PracticeItem): boolean {
  return item.evidenceMode === "criterion_exact_match";
}

function selfAssessmentItems(items: PracticeItem[]): PracticeItem[] {
  return items.filter((item) => !isObjectiveItem(item));
}

/** Builds educational projections while keeping objective and self-report evidence separate. */
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

  const objectiveItems = items.filter(isObjectiveItem);
  const objectiveEvidence = objectiveItems.map((item) =>
    buildObjectiveEvidenceProjection(item, attemptsByItem.get(item.id) ?? []),
  );

  const selfItems = selfAssessmentItems(items);
  const reviews = items.map((item) =>
    buildReviewRecommendation(item, attemptsByItem.get(item.id) ?? [], now),
  );
  const evidence = selfItems.map((item) =>
    buildEvidenceProjection(item, attemptsByItem.get(item.id) ?? []),
  );
  const learningGaps = selfItems
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
    objectiveItems.length,
    objectiveEvidence.reduce(
      (total, entry) => total + entry.attemptCount,
      0,
    ),
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

/** Loads the authenticated learner's educational overview through the repository boundary. */
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

/** Creates a native self-assessment retrieval-practice activity. */
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

/** Converts an explicit self-assessed retrieval result into normalized educational evidence. */
export function buildAttemptInput(input: {
  answer: string;
  outcome: PracticeOutcome;
  practiceItemId: string;
}) {
  return buildEducationAttemptInput(input);
}

/** Creates a criterion-referenced exact-match practice item. */
export function createObjectiveAssessment(
  repository: EducationalPracticeRepository,
  input: {
    ownerId: string;
    pageId: string;
    prompt: string;
    referenceAnswer: string;
    minimumEvidence: number;
  },
): Promise<PracticeItem> {
  return repository.createPracticeItem({
    ...input,
    difficulty: 3,
    evidenceMode: "criterion_exact_match",
    minimumEvidence: input.minimumEvidence,
  });
}

/** Records an objective attempt; the server computes pass/fail. */
export function recordObjectiveAttempt(
  repository: EducationalPracticeRepository,
  input: {
    ownerId: string;
    practiceItemId: string;
    answer: string;
  },
): Promise<PracticeAttempt> {
  return repository.recordCriterionReferencedPracticeAttempt(input);
}
