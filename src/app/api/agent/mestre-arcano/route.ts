import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import { runMestreArcano } from "@/infrastructure/openai/mestre-arcano";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export const dynamic = "force-dynamic";

type RequestBody = { readonly input?: unknown };

export async function POST(request: Request) {
  const claims = await requireAuthenticatedUser();

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (typeof body.input !== "string" || !body.input.trim()) {
    return NextResponse.json(
      { error: "Informe uma mensagem para o Mestre Arcano." },
      { status: 400 },
    );
  }

  if (body.input.length > 8000) {
    return NextResponse.json(
      { error: "A mensagem excede o limite permitido." },
      { status: 413 },
    );
  }

  try {
    const supabase = await createClient();
    const result = await runMestreArcano(body.input, {
      supabase,
      ownerId: claims.sub,
    });
    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha na execução do agente.";

    if (message === "OpenAI integration is not configured.") {
      return NextResponse.json(
        { error: "O Mestre Arcano ainda não está configurado no ambiente." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível executar o Mestre Arcano." },
      { status: 502 },
    );
  }
}
