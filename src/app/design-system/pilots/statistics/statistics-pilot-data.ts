import type { EducationalOverview } from "@/application/education/p1";
import type { StatisticsGamificationProjection } from "@/app/estatisticas/StatisticsView";

export type StatisticsPilotScenario =
  | "no-data"
  | "mixed"
  | "objective-confirmed"
  | "review-gap"
  | "low-confidence";

export type StatisticsPilotProjection = {
  gamification: StatisticsGamificationProjection;
  educational: EducationalOverview;
};

const gamification: StatisticsGamificationProjection = {
  level: 4,
  levelProgressXp: 40,
  totalXp: 940,
  streakDays: 6,
  completedMissionCount: 2,
  missionCount: 3,
  progressPercent: 40,
};

const noDataEducational: EducationalOverview = {
  reviews: [],
  evidence: [],
  objectiveEvidence: [],
  learningGaps: [],
  profile: {
    practiceCoverage: { value: 0, unit: "percent", confidence: "insufficient", source: "practice-history" },
    retrievalPerformance: { value: 0, unit: "percent", confidence: "insufficient", source: "retrieval-history" },
    reviewNeed: { value: 0, unit: "count", confidence: "insufficient", source: "review-history" },
    sampleSize: 0,
  },
  statistics: {
    practiceItemCount: 0,
    attemptCount: 0,
    practicedPageCount: 0,
    retrievalSuccessRate: null,
    averageEvidenceScore: null,
    reviewDueCount: 0,
    itemsWithStrongSelfReportedEvidence: 0,
    objectiveAssessmentCount: 0,
    objectiveAttemptCount: 0,
    objectiveConfirmedCount: 0,
  },
};

const mixedEducational: EducationalOverview = {
  reviews: [
    {
      practiceItemId: "self-cardio",
      pageId: "page-cardio",
      due: false,
      nextReviewAt: "2026-10-10T12:00:00.000Z",
      reason: "Revisão ainda não liberada.",
    },
    {
      practiceItemId: "objective-anatomy",
      pageId: "page-anatomy",
      due: false,
      nextReviewAt: "2026-10-11T12:00:00.000Z",
      reason: "Mais evidência objetiva ainda é necessária.",
    },
  ],
  evidence: [
    {
      practiceItemId: "self-cardio",
      pageId: "page-cardio",
      pageTitle: "Fisiologia cardiovascular",
      state: "consolidating",
      score: 0.78,
      attemptCount: 3,
      confidence: "strong",
      reason: "As autoavaliações recentes sugerem consolidação, mas o sinal continua autorreportado.",
      source: "self-assessment",
      masteryConfirmed: false,
    },
  ],
  objectiveEvidence: [
    {
      practiceItemId: "objective-anatomy",
      pageId: "page-anatomy",
      pageTitle: "Anatomia do coração",
      state: "developing",
      score: 0.5,
      attemptCount: 2,
      passingAttemptCount: 1,
      confidence: "partial",
      source: "criterion-referenced",
      criterion: "Correspondência exata normalizada.",
      scoringPolicy: "normalized-exact-match",
      minimumEvidence: 2,
      criterionVersion: "1",
      validityScope: "practice-item",
      reason: "Há evidência objetiva, mas o critério mínimo ainda não foi confirmado.",
      masteryConfirmed: false,
    },
  ],
  learningGaps: [],
  profile: {
    practiceCoverage: { value: 58, unit: "percent", confidence: "strong", source: "practice-history" },
    retrievalPerformance: { value: 72, unit: "percent", confidence: "strong", source: "retrieval-history" },
    reviewNeed: { value: 0, unit: "count", confidence: "strong", source: "review-history" },
    sampleSize: 5,
  },
  statistics: {
    practiceItemCount: 2,
    attemptCount: 3,
    practicedPageCount: 2,
    retrievalSuccessRate: 0.67,
    averageEvidenceScore: 0.78,
    reviewDueCount: 0,
    itemsWithStrongSelfReportedEvidence: 0,
    objectiveAssessmentCount: 1,
    objectiveAttemptCount: 2,
    objectiveConfirmedCount: 0,
  },
};

const objectiveConfirmedEducational: EducationalOverview = {
  ...mixedEducational,
  objectiveEvidence: [
    {
      practiceItemId: "objective-anatomy",
      pageId: "page-anatomy",
      pageTitle: "Anatomia do coração",
      state: "confirmed",
      score: 1,
      attemptCount: 3,
      passingAttemptCount: 3,
      confidence: "strong",
      source: "criterion-referenced",
      criterion: "Correspondência exata normalizada.",
      scoringPolicy: "normalized-exact-match",
      minimumEvidence: 2,
      criterionVersion: "1",
      validityScope: "practice-item",
      reason: "O critério explícito foi satisfeito pelo mínimo de evidências definido.",
      masteryConfirmed: true,
    },
  ],
  statistics: {
    ...mixedEducational.statistics,
    objectiveAttemptCount: 3,
    objectiveConfirmedCount: 1,
  },
};

const reviewGapEducational: EducationalOverview = {
  ...mixedEducational,
  reviews: [
    {
      practiceItemId: "self-cardio",
      pageId: "page-cardio",
      due: true,
      nextReviewAt: "2026-10-07T12:00:00.000Z",
      reason: "A revisão está liberada pelo histórico recente de recuperação.",
    },
  ],
  evidence: [
    {
      practiceItemId: "self-cardio",
      pageId: "page-cardio",
      pageTitle: "Fisiologia cardiovascular",
      state: "developing",
      score: 0.42,
      attemptCount: 4,
      confidence: "strong",
      reason: "As evidências autorreportadas atuais ainda merecem prática ou revisão.",
      source: "self-assessment",
      masteryConfirmed: false,
    },
  ],
  learningGaps: [
    {
      practiceItemId: "self-cardio",
      pageId: "page-cardio",
      pageTitle: "Fisiologia cardiovascular",
      evidence: "Quatro tentativas recentes apresentam sinal consistente de dificuldade.",
      reason: "O sinal é revisável e não representa diagnóstico de domínio.",
      actionHref: "/pratica?pagina=page-cardio&item=self-cardio",
    },
  ],
  statistics: {
    ...mixedEducational.statistics,
    reviewDueCount: 1,
    retrievalSuccessRate: 0.25,
    averageEvidenceScore: 0.42,
  },
  profile: {
    practiceCoverage: { value: 42, unit: "percent", confidence: "strong", source: "practice-history" },
    retrievalPerformance: { value: 25, unit: "percent", confidence: "strong", source: "retrieval-history" },
    reviewNeed: { value: 1, unit: "count", confidence: "strong", source: "review-history" },
    sampleSize: 4,
  },
};

const lowConfidenceEducational: EducationalOverview = {
  ...noDataEducational,
  profile: {
    practiceCoverage: { value: 25, unit: "percent", confidence: "insufficient", source: "practice-history" },
    retrievalPerformance: { value: 50, unit: "percent", confidence: "insufficient", source: "retrieval-history" },
    reviewNeed: { value: 0, unit: "count", confidence: "insufficient", source: "review-history" },
    sampleSize: 1,
  },
  statistics: {
    ...noDataEducational.statistics,
    practiceItemCount: 1,
    attemptCount: 1,
    practicedPageCount: 1,
    retrievalSuccessRate: 0.5,
    averageEvidenceScore: 0.5,
  },
};

export const STATISTICS_PILOT_SCENARIOS: Record<
  StatisticsPilotScenario,
  StatisticsPilotProjection
> = {
  "no-data": {
    gamification: { ...gamification, level: 1, levelProgressXp: 0, totalXp: 0, streakDays: 0, completedMissionCount: 0, missionCount: 0, progressPercent: 0 },
    educational: noDataEducational,
  },
  mixed: { gamification, educational: mixedEducational },
  "objective-confirmed": { gamification, educational: objectiveConfirmedEducational },
  "review-gap": { gamification, educational: reviewGapEducational },
  "low-confidence": { gamification, educational: lowConfidenceEducational },
};
