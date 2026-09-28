import { NextResponse } from "next/server";
import { invokeOpenSourceAi, type GatewayRequest } from "@/infrastructure/integrations/open-source-ai-gateway";
import { getOpenSourceAiIntegration, getOpenSourceAiStatus, openSourceAiIntegrations } from "@/infrastructure/integrations/open-source-ai";

export async function GET() {
  return NextResponse.json({
    integrations: openSourceAiIntegrations.map((integration) => ({
      id: integration.id,
      name: integration.name,
      product: integration.product,
      capabilities: integration.capabilities,
      runtime: integration.runtime,
      configured: getOpenSourceAiStatus(integration).configured,
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<GatewayRequest>;
    if (!body.provider || !body.model || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "provider, model e messages são obrigatórios." }, { status: 400 });
    }
    const integration = getOpenSourceAiIntegration(body.provider);
    if (!integration) return NextResponse.json({ error: "Provider não suportado." }, { status: 400 });

    const result = await invokeOpenSourceAi({
      provider: body.provider,
      model: body.model,
      messages: body.messages,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha inesperada no gateway.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
