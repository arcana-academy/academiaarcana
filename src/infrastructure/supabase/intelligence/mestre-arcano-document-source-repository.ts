import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  MestreArcanoConnectedSharePointSource,
  MestreArcanoDocumentContext,
  MestreArcanoDocumentContextPort,
} from "@/domains/intelligence";
import type { MicrosoftSharePointCredentials } from "@/infrastructure/integrations/microsoft-sharepoint";
import {
  getMicrosoftSharePointDocumentContext,
} from "@/infrastructure/integrations/microsoft-sharepoint-content";

export class SupabaseMestreArcanoDocumentSourceRepository
  implements MestreArcanoDocumentContextPort
{
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly ownerId: string,
    private readonly credentials: MicrosoftSharePointCredentials | null,
  ) {}

  async listConnectedSharePointSources(): Promise<{
    readonly connected: boolean;
    readonly sources: readonly MestreArcanoConnectedSharePointSource[];
  }> {
    if (!this.credentials || this.credentials.subjectId !== this.ownerId) {
      return { connected: false, sources: [] };
    }

    const { data, error } = await this.supabase
      .from("external_document_sources")
      .select(
        "id, name, mime_type, web_url, last_modified_at, size_bytes, status",
      )
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
        sourceId: String(source.id),
        name: typeof source.name === "string" && source.name.trim() ? source.name : null,
        mimeType:
          typeof source.mime_type === "string" && source.mime_type.trim()
            ? source.mime_type
            : null,
        webUrl:
          typeof source.web_url === "string" && source.web_url.trim()
            ? source.web_url
            : null,
        lastModifiedAt:
          typeof source.last_modified_at === "string"
            ? source.last_modified_at
            : null,
        sizeBytes:
          typeof source.size_bytes === "number" && Number.isFinite(source.size_bytes)
            ? source.size_bytes
            : null,
        status: "active",
      })),
    };
  }

  async getSharePointDocumentContext(
    sourceId: string,
  ): Promise<MestreArcanoDocumentContext> {
    const credentials = this.credentials;
    if (!credentials || credentials.subjectId !== this.ownerId) {
      throw new Error("Microsoft SharePoint não está conectado para este usuário.");
    }

    const context = await getMicrosoftSharePointDocumentContext(sourceId, {
      supabase: this.supabase,
      ownerId: this.ownerId,
      credentials,
    });

    return context;
  }
}
