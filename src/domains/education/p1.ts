import type {
  EducationalOverview,
  EvidenceConfidence,
  LearningGapSignal,
  MasteryProjection,
  PracticeAttempt,
  PracticeItem,
  ReviewRecommendation,
} from "./contracts";

const REVIEW_DAYS: Record<PracticeAttempt["outcome"], number> = {
  strong: 7,
  partial: 3,
  insufficient: 1,
};

function confidenceFor(attemptCount: number): EvidenceConfidence {
  if (attemptCount >= 3) return "strong";
  if (attemptCount > 0) return "partial";
  return "insufficient";
}

function masteryFor(
  item: PracticeItem,
  attempts: PracticeAttempt[],
): MasteryProjection {
  if (!attempts.length) {
    return {
      practiceItemId: item.id,
      pageId: item.pageId,
      pageTitle: item.pageTitle,
      state: "unknown",
      score: null,
      attemptCount: 0,
      confidence: "insufficient",
      reason: "Ainda não há tentativas suficientes para produzir evidência.",
    };
  }

  const recent = [...attempts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const score =
    recent.reduce((total, attempt) => total + attempt.evidenceScore, 0) /
    recent.length;
  const confidence = confidenceFor(attempts.length);

  if (attempts.length >= 3 && score >= 0.9) {
    return {
      practiceItemId: item.id,
      pageId: item.pageId,
      pageTitle: item.pageTitle,
      state: "strong-evidence",
      score,
      attemptCount: attempts.length,
      confidence,
      reason: "As tentativas recentes apresentam evidência consistente e suficiente para este item.",
    };
  }

  if (attempts.length >= 3 && score >= 0.7) {
    return {
      practiceItemId: item.id,
      pageId: item.pageId,
      pageTitle: item.pageTitle,
      state: "consolidating",
      score,
      attemptCount: attempts.length,
      confidence,
      reason: "O desempenho recente sugere consolidação, mas pode ser revisado por novas evidências.",
    };
  }

  return {
    practiceItemId: item.id,
    pageId: item.pageId,
    pageTitle: item.pageTitle,
    state: "developing",
    score,
    attemptCount: attempts.length,
    confidence,
    reason:
      attempts.length < 3
        ? "Há alguma evidência, mas a amostra ainda é pequena."
        : "As evidências atuais indicam que este conteúdo ainda merece prática ou revisão.",
  };
}

function reviewFor(
  item: PracticeItem,
  attempts: PracticeAttempt[],
  now: Date,
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

function gapFor(
  item: PracticeItem,
  attempts: PracticeAttempt[],
): LearningGapSignal | null {
  const recent = [...attempts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 2);

  if (recent.length < 2) return null;

  const average =
    recent.reduce((total, attempt) => total + attempt.evidenceScore, 0) /
    recent.length;

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

export function buildEducationalOverview(
  pages: Array<{ id: string; title: string }>,
  items: PracticeItem[],
  attempts: PracticeAttempt[],
  now = new Date(),
): EducationalOverview {
  const attemptsByItem = new Map<string, PracticeAttempt[]>();
  for (const attempt of attempts) {
    const current = attemptsByItem.get(attempt.practiceItemId) ?? [];
    current.push(attempt);
    attemptsByItem.set(attempt.practiceItemId, current);
  }

  const reviews = items.map((item) =>
    reviewFor(item, attemptsByItem.get(item.id) ?? [], now),
  );
  const mastery = items.map((item) =>
    masteryFor(item, attemptsByItem.get(item.id) ?? []),
  );
  const learningGaps = items
    .map((item) => gapFor(item, attemptsByItem.get(item.id) ?? []))
    .filter((gap): gap is LearningGapSignal => gap !== null);

  const attemptedItems = items.filter((item) =>
    (attemptsByItem.get(item.id) ?? []).length > 0,
  );
  const averageEvidenceScore =
    attempts.length > 0
      ? attempts.reduce((total, attempt) => total + attempt.evidenceScore, 0) /
        attempts.length
      : null;
  const retrievalSuccessRate =
    attempts.length > 0
      ? attempts.filter((attempt) => attempt.outcome === "strong").length /
        attempts.length
      : null;
  const uniquePages = new Set(
    attemptedItems.map((item) => item.pageId),
  ).size;

  const profile = {
    practiceCoverage: {
      value:
        pages.length === 0 ? 0 : (uniquePages / pages.length) * 100,
      unit: "percent" as const,
      confidence:
        pages.length > 0 && attempts.length >= 3 ? "strong" : "partial",
      source: "Páginas próprias com pelo menos uma tentativa registrada.",
    },
    retrievalPerformance: {
      value: (averageEvidenceScore ?? 0) * 100,
      unit: "percent" as const,
      confidence: confidenceFor(attempts.length),
      source: "Pontuação de evidência das tentativas de recuperação.",
    },
    reviewNeed: {
      value: reviews.filter((review) => review.due).length,
      unit: "count" as const,
      confidence: confidenceFor(attempts.length),
      source: "Intervalo de revisão derivado do resultado mais recente de cada item.",
    },
    sampleSize: attempts.length,
  };

  return {
    reviews,
    mastery,
    learningGaps,
    profile,
    statistics: {
      practiceItemCount: items.length,
      attemptCount: attempts.length,
      practicedPageCount: uniquePages,
      retrievalSuccessRate,
      averageEvidenceScore,
      reviewDueCount: reviews.filter((review) => review.due).length,
      masteryWithStrongEvidence: mastery.filter(
        (entry) => entry.state === "strong-evidence",
      ).length,
    },
  };
}
