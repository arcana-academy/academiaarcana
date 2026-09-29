export type AdaptiveSignal = {
  progressPercentage: number | null;
  openMissionCount: number;
  scheduledTaskCount: number;
};

export type AdaptiveRecommendation = {
  title: string;
  message: string;
  reason: string;
  href: string;
};

export function getAdaptiveRecommendation(signal: AdaptiveSignal): AdaptiveRecommendation {
  if (signal.progressPercentage !== null && signal.progressPercentage < 25) {
    return {
      title: "Comece pequeno",
      message: "Escolha uma página curta e conclua apenas um passo antes de decidir o próximo.",
      reason: "O progresso registrado ainda está no início; reduzir o tamanho do próximo passo ajuda a manter previsibilidade.",
      href: "/workspace",
    };
  }

  if (signal.openMissionCount > 0) {
    return {
      title: "Retome uma missão",
      message: "Há uma missão de estudo aberta hoje. Concluir uma tarefa real pode ser seu próximo marco.",
      reason: "A recomendação prioriza um objetivo já persistido no seu contexto.",
      href: "/missoes",
    };
  }

  if (signal.scheduledTaskCount > 0) {
    return {
      title: "Siga o próximo horário",
      message: "Você já tem uma tarefa planejada. Use o cronograma como próximo ponto de entrada.",
      reason: "Existe uma atividade futura persistida e disponível para continuidade.",
      href: "/cronograma",
    };
  }

  return {
    title: "Explore no seu ritmo",
    message: "Não há um próximo passo obrigatório. Escolha um conteúdo e avance no ritmo que fizer sentido.",
    reason: "Não há sinais suficientes para impor uma recomendação mais específica.",
    href: "/grimorios",
  };
}
