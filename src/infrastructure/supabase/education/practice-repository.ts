import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  EvidenceConfidence,
  EducationalPracticeRepository,
  ObjectiveAssessment,
  ObjectiveAttempt,
  PracticeAttempt,
  PracticeDifficulty,
  PracticeItem,
  PracticeOutcome,
} from "@/domains/education";
import { NORMALIZED_EXACT_MATCH_CRITERION } from "@/domains/education";

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
type ObjectiveAssessmentRow = {
  id: string;
  owner_id: string;
  page_id: string;
  prompt: string;
  reference_answer: string;
  criterion: string;
  scoring_policy: "normalized-exact-match";
  minimum_evidence: number;
  validity_scope: "page";
  criterion_version: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};
type ObjectiveAttemptRow = {
  id: string;
  owner_id: string;
  assessment_id: string;
  answer: string;
  outcome: "pass" | "fail";
  evidence_score: number | string;
  confidence: "strong";
  feedback: string;
  criterion_version: number;
  created_at: string;
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
  };
}

/** Maps a database objective-assessment row into the domain contract. */
function toObjectiveAssessment(
  row: ObjectiveAssessmentRow,
  pageTitle: string,
): ObjectiveAssessment {
  return {
    id: row.id,
    ownerId: row.owner_id,
    pageId: row.page_id,
    pageTitle,
    prompt: row.prompt,
    referenceAnswer: row.reference_answer,
    criterion: row.criterion,
    scoringPolicy: row.scoring_policy,
    minimumEvidence: row.minimum_evidence,
    validityScope: row.validity_scope,
    criterionVersion: row.criterion_version,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Maps a database objective-attempt row into the domain contract. */
function toObjectiveAttempt(row: ObjectiveAttemptRow): ObjectiveAttempt {
  return {
    id: row.id,
    ownerId: row.owner_id,
    assessmentId: row.assessment_id,
    answer: row.answer,
    outcome: row.outcome,
    evidenceScore: Number(row.evidence_score),
    confidence: row.confidence,
    feedback: row.feedback,
    criterionVersion: row.criterion_version,
    createdAt: row.created_at,
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

  /** Lists active objective assessments owned by the learner. */
  async listObjectiveAssessments(ownerId: string, pageId?: string) {
    let query = this.supabase
      .from("educational_objective_assessments")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (pageId) query = query.eq("page_id", pageId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as ObjectiveAssessmentRow[];
    if (!rows.length) return [];

    const pages = await this.listPages(ownerId);
    const titles = new Map(pages.map((page) => [page.id, page.title]));

    return rows
      .filter((row) => titles.has(row.page_id))
      .map((row) =>
        toObjectiveAssessment(
          row,
          titles.get(row.page_id) ?? "Página",
        ),
      );
  }

  /** Lists immutable objective evidence owned by the learner. */
  async listObjectiveAttempts(ownerId: string, assessmentId?: string) {
    let query = this.supabase
      .from("educational_objective_attempts")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true });

    if (assessmentId) query = query.eq("assessment_id", assessmentId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data ?? []) as ObjectiveAttemptRow[]).map(toObjectiveAttempt);
  }

  /** Creates an activity only when the page ownership policy permits it. */
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

  /** Creates a deterministic criterion-referenced assessment. */
  async createObjectiveAssessment(input: {
    ownerId: string;
    pageId: string;
    prompt: string;
    referenceAnswer: string;
    minimumEvidence: number;
  }) {
    const { data, error } = await this.supabase
      .from("educational_objective_assessments")
      .insert({
        owner_id: input.ownerId,
        page_id: input.pageId,
        prompt: input.prompt,
        reference_answer: input.referenceAnswer,
        criterion: NORMALIZED_EXACT_MATCH_CRITERION,
        scoring_policy: "normalized-exact-match",
        minimum_evidence: input.minimumEvidence,
        validity_scope: "page",
        criterion_version: 1,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const pages = await this.listPages(input.ownerId);
    const pageTitle = pages.find((page) => page.id === input.pageId)?.title;
    if (!pageTitle) throw new Error("Página de avaliação não encontrada.");

    return toObjectiveAssessment(data as ObjectiveAssessmentRow, pageTitle);
  }

  /** Records objective evidence; outcome and score are computed server-side. */
  async recordObjectiveAttemptAndProgress(input: {
    ownerId: string;
    assessmentId: string;
    answer: string;
  }) {
    const { data, error } = await this.supabase.rpc(
      "record_educational_objective_attempt",
      {
        p_assessment_id: input.assessmentId,
        p_answer: input.answer,
      },
    );

    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== "object") {
      throw new Error("Resposta inválida ao registrar a avaliação objetiva.");
    }
    return toObjectiveAttempt(row as ObjectiveAttemptRow);
  }

  /** Records evidence and advances page progress in one authorized transaction. */
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

}
