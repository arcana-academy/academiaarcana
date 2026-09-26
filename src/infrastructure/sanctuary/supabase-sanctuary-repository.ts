import type { SupabaseClient } from "@supabase/supabase-js";

import type { SanctuaryRepository, SanctuaryGrimoire, SanctuaryNotebook, SanctuaryChapter, SanctuaryPage } from "./sanctuary-repository";
import { SupabasePageProgressRepository } from "@/infrastructure/supabase/learning/page-progress-repository";
import { SupabaseStudyTaskRepository } from "@/infrastructure/supabase/planning/study-task-repository";
import { SupabaseGamificationRepository } from "@/infrastructure/supabase/gamification/gamification-repository";
import type { PageProgress } from "@/domains/learning";
import type { StudyTask } from "@/domains/planning";
import type { Mission } from "@/domains/gamification";

type PageRow = { id: string; chapter_id: string; title: string; position: number };
type ChapterRow = { id: string; notebook_id: string; title: string; position: number; pages: PageRow[] };
type NotebookRow = { id: string; grimoire_id: string; title: string; position: number; chapters: ChapterRow[] };
type GrimoireRow = { id: string; owner_id: string; title: string; icon: string | null; cover: string | null; notebooks: NotebookRow[] };

export class SupabaseSanctuaryRepository implements SanctuaryRepository {
  private readonly pageProgressRepository;
  private readonly studyTaskRepository;
  private readonly gamificationRepository;

  constructor(private readonly supabase: SupabaseClient) {
    this.pageProgressRepository = new SupabasePageProgressRepository(supabase);
    this.studyTaskRepository = new SupabaseStudyTaskRepository(supabase);
    this.gamificationRepository = new SupabaseGamificationRepository(supabase);
  }

  async getLearningHierarchy(): Promise<SanctuaryGrimoire[]> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser();
    if (authError || !user) throw new Error("User is not authenticated");
    const columns = [
      "id, owner_id, title, icon, cover,",
      "notebooks (",
      "id, grimoire_id, title, position,",
      "chapters (",
      "id, notebook_id, title, position,",
      "pages (id, chapter_id, title, position)",
      ")",
      ")",
    ].join("\n");
    const { data, error } = await this.supabase.from("grimoires").select(columns).eq("owner_id", user.id).returns<GrimoireRow[]>();
    if (error) throw new Error("Failed to fetch learning hierarchy: " + error.message);
    return (data ?? []).map(this.toGrimoire);
  }

  getPageProgress(ownerId: string, pageIds: string[]): Promise<PageProgress[]> { return this.pageProgressRepository.listByPages(ownerId, pageIds); }
  listUpcomingStudyTasks(ownerId: string, now: string, limit?: number): Promise<StudyTask[]> { return this.studyTaskRepository.listUpcoming(ownerId, now, limit); }
  listDailyMissions(ownerId: string, targetDate: string): Promise<Mission[]> { return this.gamificationRepository.listDailyMissions(ownerId, targetDate); }

  private toGrimoire = (row: GrimoireRow): SanctuaryGrimoire => ({
    id: row.id, ownerId: row.owner_id, title: row.title,
    ...(row.icon !== null ? { icon: row.icon } : {}),
    ...(row.cover !== null ? { cover: row.cover } : {}),
    notebooks: (row.notebooks || []).map(this.toNotebook).sort((a, b) => a.position - b.position),
  });

  private toNotebook = (row: NotebookRow): SanctuaryNotebook => ({
    id: row.id, grimoireId: row.grimoire_id, title: row.title, position: row.position,
    chapters: (row.chapters || []).map(this.toChapter).sort((a, b) => a.position - b.position),
  });

  private toChapter = (row: ChapterRow): SanctuaryChapter => ({
    id: row.id, notebookId: row.notebook_id, title: row.title, position: row.position,
    pages: (row.pages || []).map(SupabaseSanctuaryRepository.toPage).sort((a, b) => a.position - b.position),
  });

  private static toPage = (row: PageRow): SanctuaryPage => ({ id: row.id, chapterId: row.chapter_id, title: row.title, position: row.position });
}