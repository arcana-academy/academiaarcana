import type {
  EducationalProfile,
  LearningGapSignal,
  ReviewRecommendation,
} from "./contracts";
import type { PracticeAttempt, PracticeItem } from "@/domains/education";

const REVIEW_DAYS: Record<PracticeAttempt["outcome"], number> = {
  strong: 7,
  partial: 3,
  insufficient: 1,
};

export function buildReviewRecommendation(
  item: PracticeItem,
  attempts: PracticeAttempt[],
  now = new Date(),
): ReviewRecommendation {
  const latest = [...attempts].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];

  if (!latest) {
    return {
      practiceItemId: item.id,
      due: false,
      nextReviewAt: null,
      reason: "Ainda não há evidência para programar uma revisão.",
    };
  }

  const next = new Date(latest.createdAt);
  next.setUTCDate(next.getUTCDate() + REVIEW_DAYS[latest.outcome]);
  const due = now >= next;

  return {
    practiceItemId: item.id,
    due,
    nextReviewAt: next.toISOString(),
    reason: due
      ? latest.outcome === "strong"
        ? "A revisão foi liberada pelo histórico de recuperação forte."
        : latest.outcome === "partial"
          ? "A revisão foi liberada porque a última recuperação foi parcial."
          : "A revisão foi liberada porque a última recuperação foi insuficiente."
      : "A próxima revisão considera o resultado da última recuperação e um intervalo espaçado.",
  };
}

export function buildLearningGapSignal(
  item: PracticeItem,
  attempts: PracticeAttempt[],
): LearningGapSignal | null {
  const recent = [...attempts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 2);

  if (recent.length < 2) return null;

  const average = recent.reduce((total, attempt) => total + attempt.evidenceScore, 0) / recent.length;

  if (average >= 0.6 && recent[0]?.outcome !== "insufficient") return null;

  return {
    practiceItemId: item.id,
    pageId: item.pageId,
    pageTitle: item.pageTitle,
    evidence: "Duas tentativas recentes com evidência baixa ou uma recuperação insuficiente.",
    reason:
      "Isso é um sinal para investigação/prática, não um diagnóstico ou conclusão definitiva sobre a aprendizagem.",
    actionHref: `/pratica?pagina=${encodeURIComponent(item.pageId)}&item=${encodeURIComponent(item.id)}`,
  };
}

export function buildEducationalProfile(
  pageCount: number,
  items: PracticeItem[],
  attempts: PracticeAttempt[],
  reviews: ReviewRecommendation[],
): EducationalProfile {
  const attemptedPageIds = new Set(
    items
      .filter((item) => attempts.some((attempt) => attempt.practiceItemId === item.id))
      .map((item) => item.pageId),
  );
  const averageScore =
    attempts.length === 0
      ? null
      : attempts.reduce((sum, attempt) => sum + attempt.evidenceScore, 0) / attempts.length;

  return {
    practiceCoverage: {
      value: pageCount === 0 ? 0 : (attemptedPageIds.size / pageCount) * 100,
      unit: "percent",
      confidence: attempts.length >= 3 ? "strong" : attempts.length > 0 ? "partial" : "insufficient",
      source: "Páginas próprias com pelo menos uma tentativa registrada.",
    },
    retrievalPerformance: {
      value: (averageScore ?? 0) * 100,
      unit: "percent",
      confidence: attempts.length >= 3 ? "strong" : attempts.length > 0 ? "partial" : "insufficient",
      source: "Pontuação de evidência das tentativas de recuperação.",
    },
    reviewNeed: {
      value: reviews.filter((review) => review.due).length,
      unit: "count",
      confidence: attempts.length >= 3 ? "strong" : attempts.length > 0 ? "partial" : "insufficient",
      source: "Intervalo de revisão derivado do resultado mais recente de cada item.",
    },
    sampleSize: attempts.length,
  };
}
