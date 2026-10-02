export type AdaptiveSignal = {
  progressPercentage: number | null;
  openMissionCount: number;
  scheduledTaskCount: number;
  educationalReviewDueCount?: number;
  educationalAverageEvidence?: number | null;
  educationalLearningGapCount?: number;
};

export type AdaptiveRecommendation = {
  title: string;
  message: string;
  reason: string;
  href: string;
};

export type ReviewRecommendation = {
  practiceItemId: string;
  due: boolean;
  nextReviewAt: string | null;
  reason: string;
};

export type LearningGapSignal = {
  practiceItemId: string;
  pageId: string;
  pageTitle: string;
  evidence: string;
  reason: string;
  actionHref: string;
};

export type EducationalSignal = {
  value: number;
  unit: "percent" | "count";
  confidence: "strong" | "partial" | "insufficient";
  source: string;
};

export type EducationalProfile = {
  practiceCoverage: EducationalSignal;
  retrievalPerformance: EducationalSignal;
  reviewNeed: EducationalSignal;
  sampleSize: number;
};

function educationalRecommendation(signal: AdaptiveSignal): AdaptiveRecommendation | null {
  if ((signal.educationalReviewDueCount ?? 0) > 0) {
    return {
      title: "Revise o que já foi praticado",
      message: "Há uma revisão liberada por evidência de recuperação anterior.",
      reason:
        "A recomendação usa o histórico educacional disponível, em vez de apenas atividade ou gamificação.",
      href: "/estatisticas#review-title",
    };
  }

  if ((signal.educationalLearningGapCount ?? 0) > 0) {
    return {
      title: "Investigue um ponto difícil",
      message: "Existe um sinal de possível lacuna baseado em tentativas recentes.",
      reason: "O sinal é revisável e não representa um diagnóstico.",
      href: "/estatisticas#gaps-title",
    };
  }

  return null;
}

function operationalRecommendation(
  signal: AdaptiveSignal,
): AdaptiveRecommendation | null {
  if (signal.progressPercentage !== null && signal.progressPercentage < 25) {
    return {
      title: "Comece pequeno",
      message:
        "Escolha uma página curta e conclua apenas um passo antes de decidir o próximo.",
      reason:
        "O progresso registrado ainda está no início; reduzir o tamanho do próximo passo ajuda a manter previsibilidade.",
      href: "/workspace",
    };
  }

  if (signal.openMissionCount > 0) {
    return {
      title: "Retome uma missão",
      message:
        "Há uma missão de estudo aberta hoje. Concluir uma tarefa real pode ser seu próximo marco.",
      reason: "A recomendação prioriza um objetivo já persistido no seu contexto.",
      href: "/missoes",
    };
  }

  if (signal.scheduledTaskCount > 0) {
    return {
      title: "Siga o próximo horário",
      message:
        "Você já tem uma tarefa planejada. Use o cronograma como próximo ponto de entrada.",
      reason:
        "Existe uma atividade futura persistida e disponível para continuidade.",
      href: "/cronograma",
    };
  }

  return null;
}

/** Chooses the next learner action without treating an adaptive signal as an order. */
export function getAdaptiveRecommendation(
  signal: AdaptiveSignal,
): AdaptiveRecommendation {
  return (
    educationalRecommendation(signal) ??
    operationalRecommendation(signal) ?? {
      title: "Explore no seu ritmo",
      message:
        "Não há um próximo passo obrigatório. Escolha um conteúdo e avance no ritmo que fizer sentido.",
      reason:
        "Não há sinais suficientes para impor uma recomendação mais específica.",
      href: "/grimorios",
    }
  );
}

