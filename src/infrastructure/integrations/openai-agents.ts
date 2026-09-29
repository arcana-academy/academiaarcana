import type { IntegrationDefinition } from "./contracts";
import {
  verifyOpenAIAgentConnection,
  type OpenAIAgentVerification,
} from "@/infrastructure/openai/mestre-arcano";

export const OPENAI_AGENTS_PROVIDER_ID = "openai-agents" as const;
export const OPENAI_AGENTS_INTEGRATION_DEFINITION = {
  id: OPENAI_AGENTS_PROVIDER_ID,
  displayName: "OpenAI Agents — Mestre Arcano",
  authMode: "api_key",
  capabilities: ["ai", "search"],
  userConnectionRequired: false,
  serverSideOnly: true,
  scopes: [],
  documentationUrl: "https://platform.openai.com/agents",
} satisfies IntegrationDefinition;

export type OpenAIAgentsRuntimeStatus =
  | "connected"
  | "not_configured"
  | "error";

export type OpenAIAgentsRuntimeSnapshot = {
  readonly providerId: typeof OPENAI_AGENTS_PROVIDER_ID;
  readonly name: string;
  readonly status: OpenAIAgentsRuntimeStatus;
  readonly executionMode: "runtime";
  readonly model: string | null;
  readonly verification: OpenAIAgentVerification | null;
};

export async function getOpenAIAgentsRuntimeSnapshot({
  verifier = verifyOpenAIAgentConnection,
}: {
  readonly verifier?: () => Promise<OpenAIAgentVerification>;
} = {}): Promise<OpenAIAgentsRuntimeSnapshot> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      providerId: OPENAI_AGENTS_PROVIDER_ID,
      name: OPENAI_AGENTS_INTEGRATION_DEFINITION.displayName,
      status: "not_configured",
      executionMode: "runtime",
      model: process.env.OPENAI_AGENT_MODEL?.trim() || null,
      verification: null,
    };
  }

  try {
    const verification = await verifier();
    return {
      providerId: OPENAI_AGENTS_PROVIDER_ID,
      name: OPENAI_AGENTS_INTEGRATION_DEFINITION.displayName,
      status: "connected",
      executionMode: "runtime",
      model: verification.model,
      verification,
    };
  } catch {
    return {
      providerId: OPENAI_AGENTS_PROVIDER_ID,
      name: OPENAI_AGENTS_INTEGRATION_DEFINITION.displayName,
      status: "error",
      executionMode: "runtime",
      model: process.env.OPENAI_AGENT_MODEL?.trim() || null,
      verification: null,
    };
  }
}
