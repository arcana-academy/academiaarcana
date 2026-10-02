/**
 * Public contracts for the learning domain.
 *
 * Educational evidence is intentionally distinguished from confirmed mastery.
 */

export type EvidenceConfidence = "strong" | "partial" | "insufficient";

export type ObjectiveEvidenceProjection = {
  assessmentId: string;
  pageId: string;
  pageTitle: string;
  state: "unknown" | "insufficient" | "developing" | "confirmed" | "conflicting";
  score: number | null;
  attemptCount: number;
  passingAttemptCount: number;
  confidence: EvidenceConfidence;
  source: "criterion-referenced";
  criterion: string;
  scoringPolicy: "normalized-exact-match";
  minimumEvidence: number;
  criterionVersion: number;
  validityScope: "page";
  reason: string;
  masteryConfirmed: boolean;
};

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
  objectiveAssessmentCount: number;
  objectiveAttemptCount: number;
  objectiveConfirmedCount: number;
};
