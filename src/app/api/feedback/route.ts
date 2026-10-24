import { NextResponse } from "next/server";
import { z } from "zod";

import { createFeedback } from "@/infrastructure/supabase/feedback-repository";
import { createClient } from "@/lib/supabase/server";
import { consumeApiRateLimit } from "@/application/security/api-rate-limit";
import { SupabaseApiRateLimitRepository } from "@/infrastructure/supabase/security/api-rate-limit-repository";
import { apiRateLimitResponse } from "@/lib/http/api-rate-limit-response";

const FeedbackSchema = z.object({
  name: z.string().trim().max(120).transform((value) => value || null),
  email: z.string().trim().email().max(320),
  feedback: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = FeedbackSchema.parse(body);

    // Cheap surface: the quota is consumed after shape validation and before
    // the insert. The limiter derives the subject from the session, so an
    // anonymous request cannot consume anyone's quota, and a limiter outage
    // stays fail-open here instead of blocking a student's report.
    const supabase = await createClient();
    const limitResponse = apiRateLimitResponse(
      await consumeApiRateLimit(
        new SupabaseApiRateLimitRepository(supabase),
        "feedback",
      ),
    );

    if (limitResponse) {
      return limitResponse;
    }

    const record = await createFeedback(input);
    return NextResponse.json(
      { id: record.id, createdAt: record.createdAt },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Revise os campos do formulário." },
        { status: 400 },
      );
    }

    // Never echo an internal message (database, limiter or driver details) to
    // the browser: only the two user-facing states are distinguished.
    const message = error instanceof Error ? error.message : "";

    if (message.includes("autenticad") || message.includes("sessão")) {
      return NextResponse.json(
        { error: "É necessário estar autenticado para enviar feedback." },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível salvar o feedback." },
      { status: 400 },
    );
  }
}
