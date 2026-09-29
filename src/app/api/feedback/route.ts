import { NextResponse } from "next/server";
import { z } from "zod";

import { createFeedback } from "@/infrastructure/supabase/feedback-repository";

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
    const message =
      error instanceof z.ZodError
        ? "Revise os campos do formulário."
        : error instanceof Error
          ? error.message
          : "Não foi possível salvar o feedback.";

    const status = message.includes("autentic") || message.includes("sessão") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}