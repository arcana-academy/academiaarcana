import { NextResponse } from "next/server";
import { z } from "zod";

import { createFeedback, FeedbackAuthenticationError } from "@/infrastructure/supabase/feedback-repository";

const FeedbackSchema = z.object({
  name: z.string().trim().max(120).transform((value) => value || null),
  email: z.string().trim().email().max(320),
  feedback: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = FeedbackSchema.parse(body);
    const record = await createFeedback(input);
    return NextResponse.json(
      { id: record.id, createdAt: record.createdAt },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    // Never serialize unknown error.message or storage/provider diagnostics.
    const status = error instanceof z.ZodError
      ? 400
      : error instanceof FeedbackAuthenticationError
        ? 401
        : 500;
    const message = status === 400
      ? "Revise os campos do formulário."
      : status === 401
        ? "Faça login novamente antes de enviar feedback."
        : "Não foi possível processar o feedback. O envio não está confirmado.";
    return NextResponse.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}