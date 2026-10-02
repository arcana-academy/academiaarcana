/**
 * Contracts for the P1 educational core.
 *
 * Activity, evidence and gamification remain separate concepts. These types
 * model only observable educational practice and its derived projections.
 */

export type PracticeDifficulty = 1 | 2 | 3 | 4 | 5;
export type PracticeOutcome = "strong" | "partial" | "insufficient";
export type EvidenceConfidence = "strong" | "partial" | "insufficient";

export type PracticeItem = {
  id: string;
  ownerId: string;
  pageId: string;
  pageTitle: string;
  prompt: string;
  referenceAnswer: string;
  explanation: string | null;
  difficulty: PracticeDifficulty;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PracticeAttempt = {
  id: string;
  ownerId: string;
  practiceItemId: string;
  answer: string;
  outcome: PracticeOutcome;
  evidenceScore: number;
  confidence: EvidenceConfidence;
  feedback: string;
  createdAt: string;
};

export type ReviewRecommendation = {
  practiceItemId: string;
  due: boolean;
  nextReviewAt: string | null;
  reason: string;
};

export type MasteryProjection = {
  practiceItemId: string;
  pageId: string;
  pageTitle: string;
  state:
    | "unknown"
    | "developing"
    | "consolidating"
    | "strong-evidence";
  score: number | null;
  attemptCount: number;
  confidence: EvidenceConfidence;
  reason: string;
};

export type LearningGapSignal = {
  practiceItemId: string;
  pageId: string;
  pageTitle: string;
  evidence: string;
  reason: string;
  actionHref: string;
};

export type EducationalSignal = {
  value: number;
  unit: "percent" | "count";
  confidence: EvidenceConfidence;
  source: string;
};

export type EducationalProfile = {
  practiceCoverage: EducationalSignal;
  retrievalPerformance: EducationalSignal;
  reviewNeed: EducationalSignal;
  sampleSize: number;
};

export type EducationalStatistics = {
  practiceItemCount: number;
  attemptCount: number;
  practicedPageCount: number;
  retrievalSuccessRate: number | null;
  averageEvidenceScore: number | null;
  reviewDueCount: number;
  masteryWithStrongEvidence: number;
};

export type EducationalOverview = {
  reviews: ReviewRecommendation[];
  mastery: MasteryProjection[];
  learningGaps: LearningGapSignal[];
  profile: EducationalProfile;
  statistics: EducationalStatistics;
};

export interface EducationalPracticeRepository {
  listPages(ownerId: string): Promise<Array<{ id: string; title: string }>>;
  listPracticeItems(ownerId: string, pageId?: string): Promise<PracticeItem[]>;
  listPracticeAttempts(
    ownerId: string,
    practiceItemId?: string,
  ): Promise<PracticeAttempt[]>;
  createPracticeItem(input: {
    ownerId: string;
    pageId: string;
    prompt: string;
    referenceAnswer: string;
    explanation?: string | null;
    difficulty: PracticeDifficulty;
  }): Promise<PracticeItem>;
  createPracticeAttempt(input: {
    ownerId: string;
    practiceItemId: string;
    answer: string;
    outcome: PracticeOutcome;
    evidenceScore: number;
    confidence: EvidenceConfidence;
    feedback: string;
  }): Promise<PracticeAttempt>;
}
