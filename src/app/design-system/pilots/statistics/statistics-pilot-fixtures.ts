import type { EducationalOverview } from "@/application/education/p1";
import type { StatisticsGamificationProjection } from "@/app/estatisticas/StatisticsView";

export type StatisticsPilotScenario =
  | "no-data"
  | "mixed-evidence"
  | "objective-confirmed"
  | "review-gap"
  | "low-confidence";

export const statisticsPilotGamification: StatisticsGamificationProjection = {
  level: 4,
  levelProgressXp: 62,
  totalXp: 900,
  streakDays: 7,
  completedMissionCount: 1,
  missionCount: 2,
  progressPercent: 62,
};

const noData: EducationalOverview = {
  reviews: [],
  evidence: [],
  objectiveEvidence: [],
  learningGaps: [],
  profile: {
    practiceCoverage: {
      value: 0,
      unit: "percent",
      confidence: "insufficient",
      source: "practice history",
    },
    retrievalPerformance: {
      value: 0,
      unit: "percent",
      confidence: "insufficient",
      source: "self-assessment attempts",
    },
    reviewNeed: {
      value: 0,
      unit: "count",
      confidence: "insufficient",
      source: "review history",
    },
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

const mixedEvidence: EducationalOverview = {
  ...noData,
  evidence: [
    {
      practiceItemId: "self-item-1",
      pageId: "page-water-cycle",
      pageTitle: "Ciclo da água",
      state: "developing",
      score: 0.6,
      attemptCount: 2,
      confidence: "partial",
      reason: "As tentativas recentes ainda variam.",
      source: "self-assessment",
      masteryConfirmed: false,
    },
  ],
  objectiveEvidence: [
    {
      practiceItemId: "objective-item-1",
      pageId: "page-water-cycle",
      pageTitle: "Ciclo da água",
      state: "developing",
      score: 0.5,
      attemptCount: 1,
      passingAttemptCount: 1,
      confidence: "partial",
      source: "criterion-referenced",
      criterion: "Correspondência exata normalizada.",
      scoringPolicy: "normalized-exact-match",
      minimumEvidence: 2,
      criterionVersion: "1",
      validityScope: "practice-item",
      reason: "Uma aprovação ainda não alcança o mínimo definido.",
      masteryConfirmed: false,
    },
  ],
  profile: {
    practiceCoverage: {
      value: 40,
      unit: "percent",
      confidence: "partial",
      source: "practice history",
    },
    retrievalPerformance: {
      value: 60,
      unit: "percent",
      confidence: "partial",
      source: "self-assessment attempts",
    },
    reviewNeed: {
      value: 1,
      unit: "count",
      confidence: "partial",
      source: "review history",
    },
    sampleSize: 3,
  },
  statistics: {
    practiceItemCount: 2,
    attemptCount: 2,
    practicedPageCount: 1,
    retrievalSuccessRate: 0.5,
    averageEvidenceScore: 0.6,
    reviewDueCount: 1,
    itemsWithStrongSelfReportedEvidence: 0,
    objectiveAssessmentCount: 1,
    objectiveAttemptCount: 1,
    objectiveConfirmedCount: 0,
  },
};

const objectiveConfirmed: EducationalOverview = {
  ...noData,
  objectiveEvidence: [
    {
      practiceItemId: "objective-item-confirmed",
      pageId: "page-nebula",
      pageTitle: "Formação de nebulosas",
      state: "confirmed",
      score: 1,
      attemptCount: 2,
      passingAttemptCount: 2,
      confidence: "strong",
      source: "criterion-referenced",
      criterion: "Correspondência exata normalizada.",
      scoringPolicy: "normalized-exact-match",
      minimumEvidence: 2,
      criterionVersion: "1",
      validityScope: "practice-item",
      reason: "O critério definido foi satisfeito em tentativas suficientes.",
      masteryConfirmed: true,
    },
  ],
  profile: {
    practiceCoverage: {
      value: 30,
      unit: "percent",
      confidence: "partial",
      source: "practice history",
    },
    retrievalPerformance: {
      value: 0,
      unit: "percent",
      confidence: "insufficient",
      source: "self-assessment attempts",
    },
    reviewNeed: {
      value: 0,
      unit: "count",
      confidence: "insufficient",
      source: "review history",
    },
    sampleSize: 2,
  },
  statistics: {
    practiceItemCount: 1,
    attemptCount: 0,
    practicedPageCount: 0,
    retrievalSuccessRate: null,
    averageEvidenceScore: null,
    reviewDueCount: 0,
    itemsWithStrongSelfReportedEvidence: 0,
    objectiveAssessmentCount: 1,
    objectiveAttemptCount: 2,
    objectiveConfirmedCount: 1,
  },
};

const reviewGap: EducationalOverview = {
  ...noData,
  reviews: [
    {
      practiceItemId: "self-item-gap",
      pageId: "page-fractions",
      due: true,
      nextReviewAt: "2026-10-07T20:00:00.000Z",
      reason: "O intervalo de revisão baseado na tentativa anterior chegou.",
    },
  ],
  evidence: [
    {
      practiceItemId: "self-item-gap",
      pageId: "page-fractions",
      pageTitle: "Frações equivalentes",
      state: "developing",
      score: 0.25,
      attemptCount: 2,
      confidence: "insufficient",
      reason: "Há poucas tentativas para formar um sinal estável.",
      source: "self-assessment",
      masteryConfirmed: false,
    },
  ],
  learningGaps: [
    {
      practiceItemId: "self-item-gap",
      pageId: "page-fractions",
      pageTitle: "Frações equivalentes",
      evidence: "Duas tentativas recentes indicam dificuldade.",
      reason: "Sinal revisável, sem representar um diagnóstico.",
      actionHref: "/pratica?pagina=page-fractions&item=self-item-gap",
    },
  ],
  profile: {
    practiceCoverage: {
      value: 25,
      unit: "percent",
      confidence: "insufficient",
      source: "practice history",
    },
    retrievalPerformance: {
      value: 25,
      unit: "percent",
      confidence: "insufficient",
      source: "self-assessment attempts",
    },
    reviewNeed: {
      value: 1,
      unit: "count",
      confidence: "partial",
      source: "review history",
    },
    sampleSize: 2,
  },
  statistics: {
    practiceItemCount: 1,
    attemptCount: 2,
    practicedPageCount: 1,
    retrievalSuccessRate: 0,
    averageEvidenceScore: 0.25,
    reviewDueCount: 1,
    itemsWithStrongSelfReportedEvidence: 0,
    objectiveAssessmentCount: 0,
    objectiveAttemptCount: 0,
    objectiveConfirmedCount: 0,
  },
};

const lowConfidence: EducationalOverview = {
  ...noData,
  // Keep the single reported attempt visible as self-reported evidence.
  // Insufficient confidence is not equivalent to absent practice.
  evidence: [
    {
      practiceItemId: "self-item-low-confidence",
      pageId: "page-low-confidence",
      pageTitle: "Introdução às frações",
      state: "developing",
      score: 0.3,
      attemptCount: 1,
      confidence: "insufficient",
      reason: "Uma única autoavaliação ainda não permite concluir domínio.",
      source: "self-assessment",
      masteryConfirmed: false,
    },
  ],
  profile: {
    practiceCoverage: {
      value: 20,
      unit: "percent",
      confidence: "insufficient",
      source: "practice history",
    },
    retrievalPerformance: {
      value: 30,
      unit: "percent",
      confidence: "insufficient",
      source: "self-assessment attempts",
    },
    reviewNeed: {
      value: 0,
      unit: "count",
      confidence: "insufficient",
      source: "review history",
    },
    sampleSize: 1,
  },
  statistics: {
    ...noData.statistics,
    practiceItemCount: 1,
    attemptCount: 1,
    practicedPageCount: 1,
    averageEvidenceScore: 0.3,
  },
};

export const statisticsPilotScenarios: Record<StatisticsPilotScenario, EducationalOverview> = {
  "no-data": noData,
  "mixed-evidence": mixedEvidence,
  "objective-confirmed": objectiveConfirmed,
  "review-gap": reviewGap,
  "low-confidence": lowConfidence,
};
