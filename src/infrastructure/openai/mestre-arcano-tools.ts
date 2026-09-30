import type { MestreArcanoContextProvider } from "@/domains/intelligence";

type ToolContext = {
  readonly context: MestreArcanoContextProvider;
};

export const MESTRE_ARCANO_TOOLS = [];

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
