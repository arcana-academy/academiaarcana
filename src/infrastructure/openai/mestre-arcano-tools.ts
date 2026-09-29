import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getMicrosoftSharePointDocumentContext,
  type MicrosoftSharePointCredentials,
} from "@/infrastructure/integrations/microsoft-sharepoint-content";

type ToolContext = {
  readonly supabase: SupabaseClient;
  readonly ownerId: string;
  readonly microsoftSharePointCredentials: MicrosoftSharePointCredentials | null;
};

export const MESTRE_ARCANO_TOOLS = [
  {
    type: "function",
    name: "get_gamification_profile",
    description:
      "Lê o perfil de gamificação autenticado do aluno atual. Use quando a resposta depender de XP, sequência de dias ou última atividade.",
    strict: true,
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_today_missions",
    description:
      "Lê as missões do dia do aluno autenticado. Use para orientar o aluno sobre missões e progresso de missões.",
    strict: true,
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_upcoming_study_tasks",
    description:
      "Lê tarefas de estudo pendentes próximas do aluno autenticado. Pode receber apenas um limite pequeno para controlar a quantidade de dados retornados.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 10,
          description: "Quantidade máxima de tarefas a retornar.",
        },
      },
      required: ["limit"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_connected_sharepoint_sources",
    description:
      "Lista as fontes textuais de Microsoft SharePoint que o aluno autenticado conectou à Academia Arcana. Use antes de consultar um documento do SharePoint quando a pergunta depender de uma fonte conectada.",
    strict: true,
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_sharepoint_document_context",
    description:
      "Recupera o conteúdo textual de uma fonte Microsoft SharePoint conectada pelo aluno atual, validando a propriedade da fonte e buscando o arquivo novamente no Microsoft Graph. Use somente quando o aluno pedir análise, resumo, explicação ou outra tarefa baseada naquele documento.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        sourceId: {
          type: "string",
          minLength: 1,
          description: "ID da fonte persistida pela Academia Arcana.",
        },
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

async function getGamificationProfile(context: ToolContext) {
  const { data, error } = await context.supabase
    .from("gamification_profiles")
    .select("xp, streak_days, last_active_on, updated_at")
    .eq("owner_id", context.ownerId)
    .maybeSingle();

  if (error) throw new Error("Não foi possível ler o perfil de gamificação.");
  return data ?? {
    xp: 0,
    streak_days: 0,
    last_active_on: null,
    updated_at: null,
  };
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getTodayMissions(context: ToolContext) {
  const { data, error } = await context.supabase
    .from("missions")
    .select("id, code, title, reward_xp, target_date, completed_at")
    .eq("owner_id", context.ownerId)
    .eq("target_date", utcToday())
    .order("id", { ascending: true });

  if (error) throw new Error("Não foi possível ler as missões do dia.");
  return (data ?? []).map((mission) => ({
    id: mission.id,
    code: mission.code,
    title: mission.title,
    rewardXp: mission.reward_xp,
    targetDate: mission.target_date,
    completed: Boolean(mission.completed_at),
    completedAt: mission.completed_at,
  }));
}

async function getConnectedSharePointSources(context: ToolContext) {
  if (
    !context.microsoftSharePointCredentials ||
    context.microsoftSharePointCredentials.subjectId !== context.ownerId
  ) {
    return {
      connected: false,
      sources: [],
    };
  }

  const { data, error } = await context.supabase
    .from("external_document_sources")
    .select(
      "id, name, mime_type, web_url, last_modified_at, size_bytes, status",
    )
    .eq("owner_id", context.ownerId)
    .eq("provider_id", "microsoft-sharepoint")
    .eq("source_type", "external_document")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error("Não foi possível ler as fontes conectadas do SharePoint.");
  }

  return {
    connected: true,
    sources: (data ?? []).map((source) => ({
      sourceId: source.id,
      name: source.name,
      mimeType: source.mime_type,
      webUrl: source.web_url,
      lastModifiedAt: source.last_modified_at,
      sizeBytes: source.size_bytes,
      status: source.status,
    })),
  };
}

async function getSharePointDocumentContext(
  context: ToolContext,
  sourceId: string,
) {
  const credentials = context.microsoftSharePointCredentials;
  if (!credentials || credentials.subjectId !== context.ownerId) {
    throw new Error("Microsoft SharePoint não está conectado para este usuário.");
  }

  return getMicrosoftSharePointDocumentContext(sourceId, {
    supabase: context.supabase,
    ownerId: context.ownerId,
    credentials,
  });
}

async function getUpcomingStudyTasks(
  context: ToolContext,
  limit: number,
) {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 10);
  const now = new Date().toISOString();

  const { data, error } = await context.supabase
    .from("study_tasks")
    .select("id, title, due_at, status, completed_at")
    .eq("owner_id", context.ownerId)
    .eq("status", "pending")
    .or(`due_at.gte.${now},due_at.is.null`)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(safeLimit);

  if (error) throw new Error("Não foi possível ler as tarefas de estudo.");
  return data ?? [];
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
      return jsonResult(await getGamificationProfile(context));
    case "get_today_missions":
      return jsonResult(await getTodayMissions(context));
    case "get_upcoming_study_tasks":
      return jsonResult(
        await getUpcomingStudyTasks(
          context,
          typeof args.limit === "number" ? args.limit : 5,
        ),
      );
    case "get_connected_sharepoint_sources":
      return jsonResult(await getConnectedSharePointSources(context));
    case "get_sharepoint_document_context":
      if (typeof args.sourceId !== "string") {
        throw new Error("ID da fonte do SharePoint inválido.");
      }
      return jsonResult(
        await getSharePointDocumentContext(context, args.sourceId),
      );
    default:
      throw new Error("Ferramenta do Mestre Arcano não autorizada.");
  }
}
