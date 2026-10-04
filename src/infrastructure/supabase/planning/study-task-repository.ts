import type { SupabaseClient } from "@supabase/supabase-js";

import type { StudyTask, StudyTaskRepository } from "@/domains/planning";

type StudyTaskRow = {
  id: string;
  owner_id: string;
  title: string;
  due_at: string | null;
  status: "pending" | "completed" | "cancelled";
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

function toDomain(row: StudyTaskRow): StudyTask {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    dueAt: row.due_at,
    status: row.status,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseStudyTaskRepository implements StudyTaskRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(task: StudyTask): Promise<StudyTask> {
    const { data, error } = await this.supabase
      .from("study_tasks")
      .insert({
        id: task.id,
        owner_id: task.ownerId,
        title: task.title,
        due_at: task.dueAt,
        status: task.status,
        completed_at: task.completedAt,
        created_at: task.createdAt,
        updated_at: task.updatedAt,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return toDomain(data as StudyTaskRow);
  }

  async listUpcoming(
    ownerId: string,
    now: string,
    limit = 10,
  ): Promise<StudyTask[]> {
    const { data, error } = await this.supabase
      .from("study_tasks")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("status", "pending")
      .or(`due_at.gte.${now},due_at.is.null`)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => toDomain(row as StudyTaskRow));
  }

  async getById(id: string): Promise<StudyTask | null> {
    const { data, error } = await this.supabase
      .from("study_tasks")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toDomain(data as StudyTaskRow) : null;
  }
}
