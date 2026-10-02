/**
 * Public contracts for the learning domain.
 *
 * Educational evidence is intentionally distinguished from confirmed mastery.
 */

export type EvidenceConfidence = "strong" | "partial" | "insufficient";
export type ObjectiveMasteryState =
  | "unknown"
  | "insufficient"
  | "developing"
  | "confirmed"
  | "conflicting";

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

export type ObjectiveEvidenceProjection = {
  practiceItemId: string;
  pageId: string;
  pageTitle: string;
  state: ObjectiveMasteryState;
  score: number | null;
  attemptCount: number;
  passingAttemptCount: number;
  minimumEvidence: number;
  confidence: EvidenceConfidence;
  reason: string;
  source: "criterion-referenced";
  criterion: string | null;
  criterionVersion: string | null;
  scope: "practice-item";
  masteryConfirmed: boolean;
};

export type EducationalStatistics = {
  practiceItemCount: number;
  attemptCount: number;
  practicedPageCount: number;
  retrievalSuccessRate: number | null;
  averageEvidenceScore: number | null;
  reviewDueCount: number;
  itemsWithStrongSelfReportedEvidence: number;
  itemsWithConfirmedObjectiveMastery: number;
};
