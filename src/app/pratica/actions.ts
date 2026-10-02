"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { buildAttemptInput } from "@/application/education/p1";
import { SupabaseEducationalPracticeRepository } from "@/infrastructure/supabase/education/practice-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

function textField(formData: FormData, name: string, required = true): string {
  const value = formData.get(name);
  if (typeof value !== "string" || (required && !value.trim())) {
    throw new Error(`O campo ${name} é obrigatório.`);
  }
  return value.trim();
}

function difficultyField(formData: FormData): 1 | 2 | 3 | 4 | 5 {
  const value = Number(formData.get("difficulty") ?? 3);
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error("A dificuldade deve estar entre 1 e 5.");
  }
  return value as 1 | 2 | 3 | 4 | 5;
}

export async function createPracticeItemAction(formData: FormData) {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabaseEducationalPracticeRepository(supabase);

  const pageId = textField(formData, "pageId");
  const item = await repository.createPracticeItem({
    ownerId: claims.sub,
    pageId,
    prompt: textField(formData, "prompt"),
    referenceAnswer: textField(formData, "referenceAnswer"),
    explanation: textField(formData, "explanation", false) || null,
    difficulty: difficultyField(formData),
  });

  revalidatePath("/pratica");
  revalidatePath("/estatisticas");
  redirect(`/pratica?pagina=${encodeURIComponent(pageId)}&item=${encodeURIComponent(item.id)}`);
}

export async function submitPracticeAttemptAction(formData: FormData) {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabaseEducationalPracticeRepository(supabase);

  const practiceItemId = textField(formData, "practiceItemId");
  const answer = textField(formData, "answer");
  const outcome = textField(formData, "outcome") as "strong" | "partial" | "insufficient";

  if (!["strong", "partial", "insufficient"].includes(outcome)) {
    throw new Error("Resultado de recuperação inválido.");
  }

  const item = (await repository.listPracticeItems(claims.sub)).find(
    (candidate) => candidate.id === practiceItemId,
  );
  if (!item) throw new Error("Atividade de prática não encontrada.");

  const attempt = buildAttemptInput({
    practiceItemId,
    answer,
    outcome,
  });

  await repository.createPracticeAttempt({
    ownerId: claims.sub,
    ...attempt,
  });

  revalidatePath("/pratica");
  revalidatePath("/estatisticas");
  redirect(
    `/pratica?pagina=${encodeURIComponent(item.pageId)}&item=${encodeURIComponent(item.id)}`,
  );
}
