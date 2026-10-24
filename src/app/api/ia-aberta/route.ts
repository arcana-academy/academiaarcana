import { NextResponse } from "next/server";
import { invokeOpenSourceAi, type GatewayRequest } from "@/infrastructure/integrations/open-source-ai-gateway";
import { getOpenSourceAiIntegration, getOpenSourceAiStatus, openSourceAiIntegrations } from "@/infrastructure/integrations/open-source-ai";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { consumeApiRateLimit } from "@/application/security/api-rate-limit";
import { SupabaseApiRateLimitRepository } from "@/infrastructure/supabase/security/api-rate-limit-repository";
import { apiRateLimitResponse } from "@/lib/http/api-rate-limit-response";

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
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
    const body = (await request.json()) as Partial<GatewayRequest>;
    if (!body.provider || !body.model || body.model.length > 200 || !Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 20) {
      return NextResponse.json({ error: "provider, model e messages são obrigatórios." }, { status: 400 });
    }
    const integration = getOpenSourceAiIntegration(body.provider);
    if (!integration) return NextResponse.json({ error: "Provider não suportado." }, { status: 400 });

    // Metered surface: the quota is consumed right before the gateway call.
    const limitResponse = apiRateLimitResponse(
      await consumeApiRateLimit(
        new SupabaseApiRateLimitRepository(supabase),
        "open-source-ai",
      ),
    );
    if (limitResponse) return limitResponse;

    const result = await invokeOpenSourceAi({
      provider: body.provider,
      model: body.model,
      messages: body.messages.map((message) => ({ role: message.role, content: String(message.content).slice(0, 12000) })),
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha inesperada no gateway.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
