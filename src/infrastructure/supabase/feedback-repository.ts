import { createClient } from "@/lib/supabase/server";
import type { FeedbackInput, FeedbackRecord } from "@/domains/trust";

export async function createFeedback(input: FeedbackInput): Promise<FeedbackRecord> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error("Não foi possível validar a sessão.");
  }

  if (!user) {
    throw new Error("É necessário estar autenticado para enviar feedback.");
  }

  const { data, error } = await supabase
    .from("feedback_responses")
    .insert({
      user_id: user.id,
      name: input.name,
      email: input.email,
      feedback: input.feedback,
    })
    .select("id, user_id, name, email, feedback, created_at")
    .single();

  if (error) {
    throw new Error("Não foi possível salvar o feedback.");
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    email: data.email,
    feedback: data.feedback,
    createdAt: data.created_at,
  };
}