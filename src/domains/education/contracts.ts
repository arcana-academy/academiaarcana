/**
 * Contracts owned by the Education domain for native practice and retrieval.
 *
 * Educational evidence, review scheduling and adaptive signals are exposed by
 * the Learning and Adaptive domains rather than being merged into this contract.
 */

export type PracticeDifficulty = 1 | 2 | 3 | 4 | 5;
export type PracticeOutcome = "strong" | "partial" | "insufficient";
export type EvidenceConfidence = "strong" | "partial" | "insufficient";
export type ObjectiveScoringPolicy = "normalized-exact-match";
export type ObjectiveAttemptOutcome = "pass" | "fail";

export type ObjectiveAssessment = {
  id: string;
  ownerId: string;
  pageId: string;
  pageTitle: string;
  prompt: string;
  referenceAnswer: string;
  criterion: string;
  scoringPolicy: ObjectiveScoringPolicy;
  minimumEvidence: number;
  validityScope: "page";
  criterionVersion: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ObjectiveAttempt = {
  id: string;
  ownerId: string;
  assessmentId: string;
  answer: string;
  outcome: ObjectiveAttemptOutcome;
  evidenceScore: number;
  confidence: "strong";
  feedback: string;
  criterionVersion: number;
  createdAt: string;
};

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
  recordPracticeAttemptAndProgress(input: {
    ownerId: string;
    practiceItemId: string;
    answer: string;
    outcome: PracticeOutcome;
    evidenceScore: number;
    confidence: EvidenceConfidence;
    feedback: string;
  }): Promise<PracticeAttempt>;
}
