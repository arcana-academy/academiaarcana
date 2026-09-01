export type SyncConnectionState = "offline" | "connecting" | "online" | "error";

export type SyncFileKind = "note" | "image" | "audio" | "video" | "pdf";

export type SyncConflictStrategy = "manual" | "latest_write";

export interface SyncSettings {
  enabled: boolean;
  syncNotes: boolean;
  syncImages: boolean;
  syncAudio: boolean;
  syncVideo: boolean;
  syncPdf: boolean;
  syncEditorPreferences: boolean;
  syncShortcuts: boolean;
  deviceId: string;
  conflictStrategy: SyncConflictStrategy;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  createdAt: string;
  createdBy: string;
  changeSummary?: string;
  deleted: boolean;
}

export interface SyncOperation {
  id: string;
  documentId: string;
  version: number;
  kind: "upsert" | "delete" | "restore";
  payload: string;
  createdAt: string;
  deviceId: string;
  acknowledgedAt?: string;
}

export interface SyncConflict {
  id: string;
  documentId: string;
  localVersion: number;
  remoteVersion: number;
  localContent: string;
  remoteContent: string;
  detectedAt: string;
}

export interface SharedVault {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export type VaultMemberRole = "owner" | "editor" | "viewer";

export interface SharedVaultMember {
  vaultId: string;
  userId: string;
  role: VaultMemberRole;
  joinedAt: string;
}
