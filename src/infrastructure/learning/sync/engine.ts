import type { SyncConnectionState, SyncOperation } from "@/domains/learning/sync";
import { localSyncStore } from "../localSyncStore";

export interface SyncTransport {
  push(operations: readonly SyncOperation[]): Promise<readonly string[]>;
}

export interface SyncEngineState {
  connection: SyncConnectionState;
  pending: number;
}

export async function enqueueOfflineOperation(operation: SyncOperation): Promise<void> {
  await localSyncStore.enqueue(operation);
}

export async function flushOfflineQueue(transport: SyncTransport): Promise<SyncEngineState> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { connection: "offline", pending: (await localSyncStore.listPendingOperations()).length };
  }

  const pending = await localSyncStore.listPendingOperations();
  if (pending.length === 0) return { connection: "online", pending: 0 };

  try {
    const acknowledged = new Set(await transport.push(pending));
    const remaining = pending.filter((operation) => !acknowledged.has(operation.id));
    return { connection: "online", pending: remaining.length };
  } catch {
    return { connection: "error", pending: pending.length };
  }
}
