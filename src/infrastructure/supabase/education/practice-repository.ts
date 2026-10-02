import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  EvidenceConfidence,
  EducationalPracticeRepository,
  PracticeAttempt,
  PracticeDifficulty,
  PracticeItem,
  PracticeOutcome,
} from "@/domains/education";

type PageRow = { id: string; title: string };
type PracticeItemRow = {
  id: string;
  owner_id: string;
  page_id: string;
  prompt: string;
  reference_answer: string;
  explanation: string | null;
  difficulty: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};
type PracticeAttemptRow = {
  id: string;
  owner_id: string;
  practice_item_id: string;
  answer: string;
  outcome: PracticeOutcome;
  evidence_score: number | string;
  confidence: EvidenceConfidence;
  feedback: string;
  created_at: string;
};

function toItem(
  row: PracticeItemRow,
  pageTitle: string,
): PracticeItem {
  return {
    id: row.id,
    ownerId: row.owner_id,
    pageId: row.page_id,
    pageTitle,
    prompt: row.prompt,
    referenceAnswer: row.reference_answer,
    explanation: row.explanation,
    difficulty: row.difficulty as PracticeDifficulty,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAttempt(row: PracticeAttemptRow): PracticeAttempt {
  return {
    id: row.id,
    ownerId: row.owner_id,
    practiceItemId: row.practice_item_id,
    answer: row.answer,
    outcome: row.outcome,
    evidenceScore: Number(row.evidence_score),
    confidence: row.confidence,
    feedback: row.feedback,
    createdAt: row.created_at,
  };
}

export class SupabaseEducationalPracticeRepository
  implements EducationalPracticeRepository
{
  constructor(private readonly supabase: SupabaseClient) {}

  async listPages(ownerId: string) {
    void ownerId;
    const { data, error } = await this.supabase
      .from("pages")
      .select("id, title")
      .order("title", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as PageRow[];
  }

  async listPracticeItems(ownerId: string, pageId?: string) {
    let query = this.supabase
      .from("educational_practice_items")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (pageId) query = query.eq("page_id", pageId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as PracticeItemRow[];
    if (!rows.length) return [];

    const pages = await this.listPages(ownerId);
    const titles = new Map(pages.map((page) => [page.id, page.title]));

    return rows
      .filter((row) => titles.has(row.page_id))
      .map((row) => toItem(row, titles.get(row.page_id) ?? "Página"));
  }

  async listPracticeAttempts(ownerId: string, practiceItemId?: string) {
    let query = this.supabase
      .from("educational_practice_attempts")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true });

    if (practiceItemId) query = query.eq("practice_item_id", practiceItemId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data ?? []) as PracticeAttemptRow[]).map(toAttempt);
  }

  async createPracticeItem(input: {
    ownerId: string;
    pageId: string;
    prompt: string;
    referenceAnswer: string;
    explanation?: string | null;
    difficulty: PracticeDifficulty;
  }) {
    const { data, error } = await this.supabase
      .from("educational_practice_items")
      .insert({
        owner_id: input.ownerId,
        page_id: input.pageId,
        prompt: input.prompt,
        reference_answer: input.referenceAnswer,
        explanation: input.explanation ?? null,
        difficulty: input.difficulty,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const pages = await this.listPages(input.ownerId);
    const pageTitle = pages.find((page) => page.id === input.pageId)?.title;
    if (!pageTitle) throw new Error("Página de prática não encontrada.");

    return toItem(data as PracticeItemRow, pageTitle);
  }

  async recordPracticeAttemptAndProgress(input: {
    ownerId: string;
    practiceItemId: string;
    answer: string;
    outcome: PracticeOutcome;
    evidenceScore: number;
    confidence: EvidenceConfidence;
    feedback: string;
  }) {
    const { data, error } = await this.supabase.rpc(
      "record_educational_practice_attempt",
      {
        p_practice_item_id: input.practiceItemId,
        p_answer: input.answer,
        p_outcome: input.outcome,
        p_evidence_score: input.evidenceScore,
        p_confidence: input.confidence,
        p_feedback: input.feedback,
      },
    );

    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== "object") {
      throw new Error("Resposta inválida ao registrar a prática.");
    }
    return toAttempt(row as PracticeAttemptRow);
  }

  async createPracticeAttempt(input: {
    ownerId: string;
    practiceItemId: string;
    answer: string;
    outcome: PracticeOutcome;
    evidenceScore: number;
    confidence: EvidenceConfidence;
    feedback: string;
  }) {
    const { data, error } = await this.supabase
      .from("educational_practice_attempts")
      .insert({
        owner_id: input.ownerId,
        practice_item_id: input.practiceItemId,
        answer: input.answer,
        outcome: input.outcome,
        evidence_score: input.evidenceScore,
        confidence: input.confidence,
        feedback: input.feedback,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return toAttempt(data as PracticeAttemptRow);
  }
}
