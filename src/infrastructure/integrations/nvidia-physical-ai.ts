export type NvidiaPhysicalAiSkill = {
  readonly id: string;
  readonly name: string;
  readonly lane: "physical-ai" | "robotics" | "robotics-simulation";
  readonly purpose: string;
  readonly workflow: string;
  readonly catalogUrl: string;
};

export const NVIDIA_PHYSICAL_AI_SKILLS: readonly NvidiaPhysicalAiSkill[] = [
  {
    id: "isaac-mission-control-showcase",
    name: "Isaac Mission Control Showcase",
    lane: "physical-ai",
    purpose: "Explorar e demonstrar fluxos de Physical AI com controle e validação de missões.",
    workflow: "cenário → missão → validação",
    catalogUrl: "https://github.com/NVIDIA/skills/tree/main/skills/isaac-mission-control-showcase",
  },
  {
    id: "i4h-workflow-create",
    name: "i4h Workflow Create",
    lane: "robotics-simulation",
    purpose: "Criar workflows de simulação para treinamento, testes, validação e geração de dados sintéticos.",
    workflow: "workflow → cena → execução",
    catalogUrl: "https://github.com/NVIDIA/skills/tree/main/skills/i4h-workflow-create",
  },
  {
    id: "i4h-workflow-scene-edit",
    name: "i4h Workflow Scene Edit",
    lane: "robotics-simulation",
    purpose: "Editar cenas e ambientes de simulação orientados a robótica.",
    workflow: "OpenUSD → ambiente → sensores",
    catalogUrl: "https://github.com/NVIDIA/skills/tree/main/skills/i4h-workflow-scene-edit",
  },
  {
    id: "i4h-workflow-dataset-replay",
    name: "i4h Workflow Dataset Replay",
    lane: "robotics-simulation",
    purpose: "Reproduzir datasets e trajetórias em cenários simulados para análise e regressão.",
    workflow: "dataset → replay → evidência",
    catalogUrl: "https://github.com/NVIDIA/skills/tree/main/skills/i4h-workflow-dataset-replay",
  },
  {
    id: "i4h-workflow-train-rl",
    name: "i4h Workflow Train RL",
    lane: "robotics",
    purpose: "Estruturar treinamento de políticas por reinforcement learning.",
    workflow: "ambiente → RL → política",
    catalogUrl: "https://github.com/NVIDIA/skills/tree/main/skills/i4h-workflow-train-rl",
  },
  {
    id: "i4h-workflow-validate",
    name: "i4h Workflow Validate",
    lane: "robotics-simulation",
    purpose: "Validar workflows e cenários antes de levar políticas ou aplicações para hardware.",
    workflow: "execução → métricas → gate",
    catalogUrl: "https://github.com/NVIDIA/skills/tree/main/skills/i4h-workflow-validate",
  },
  {
    id: "i4h-workflow-e2e",
    name: "i4h Workflow E2E",
    lane: "robotics",
    purpose: "Orquestrar o fluxo de ponta a ponta de uma aplicação de robótica.",
    workflow: "dados → simulação → treino → validação",
    catalogUrl: "https://github.com/NVIDIA/skills/tree/main/skills/i4h-workflow-e2e",
  },
  {
    id: "omniverse-cad-to-simready",
    name: "Omniverse CAD to SimReady",
    lane: "physical-ai",
    purpose: "Preparar ativos CAD para uso consistente em pipelines de simulação.",
    workflow: "CAD → SimReady → OpenUSD",
    catalogUrl: "https://github.com/NVIDIA/skills/tree/main/skills/omniverse-cad-to-simready",
  },
  {
    id: "omniverse-usd-performance-tuning",
    name: "Omniverse USD Performance Tuning",
    lane: "physical-ai",
    purpose: "Otimizar cenas OpenUSD e workloads do ecossistema Omniverse.",
    workflow: "profiling → USD → otimização",
    catalogUrl: "https://github.com/NVIDIA/skills/tree/main/skills/omniverse-usd-performance-tuning",
  },
  {
    id: "omniverse-realtime-viewer",
    name: "Omniverse Realtime Viewer",
    lane: "physical-ai",
    purpose: "Visualizar cenas e resultados de simulação em tempo real.",
    workflow: "OpenUSD → render → inspeção",
    catalogUrl: "https://github.com/NVIDIA/skills/tree/main/skills/omniverse-realtime-viewer",
  },
  {
    id: "physical-ai-neural-reconstruction",
    name: "Physical AI Neural Reconstruction",
    lane: "physical-ai",
    purpose: "Usar reconstrução neural como parte do pipeline de construção de ambientes e dados.",
    workflow: "captura → reconstrução → simulação",
    catalogUrl: "https://github.com/NVIDIA/skills/tree/main/skills/physical-ai-neural-reconstruction",
  },
  {
    id: "physical-ai-defect-image-generation",
    name: "Physical AI Defect Image Generation",
    lane: "physical-ai",
    purpose: "Gerar imagens sintéticas de defeitos para ampliar datasets de visão industrial.",
    workflow: "assets → defeitos → dataset",
    catalogUrl: "https://github.com/NVIDIA/skills/tree/main/skills/physical-ai-defect-image-generation",
  },
  {
    id: "physical-ai-video-data-augmentation",
    name: "Physical AI Video Data Augmentation",
    lane: "physical-ai",
    purpose: "Aumentar dados de vídeo para percepção e treinamento de modelos físicos.",
    workflow: "vídeo → augment → treino",
    catalogUrl: "https://github.com/NVIDIA/skills/tree/main/skills/physical-ai-video-data-augmentation",
  },
  {
    id: "physical-ai-infrastructure-setup-and-resilient-scaling",
    name: "Physical AI Infrastructure Setup & Resilient Scaling",
    lane: "physical-ai",
    purpose: "Preparar infraestrutura escalável e resiliente para workloads de Physical AI.",
    workflow: "infra → escala → observabilidade",
    catalogUrl: "https://github.com/NVIDIA/skills/tree/main/skills/physical-ai-infrastructure-setup-and-resilient-scaling",
  },
];

export const NVIDIA_PHYSICAL_AI_TRACKS = [
  {
    title: "Construção do mundo",
    description: "Converta ativos e ambientes para um espaço simulado consistente.",
    skills: ["omniverse-cad-to-simready", "i4h-workflow-scene-edit", "physical-ai-neural-reconstruction"],
  },
  {
    title: "Simulação e dados",
    description: "Execute cenários, replay de dados e geração sintética.",
    skills: ["i4h-workflow-create", "i4h-workflow-dataset-replay", "physical-ai-defect-image-generation", "physical-ai-video-data-augmentation"],
  },
  {
    title: "Treinamento",
    description: "Treine políticas e itere sobre ambientes controlados.",
    skills: ["i4h-workflow-train-rl", "i4h-workflow-e2e"],
  },
  {
    title: "Validação",
    description: "Transforme a simulação em evidência para decisões de engenharia.",
    skills: ["i4h-workflow-validate", "isaac-mission-control-showcase"],
  },
  {
    title: "Performance e escala",
    description: "Otimize OpenUSD e escale o workload quando necessário.",
    skills: ["omniverse-usd-performance-tuning", "omniverse-realtime-viewer", "physical-ai-infrastructure-setup-and-resilient-scaling"],
  },
] as const;
