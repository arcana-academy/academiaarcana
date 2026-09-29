import type { OpenSourceAiId } from "./open-source-ai";
import { getOpenSourceAiIntegration } from "./open-source-ai";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type GatewayRequest = {
  provider: OpenSourceAiId;
  model: string;
  messages: readonly ChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

function endpointFor(provider: OpenSourceAiId) {
  const integration = getOpenSourceAiIntegration(provider);
  if (!integration?.endpointEnv) throw new Error("Provider " + provider + " não possui endpoint de inference configurável.");
  const baseUrl = process.env[integration.endpointEnv];
  if (!baseUrl) throw new Error("Integração " + provider + " não está configurada.");
  return baseUrl.replace(/\/$/, "");
}

export async function invokeOpenSourceAi(request: GatewayRequest) {
  const endpoint = endpointFor(request.provider);
  const integration = getOpenSourceAiIntegration(request.provider);
  const apiKey = integration?.apiKeyEnv ? process.env[integration.apiKeyEnv] : process.env.OPEN_SOURCE_AI_API_KEY;
  const response = await fetch(endpoint + "/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: "Bearer " + apiKey } : {}),
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens ?? 1200,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error("Open Source AI gateway error (" + response.status + "): " + detail.slice(0, 500));
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("O provider não retornou conteúdo de mensagem.");

  return { provider: request.provider, model: request.model, content };
}
