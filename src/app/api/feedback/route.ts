import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createFeedback,
  FeedbackAuthenticationError,
} from "@/infrastructure/supabase/feedback-repository";

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
    const headers = { "Cache-Control": "no-store" };

    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Revise os campos do formulário." },
        { status: 400, headers },
      );
    }

    if (error instanceof FeedbackAuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401, headers },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível salvar o feedback." },
      { status: 500, headers },
    );
  }
}
