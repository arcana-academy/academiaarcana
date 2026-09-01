import type { SyncFileKind, SyncSettings } from "./types";

export const DEFAULT_SYNC_SETTINGS: Omit<SyncSettings, "deviceId"> = {
  enabled: true,
  syncNotes: true,
  syncImages: false,
  syncAudio: false,
  syncVideo: false,
  syncPdf: false,
  syncEditorPreferences: false,
  syncShortcuts: false,
  conflictStrategy: "manual",
};

export function isSyncEnabledForKind(settings: SyncSettings, kind: SyncFileKind): boolean {
  switch (kind) {
    case "note":
      return settings.enabled && settings.syncNotes;
    case "image":
      return settings.enabled && settings.syncImages;
    case "audio":
      return settings.enabled && settings.syncAudio;
    case "video":
      return settings.enabled && settings.syncVideo;
    case "pdf":
      return settings.enabled && settings.syncPdf;
  }
}

export function validateSyncSettings(settings: SyncSettings): string[] {
  const errors: string[] = [];
  if (!settings.deviceId.trim()) errors.push("deviceId é obrigatório.");
  if (!settings.enabled && settings.conflictStrategy !== "manual") {
    errors.push("A estratégia manual é obrigatória quando a sincronização está desativada.");
  }
  return errors;
}
