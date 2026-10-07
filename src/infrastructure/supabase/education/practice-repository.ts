import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  EvidenceConfidence,
  EducationalPracticeRepository,
  PracticeAttempt,
  PracticeDifficulty,
  PracticeEvidenceMode,
  PracticeItem,
  PracticeOutcome,
} from "@/domains/education";
import { NORMALIZED_EXACT_MATCH_CRITERION } from "@/domains/education";
import type { PageContent } from "@/domains/learning";

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
  evidence_mode?: PracticeEvidenceMode;
  criterion?: string | null;
  criterion_version?: string | null;
  minimum_evidence?: number;
};

export type ArchivedPageLearningHistory = {
  id: string;
  sourcePageId: string;
  archivedAt: string;
  snapshot: {
    page: { id: string; title: string; content: PageContent };
    practiceItems: Array<{
      id: string;
      prompt: string;
      reference_answer: string;
      explanation: string | null;
      attempts: Array<{
        id: string;
        answer: string;
        outcome: PracticeOutcome;
        evidence_score: number | string;
        feedback: string;
        created_at: string;
      }>;
    }>;
    pageProgress: Array<{
      status: string;
      completed_at: string | null;
      updated_at: string;
    }>;
  };
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
  evidence_type?: "self-assessment" | "criterion-referenced";
  criterion?: string | null;
  criterion_version?: string | null;
  criterion_result?: "pass" | "fail" | null;
  criterion_scope?: string | null;
  criterion_reference?: string | null;
};

/** Maps a database practice-item row into the domain contract. */
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
    evidenceMode: row.evidence_mode ?? "self_assessment",
    criterion: row.criterion ?? null,
    criterionVersion: row.criterion_version ?? null,
    minimumEvidence: row.minimum_evidence ?? 2,
  };
}

/** Maps a database practice-attempt row into the domain contract. */
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
    evidenceType: row.evidence_type ?? "self-assessment",
    criterion: row.criterion ?? null,
    criterionVersion: row.criterion_version ?? null,
    criterionResult: row.criterion_result ?? null,
    criterionScope: row.criterion_scope ?? null,
    criterionReference: row.criterion_reference ?? null,
  };
}

/** Supabase adapter for authenticated educational-practice persistence. */
export class SupabaseEducationalPracticeRepository
  implements EducationalPracticeRepository
{
  constructor(private readonly supabase: SupabaseClient) {}

  /** Lists pages visible to the authenticated owner through RLS. */
  async listPages(ownerId: string) {
    void ownerId;
    const { data, error } = await this.supabase
      .from("pages")
      .select("id, title")
      .order("title", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as PageRow[];
  }

  /** Lists active practice activities owned by the learner. */
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

  /** Lists immutable practice evidence owned by the learner. */
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

  /** Lists archived page snapshots and retained evidence for the authenticated owner. */
  async listArchivedPageHistory(ownerId: string): Promise<ArchivedPageLearningHistory[]> {
    const { data, error } = await this.supabase
      .from("archived_page_learning_history")
      .select("id, source_page_id, archived_at, snapshot")
      .eq("owner_id", ownerId)
      .order("archived_at", { ascending: false });

    if (error) throw new Error(error.message);

    return ((data ?? []) as Array<{
      id: string;
      source_page_id: string;
      archived_at: string;
      snapshot: ArchivedPageLearningHistory["snapshot"];
    }>).map((row) => ({
      id: row.id,
      sourcePageId: row.source_page_id,
      archivedAt: row.archived_at,
      snapshot: row.snapshot,
    }));
  }

  /** Creates a self-assessment or bounded objective practice item. */
  async createPracticeItem(input: {
    ownerId: string;
    pageId: string;
    prompt: string;
    referenceAnswer: string;
    explanation?: string | null;
    difficulty: PracticeDifficulty;
    evidenceMode?: PracticeEvidenceMode;
    minimumEvidence?: number;
  }) {
    const objective = input.evidenceMode === "criterion_exact_match";
    const { data, error } = await this.supabase
      .from("educational_practice_items")
      .insert({
        owner_id: input.ownerId,
        page_id: input.pageId,
        prompt: input.prompt,
        reference_answer: input.referenceAnswer,
        explanation: input.explanation ?? null,
        difficulty: input.difficulty,
        evidence_mode: objective ? "criterion_exact_match" : "self_assessment",
        criterion: objective ? NORMALIZED_EXACT_MATCH_CRITERION : null,
        criterion_version: objective ? "1" : null,
        minimum_evidence: input.minimumEvidence ?? 2,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const pages = await this.listPages(input.ownerId);
    const pageTitle = pages.find((page) => page.id === input.pageId)?.title;
    if (!pageTitle) throw new Error("Página de prática não encontrada.");

    return toItem(data as PracticeItemRow, pageTitle);
  }

  /** Records objective evidence through the existing production RPC. */
  async recordCriterionReferencedPracticeAttempt(input: {
    ownerId: string;
    practiceItemId: string;
    answer: string;
  }) {
    void input.ownerId;
    const { data, error } = await this.supabase.rpc(
      "record_criterion_referenced_practice_attempt",
      {
        p_practice_item_id: input.practiceItemId,
        p_answer: input.answer,
      },
    );

    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== "object") {
      throw new Error("Resposta inválida ao registrar a avaliação objetiva.");
    }
    return toAttempt(row as PracticeAttemptRow);
  }

  /** Records self-assessment evidence through the existing atomic RPC. */
  async recordPracticeAttemptAndProgress(input: {
    ownerId: string;
    practiceItemId: string;
    answer: string;
    outcome: PracticeOutcome;
    evidenceScore: number;
    confidence: EvidenceConfidence;
    feedback: string;
  }) {
    void input.ownerId;
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
}
