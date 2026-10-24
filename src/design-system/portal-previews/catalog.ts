/**
 * Prototype-only page architecture, not role authorization and not live routes.
 * Each entry is a proposed information architecture pending canonical review.
 */
export const PORTAL_PREVIEW_IDS = ["professor", "tutor", "mentor", "consultoria"] as const;
export type PortalPreviewId = (typeof PORTAL_PREVIEW_IDS)[number];

export type PortalPreviewDefinition = Readonly<{
  id: PortalPreviewId;
  title: string;
  intro: string;
  sections: readonly string[];
  note: string;
}>;
export const portalPreviews: Readonly<Record<PortalPreviewId, PortalPreviewDefinition>> = {
  professor: {
    id: "professor",
    title: "Portal do Professor",
    intro: "Organização do ensino, turmas, aulas e acompanhamento pedagógico.",
    sections: ["Visão geral", "Turmas", "Aulas", "Alunos", "Conteúdos", "Atividades", "Avaliações", "Comunicação", "Relatórios", "Recursos", "Configurações"],
    note: "Acesso a turmas e alunos exige matrícula, vínculo docente e autorização em cada operação.",
  },
  tutor: {
    id: "tutor",
    title: "Portal do Tutor",
    intro: "Acompanhamento e apoio ao processo de aprendizagem.",
    sections: ["Visão geral", "Estudantes acompanhados", "Planos de apoio", "Sessões", "Exercícios", "Dúvidas", "Feedback", "Comunicação", "Relatórios"],
    note: "Vínculos de tutoria e visibilidade dos dados ainda exigem contrato de autorização.",
  },
  mentor: {
    id: "mentor",
    title: "Portal do Mentor",
    intro: "Orientação e evolução de metas de aprendizagem.",
    sections: ["Visão geral", "Mentorados", "Metas", "Planos de evolução", "Encontros", "Recomendações", "Feedback", "Mensagens", "Indicadores"],
    note: "Permissões de orientação e histórico individual precisam ser explicitamente definidas.",
  },
  consultoria: {
    id: "consultoria",
    title: "Consultoria — proposta",
    intro: "Estrutura candidata para atendimento e acompanhamento de projetos.",
    sections: ["Visão geral", "Atendimentos", "Projetos", "Entregas", "Histórico", "Preferências"],
    note: "Escopo, modelo de acesso e autorização de consultoria não estão aprovados no código.",
  },
};

export function getPortalPreview(id: PortalPreviewId): PortalPreviewDefinition {
  return portalPreviews[id];
}
