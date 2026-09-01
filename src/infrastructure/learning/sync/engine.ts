import type { SyncConnectionState, SyncOperation } from "@/domains/learning/sync";
import { localSyncStore } from "../localSyncStore";

export interface SyncTransport { push(operations: readonly SyncOperation[]): Promise<readonly string[]>; }
export interface SyncEngineState { connection: SyncConnectionState; pending: number; }

export async function enqueueOfflineOperation(operation: SyncOperation): Promise<void> { await localSyncStore.enqueue(operation); }

export async function flushOfflineQueue(transport: SyncTransport): Promise<SyncEngineState> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { connection: "offline", pending: (await localSyncStore.listPendingOperations()).length };
  const pending = await localSyncStore.listPendingOperations();
  if (pending.length === 0) return { connection: "online", pending: 0 };
  try {
    const acknowledged = new Set(await transport.push(pending));
    await Promise.all(pending.filter((operation) => acknowledged.has(operation.id)).map((operation) => localSyncStore.acknowledge(operation.id)));
    const remaining = (await localSyncStore.listPendingOperations()).length;
    return { connection: "online", pending: remaining };
  } catch {
    return { connection: "error", pending: (await localSyncStore.listPendingOperations()).length };
  }
}
