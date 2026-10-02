/**
 * Public contracts for the learning domain.
 *
 * Domain behavior will be introduced incrementally.
 */

export {};

export type EvidenceConfidence = "strong" | "partial" | "insufficient";
export type MasteryProjection = {
  practiceItemId: string;
  pageId: string;
  pageTitle: string;
  state: "unknown" | "developing" | "consolidating" | "strong-evidence";
  score: number | null;
  attemptCount: number;
  confidence: EvidenceConfidence;
  reason: string;
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
