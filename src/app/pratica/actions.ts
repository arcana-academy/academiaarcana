"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  buildAttemptInput,
  createObjectiveAssessment,
} from "@/application/education/p1";
import { SupabaseEducationalPracticeRepository } from "@/infrastructure/supabase/education/practice-repository";
import { StudyTaskService } from "@/application/planning/study-tasks";
import { SupabaseStudyTaskRepository } from "@/infrastructure/supabase/planning/study-task-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

/** Reads and validates a textual form field while trimming surrounding whitespace. */
function textField(formData: FormData, name: string, required = true): string {
  const value = formData.get(name);
  if (typeof value !== "string") {
    if (!required) return "";
    throw new Error(`O campo ${name} é obrigatório.`);
  }
  if (required && !value.trim()) {
    throw new Error(`O campo ${name} é obrigatório.`);
  }
  return value.trim();
}

/** Reads the bounded difficulty value accepted by the educational practice model. */
function difficultyField(formData: FormData): 1 | 2 | 3 | 4 | 5 {
  const value = Number(formData.get("difficulty") ?? 3);
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error("A dificuldade deve estar entre 1 e 5.");
  }
  return value as 1 | 2 | 3 | 4 | 5;
}

/** Creates a practice item owned by the authenticated learner and redirects to it. */
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

/** Creates a bounded criterion-referenced exact-match assessment. */
export async function createObjectiveAssessmentAction(formData: FormData) {
  const claims = await requireAuthenticatedUser();
  const pageId = textField(formData, "pageId");
  const minimumEvidence = Number(formData.get("minimumEvidence") ?? 2);

  if (
    !Number.isInteger(minimumEvidence) ||
    minimumEvidence < 1 ||
    minimumEvidence > 5
  ) {
    throw new Error("A evidência mínima deve estar entre 1 e 5 tentativas.");
  }

  const supabase = await createClient();
  const repository = new SupabaseEducationalPracticeRepository(supabase);

  const assessment = await createObjectiveAssessment(repository, {
    ownerId: claims.sub,
    pageId,
    prompt: textField(formData, "prompt"),
    referenceAnswer: textField(formData, "referenceAnswer"),
    minimumEvidence,
  });

  revalidatePath("/pratica");
  revalidatePath("/estatisticas");
  redirect(
    "/pratica?pagina=" +
      encodeURIComponent(pageId) +
      "&avaliacao=" +
      encodeURIComponent(assessment.id),
  );
}

/** Records an objective attempt; pass/fail is computed inside the database. */
export async function submitObjectiveAssessmentAction(formData: FormData) {
  const claims = await requireAuthenticatedUser();
  const assessmentId = textField(formData, "assessmentId");
  const answer = textField(formData, "answer");

  const supabase = await createClient();
  const repository = new SupabaseEducationalPracticeRepository(supabase);
  await repository.recordObjectiveAttemptAndProgress({
    ownerId: claims.sub,
    assessmentId,
    answer,
  });

  revalidatePath("/pratica");
  revalidatePath("/estatisticas");
  revalidatePath("/workspace");
  revalidatePath("/santuario");
  redirect(
    "/pratica?avaliacao=" + encodeURIComponent(assessmentId),
  );
}

/** Records an authenticated retrieval attempt and synchronizes page progress. */
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

  await repository.recordPracticeAttemptAndProgress({
    ownerId: claims.sub,
    ...attempt,
  });

  revalidatePath("/pratica");
  revalidatePath("/estatisticas");
  revalidatePath("/workspace");
  revalidatePath("/santuario");
  redirect(
    `/pratica?pagina=${encodeURIComponent(item.pageId)}&item=${encodeURIComponent(item.id)}`,
  );
}


/** Schedules a review task for an authenticated practice item. */
export async function planPracticeReviewAction(formData: FormData) {
  const claims = await requireAuthenticatedUser();
  const practiceItemId = textField(formData, "practiceItemId");
  const dueAtRaw = textField(formData, "dueAt", false);
  const title = textField(formData, "title");

  if (!dueAtRaw) {
    throw new Error("A data da revisão é obrigatória.");
  }

  const supabase = await createClient();
  const repository = new SupabaseEducationalPracticeRepository(supabase);
  const item = (await repository.listPracticeItems(claims.sub)).find(
    (candidate) => candidate.id === practiceItemId,
  );
  if (!item) throw new Error("Atividade de prática não encontrada.");

  const taskService = new StudyTaskService(new SupabaseStudyTaskRepository(supabase));
  await taskService.create({
    ownerId: claims.sub,
    title: title || `Revisar: ${item.prompt}`,
    dueAt: new Date(dueAtRaw).toISOString(),
  });

  revalidatePath("/pratica");
  revalidatePath("/cronograma");
  revalidatePath("/santuario");
  revalidatePath("/estatisticas");
};


/** Creates a deterministic criterion-referenced assessment for the authenticated learner. */
export async function createObjectiveAssessmentAction(formData: FormData) {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabaseEducationalPracticeRepository(supabase);
  const pageId = textField(formData, "pageId");
  const minimumEvidence = Number(formData.get("minimumEvidence") ?? 2);
  if (!Number.isInteger(minimumEvidence) || minimumEvidence < 1 || minimumEvidence > 10) {
    throw new Error("O mínimo de evidência deve estar entre 1 e 10.");
  }
  await createObjectiveAssessment(repository, {
    ownerId: claims.sub,
    pageId,
    prompt: textField(formData, "prompt"),
    referenceAnswer: textField(formData, "referenceAnswer"),
    minimumEvidence,
  });
  revalidatePath("/pratica");
  revalidatePath("/estatisticas");
  redirect(`/pratica?pagina=${encodeURIComponent(pageId)}`);
}

/** Records objective evidence; pass/fail and score are computed server-side. */
export async function submitObjectiveAssessmentAction(formData: FormData) {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabaseEducationalPracticeRepository(supabase);
  const assessmentId = textField(formData, "assessmentId");
  const answer = textField(formData, "answer");
  const assessments = (await repository.listObjectiveAssessments?.(claims.sub) ?? []);
  const assessment = assessments.find((entry) => entry.id === assessmentId);
  if (!assessment) throw new Error("Avaliação objetiva não encontrada.");
  await recordObjectiveAttempt(repository, {
    ownerId: claims.sub,
    assessmentId,
    answer,
  });
  revalidatePath("/pratica");
  revalidatePath("/estatisticas");
  redirect(`/pratica?pagina=${encodeURIComponent(assessment.pageId)}&objetiva=${encodeURIComponent(assessment.id)}`);
}
