import { SupabaseClient } from '@supabase/supabase-js';
import { 
  SanctuaryRepository, 
  SanctuaryGrimoire, 
  SanctuaryNotebook, 
  SanctuaryChapter, 
  SanctuaryPage 
} from './sanctuary-repository';

type PageRow = {
  id: string;
  chapter_id: string;
  title: string;
  position: number;
};

type ChapterRow = {
  id: string;
  notebook_id: string;
  title: string;
  position: number;
  pages: PageRow[];
};

type NotebookRow = {
  id: string;
  grimoire_id: string;
  title: string;
  position: number;
  chapters: ChapterRow[];
};

type GrimoireRow = {
  id: string;
  owner_id: string;
  title: string;
  icon: string | null;
  cover: string | null;
  notebooks: NotebookRow[];
};

export class SupabaseSanctuaryRepository implements SanctuaryRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getLearningHierarchy(): Promise<SanctuaryGrimoire[]> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User is not authenticated');
    }

    const { data, error } = await this.supabase
      .from('grimoires')
      .select(`
        id,
        owner_id,
        title,
        icon,
        cover,
        notebooks (
          id,
          grimoire_id,
          title,
          position,
          chapters (
            id,
            notebook_id,
            title,
            position,
            pages (
              id,
              chapter_id,
              title,
              position
            )
          )
        )
      `)
      .eq('owner_id', user.id)
      .returns<GrimoireRow[]>();

    if (error) {
      throw new Error(`Failed to fetch learning hierarchy: ${error.message}`);
    }

    return (data ?? []).map(this.toGrimoire);
  }

  private toGrimoire = (row: GrimoireRow): SanctuaryGrimoire => ({
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    ...(row.icon !== null ? { icon: row.icon } : {}),
    ...(row.cover !== null ? { cover: row.cover } : {}),
    notebooks: (row.notebooks || [])
      .map(this.toNotebook)
      .sort((a, b) => a.position - b.position),
  });

  private toNotebook = (row: NotebookRow): SanctuaryNotebook => ({
    id: row.id,
    grimoireId: row.grimoire_id,
    title: row.title,
    position: row.position,
    chapters: (row.chapters || [])
      .map(this.toChapter)
      .sort((a, b) => a.position - b.position),
  });

  private toChapter = (row: ChapterRow): SanctuaryChapter => ({
    id: row.id,
    notebookId: row.notebook_id,
    title: row.title,
    position: row.position,
    pages: (row.pages || [])
      .map(this.toPage)
      .sort((a, b) => a.position - b.position),
  });

  private toPage = (row: PageRow): SanctuaryPage => ({
    id: row.id,
    chapterId: row.chapter_id,
    title: row.title,
    position: row.position,
  });
}