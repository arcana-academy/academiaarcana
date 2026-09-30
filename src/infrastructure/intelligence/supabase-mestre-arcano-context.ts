import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  MestreArcanoContextProvider,
  MestreArcanoGamificationProfile,
  MestreArcanoMission,
  MestreArcanoSharePointSource,
  MestreArcanoStudyTask,
} from "@/domains/intelligence";
import type { MicrosoftSharePointCredentials } from "@/infrastructure/integrations/microsoft-sharepoint";
import { getMicrosoftSharePointDocumentContext } from "@/infrastructure/integrations/microsoft-sharepoint-content";
import { SupabaseGamificationRepository } from "@/infrastructure/supabase/gamification/gamification-repository";
import { SupabaseStudyTaskRepository } from "@/infrastructure/supabase/planning/study-task-repository";

export class SupabaseMestreArcanoContextProvider implements MestreArcanoContextProvider {
  private readonly gamification;
  private readonly planning;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly ownerId: string,
    private readonly microsoftSharePointCredentials: MicrosoftSharePointCredentials | null,
  ) {
    this.gamification = new SupabaseGamificationRepository(supabase);
    this.planning = new SupabaseStudyTaskRepository(supabase);
  }

  async getGamificationProfile(): Promise<MestreArcanoGamificationProfile> {
    const profile = await this.gamification.getProfile(this.ownerId);
    return profile
      ? {
          xp: profile.xp,
          streakDays: profile.streakDays,
          lastActiveOn: profile.lastActiveOn,
          updatedAt: profile.updatedAt,
        }
      : { xp: 0, streakDays: 0, lastActiveOn: null, updatedAt: null };
  }

  async getTodayMissions(): Promise<MestreArcanoMission[]> {
    const today = new Date().toISOString().slice(0, 10);
    const missions = await this.gamification.listDailyMissions(this.ownerId, today);
    return missions.map((mission) => ({
      id: mission.id,
      code: mission.code,
      title: mission.title,
      rewardXp: mission.rewardXp,
      targetDate: mission.targetDate,
      completed: mission.status === "completed",
      completedAt: mission.completedAt,
    }));
  }

  async getUpcomingStudyTasks(limit: number): Promise<MestreArcanoStudyTask[]> {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 10);
    const tasks = await this.planning.listUpcoming(
      this.ownerId,
      new Date().toISOString(),
      safeLimit,
    );
    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      dueAt: task.dueAt,
      status: task.status,
      completedAt: task.completedAt,
    }));
  }

  async getConnectedSharePointSources(): Promise<{
    connected: boolean;
    sources: MestreArcanoSharePointSource[];
  }> {
    const credentials = this.microsoftSharePointCredentials;
    if (!credentials || credentials.subjectId !== this.ownerId) {
      return { connected: false, sources: [] };
    }

    const { data, error } = await this.supabase
      .from("external_document_sources")
      .select("id, name, mime_type, web_url, last_modified_at, size_bytes, status")
      .eq("owner_id", this.ownerId)
      .eq("provider_id", "microsoft-sharepoint")
      .eq("source_type", "external_document")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (error) {
      throw new Error("Não foi possível ler as fontes conectadas do SharePoint.");
    }

    return {
      connected: true,
      sources: (data ?? []).map((source) => ({
        sourceId: source.id,
        name: source.name,
        mimeType: source.mime_type,
        webUrl: source.web_url,
        lastModifiedAt: source.last_modified_at,
        sizeBytes: source.size_bytes,
        status: source.status,
      })),
    };
  }

  async getSharePointDocumentContext(sourceId: string): Promise<unknown> {
    const credentials = this.microsoftSharePointCredentials;
    if (!credentials || credentials.subjectId !== this.ownerId) {
      throw new Error("Microsoft SharePoint não está conectado para este usuário.");
    }

    return getMicrosoftSharePointDocumentContext(sourceId, {
      supabase: this.supabase,
      ownerId: this.ownerId,
      credentials,
    });
  }
}
