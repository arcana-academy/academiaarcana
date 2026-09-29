import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getMicrosoftSharePointDocumentContext,
} from "@/infrastructure/integrations/microsoft-sharepoint-content";
import type { MicrosoftSharePointCredentials } from "@/infrastructure/integrations/microsoft-sharepoint";
import {
  extractParallelWeb,
  searchParallelWeb,
} from "@/infrastructure/parallel/parallel-search";

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
      "Lista as fontes de Microsoft SharePoint que o aluno autenticado conectou à Academia Arcana. Use antes de consultar um documento do SharePoint quando a pergunta depender de uma fonte conectada.",
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
  {
    type: "function",
    name: "search_web",
    description:
      "Pesquisa a web em tempo real por fontes externas. Use quando a pergunta exigir informação atual, fonte externa ou pesquisa que não esteja disponível nos dados internos da Academia Arcana. Retorne e identifique as fontes encontradas.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        objective: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
          description: "Objetivo específico da pesquisa web.",
        },
        searchQueries: {
          type: "array",
          minItems: 1,
          maxItems: 3,
          items: {
            type: "string",
            minLength: 1,
            maxLength: 120,
          },
          description: "Até três consultas curtas e complementares.",
        },
      },
      required: ["objective", "searchQueries"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "extract_web_source",
    description:
      "Extrai conteúdo relevante de URLs HTTP(S) públicas selecionadas. Use depois de encontrar uma fonte ou quando o aluno fornecer uma URL para análise.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        urls: {
          type: "array",
          minItems: 1,
          maxItems: 5,
          items: {
            type: "string",
            minLength: 1,
            maxLength: 2048,
          },
          description: "URLs HTTP(S) públicas a serem extraídas.",
        },
        objective: {
          type: "string",
          maxLength: 1000,
          description: "Objetivo opcional para focar a extração.",
        },
        searchQueries: {
          type: "array",
          maxItems: 3,
          items: {
            type: "string",
            minLength: 1,
            maxLength: 120,
          },
          description: "Consultas opcionais usadas para focar os trechos extraídos.",
        },
      },
      required: ["urls", "objective", "searchQueries"],
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

async function searchWeb(
  args: Record<string, unknown>,
) {
  if (typeof args.objective !== "string" || !Array.isArray(args.searchQueries)) {
    throw new Error("Parâmetros de pesquisa web inválidos.");
  }

  const searchQueries = args.searchQueries.filter(
    (query): query is string => typeof query === "string",
  );

  const result = await searchParallelWeb({
    objective: args.objective,
    searchQueries,
  });

  return {
    sources: result.sources.map((source) => ({
      title: source.title,
      url: source.url,
      publishDate: source.publishDate,
      excerpts: source.excerpts,
    })),
    sessionId: result.sessionId,
  };
}

async function extractWebSource(
  args: Record<string, unknown>,
) {
  if (!Array.isArray(args.urls)) {
    throw new Error("Parâmetros de extração web inválidos.");
  }

  const urls = args.urls.filter(
    (url): url is string => typeof url === "string",
  );
  const searchQueries = Array.isArray(args.searchQueries)
    ? args.searchQueries.filter(
        (query): query is string => typeof query === "string",
      )
    : [];

  const result = await extractParallelWeb({
    urls,
    objective: typeof args.objective === "string" ? args.objective : undefined,
    searchQueries,
  });

  return {
    sources: result.sources.map((source) => ({
      title: source.title,
      url: source.url,
      publishDate: source.publishDate,
      excerpts: source.excerpts,
      fullContent: source.fullContent,
    })),
    errors: result.errors,
    sessionId: result.sessionId,
  };
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
    case "search_web":
      return jsonResult(await searchWeb(args));
    case "extract_web_source":
      return jsonResult(await extractWebSource(args));
    default:
      throw new Error("Ferramenta do Mestre Arcano não autorizada.");
  }
}
