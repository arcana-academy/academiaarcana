/**
 * Public contracts for the learning domain.
 *
 * Educational evidence is intentionally distinguished from confirmed mastery.
 */

export type EvidenceConfidence = "strong" | "partial" | "insufficient";

export type EvidenceProjection = {
  practiceItemId: string;
  pageId: string;
  pageTitle: string;
  state: "unknown" | "developing" | "consolidating" | "strong-evidence";
  score: number | null;
  attemptCount: number;
  confidence: EvidenceConfidence;
  reason: string;
  source: "self-assessment";
  masteryConfirmed: false;
};

export type EducationalStatistics = {
  practiceItemCount: number;
  attemptCount: number;
  practicedPageCount: number;
  retrievalSuccessRate: number | null;
  averageEvidenceScore: number | null;
  reviewDueCount: number;
  itemsWithStrongSelfReportedEvidence: number;
  itemsWithConfirmedObjectiveEvidence: number;
};
