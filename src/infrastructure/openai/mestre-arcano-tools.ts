import type { MestreArcanoContextProvider } from "@/domains/intelligence";

type ToolContext = {
  readonly context: MestreArcanoContextProvider;
};

export const MESTRE_ARCANO_TOOLS = [
  {
    type: "function",
    name: "get_gamification_profile",
    description: "Lê o perfil de gamificação autenticado do aluno atual. Use quando a resposta depender de XP, sequência de dias ou última atividade.",
    strict: true,
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "get_today_missions",
    description: "Lê as missões do dia do aluno autenticado. Use para orientar o aluno sobre missões e progresso de missões.",
    strict: true,
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "get_upcoming_study_tasks",
    description: "Lê tarefas de estudo pendentes próximas do aluno autenticado.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 10, description: "Quantidade máxima de tarefas a retornar." },
      },
      required: ["limit"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_connected_sharepoint_sources",
    description: "Lista as fontes de Microsoft SharePoint que o aluno autenticado conectou à Academia Arcana.",
    strict: true,
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "get_sharepoint_document_context",
    description: "Recupera o conteúdo textual de uma fonte Microsoft SharePoint conectada pelo aluno atual.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        sourceId: { type: "string", minLength: 1, description: "ID da fonte persistida pela Academia Arcana." },
      },
      required: ["sourceId"],
      additionalProperties: false,
    },
  },
] as const;

type ToolCall = {
  readonly name: string;
  readonly arguments: string;
};

function jsonResult(value: unknown): string {
  return JSON.stringify(value);
}

export async function executeMestreArcanoTool(
  call: ToolCall,
  context: ToolContext,
): Promise<string> {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(call.arguments) as Record<string, unknown>;
  } catch {
    throw new Error("Argumentos de ferramenta inválidos.");
  }

  switch (call.name) {
    case "get_gamification_profile":
      return jsonResult(await context.context.getGamificationProfile());
    case "get_today_missions":
      return jsonResult(await context.context.getTodayMissions());
    case "get_upcoming_study_tasks":
      return jsonResult(
        await context.context.getUpcomingStudyTasks(
          typeof args.limit === "number" ? args.limit : 5,
        ),
      );
    case "get_connected_sharepoint_sources":
      return jsonResult(await context.context.getConnectedSharePointSources());
    case "get_sharepoint_document_context":
      if (typeof args.sourceId !== "string") {
        throw new Error("ID da fonte do SharePoint inválido.");
      }
      return jsonResult(
        await context.context.getSharePointDocumentContext(args.sourceId),
      );
    default:
      throw new Error("Ferramenta do Mestre Arcano não autorizada.");
  }
}
