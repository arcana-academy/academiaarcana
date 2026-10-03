/** Contracts owned by Education for native practice, retrieval and bounded objective assessment. */

export type PracticeDifficulty = 1 | 2 | 3 | 4 | 5;
export type PracticeOutcome = "strong" | "partial" | "insufficient";
export type EvidenceConfidence = "strong" | "partial" | "insufficient";
export type ObjectiveScoringPolicy = "normalized-exact-match";
export type PracticeEvidenceMode =
  | "self_assessment"
  | "criterion_exact_match";
export type PracticeEvidenceType =
  | "self-assessment"
  | "criterion-referenced";
export type CriterionResult = "pass" | "fail";

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
  evidenceMode?: PracticeEvidenceMode;
  criterion?: string | null;
  criterionVersion?: string | null;
  minimumEvidence?: number;
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
  evidenceType?: PracticeEvidenceType;
  criterion?: string | null;
  criterionVersion?: string | null;
  criterionResult?: CriterionResult | null;
  criterionScope?: string | null;
  criterionReference?: string | null;
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
    evidenceMode?: PracticeEvidenceMode;
    minimumEvidence?: number;
  }): Promise<PracticeItem>;
  recordPracticeAttemptAndProgress(input: {
    ownerId: string;
    practiceItemId: string;
    answer: string;
    outcome: PracticeOutcome;
    evidenceScore: number;
    confidence: EvidenceConfidence;
    feedback: string;
  }): Promise<PracticeAttempt>;
  recordCriterionReferencedPracticeAttempt(input: {
    ownerId: string;
    practiceItemId: string;
    answer: string;
  }): Promise<PracticeAttempt>;
}
