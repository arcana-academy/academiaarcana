export type ArcanaToolTrack = {
  readonly title: string;
  readonly description: string;
  readonly tools: readonly string[];
};

export const ARCANA_TOOL_TRACKS: readonly ArcanaToolTrack[] = [
  {
    title: "Construção e publicação",
    description: "Código, revisão, CI/CD e hospedagem do produto.",
    tools: ["GitHub", "Vercel", "Supabase"],
  },
  {
    title: "Design e prototipagem",
    description: "Interface, sistema visual e fluxos de produto.",
    tools: ["Figma", "Canva", "Mermaid Chart", "Product Design"],
  },
  {
    title: "Pesquisa e conhecimento",
    description: "Literatura, evidência, leitura e organização do conhecimento.",
    tools: ["Consensus", "Elicit", "SciSpace", "Scite", "Wiley Scholar Gateway", "Readwise", "Notion"],
  },
  {
    title: "Planejamento e execução",
    description: "Cronograma, tarefas, prazos e execução do estudo.",
    tools: ["Todoist", "Trello", "Microsoft Outlook Calendar"],
  },
  {
    title: "Aprendizagem e avaliação",
    description: "Cursos, exercícios, quizzes, prática e planejamento pedagógico.",
    tools: ["DataCamp", "Quizlet", "Ace Quiz Maker", "Brisk Teaching", "Course Studio", "Assessment Generator", "Learning Commons"],
  },
  {
    title: "IA e computação",
    description: "IA aberta, agentes, computação científica e workloads acelerados.",
    tools: ["Open-source AI", "NVIDIA Physical AI", "Wolfram", "Firecrawl"],
  },
  {
    title: "Criação multimídia",
    description: "Vídeo, áudio, música e apresentação de conteúdo.",
    tools: ["HeyGen", "Background Music", "Spotify"],
  },
  {
    title: "Segurança e confiança",
    description: "Proteção, revisão e operação segura do ecossistema.",
    tools: ["Malwarebytes", "Supabase RLS", "GitHub Actions"],
  },
] as const;
