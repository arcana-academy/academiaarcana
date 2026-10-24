import { NextResponse } from "next/server";
import {
  invokeOpenSourceAi,
} from "@/infrastructure/integrations/open-source-ai-gateway";
import {
  openSourceAiIntegrations,
  getOpenSourceAiStatus,
} from "@/infrastructure/integrations/open-source-ai";
import {
  readBoundedJsonRequest,
  validateOpenSourceAiRequest,
} from "@/infrastructure/integrations/open-source-ai-request";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
    }

    const parsedBody = await readBoundedJsonRequest(request);
    if (!parsedBody.ok) {
      return NextResponse.json(
        { error: parsedBody.status === 413 ? "Solicitação excede o limite permitido." : "JSON inválido." },
        { status: parsedBody.status },
      );
    }

    const body = validateOpenSourceAiRequest(parsedBody.value);
    if (!body) {
      return NextResponse.json(
        { error: "Revise o provider, modelo, mensagens e limites solicitados." },
        { status: 400 },
      );
    }

    const result = await invokeOpenSourceAi(body);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    // Do not echo provider error bodies, endpoint details, or runtime configuration.
    return NextResponse.json(
      { error: "Não foi possível concluir a solicitação ao provider." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
