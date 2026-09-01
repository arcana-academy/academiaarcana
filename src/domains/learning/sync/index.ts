export type {
  DocumentVersion,
  SharedVault,
  SharedVaultMember,
  SyncConflict,
  SyncConnectionState,
  SyncFileKind,
  SyncOperation,
  SyncSettings,
  VaultMemberRole,
} from "./types";
export { DEFAULT_SYNC_SETTINGS, isSyncEnabledForKind, validateSyncSettings } from "./settings";
export { createVersion, getLatestVersion, getVersionDiff, restoreVersion } from "./history";
