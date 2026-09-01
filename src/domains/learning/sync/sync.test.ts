import { describe, expect, it } from "vitest";
import { createVersion, getLatestVersion, getVersionDiff } from "./history";
import { DEFAULT_SYNC_SETTINGS, isSyncEnabledForKind, validateSyncSettings } from "./settings";

const base = { documentId: "doc-1", content: "a\nb", createdAt: "2026-09-01T12:00:00Z", createdBy: "user-1", deleted: false };

describe("learning sync", () => {
  it("increments document versions", () => {
    const first = createVersion({ ...base, id: "v1" }, []);
    const second = createVersion({ ...base, id: "v2", content: "a\nb\nc" }, [first]);
    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    expect(getLatestVersion([first, second])?.id).toBe("v2");
  });

  it("detects line changes", () => {
    expect(getVersionDiff("a\nb", "a\nb\nc")).toEqual({ changed: true, added: 1, removed: 0 });
    expect(getVersionDiff("a", "a")).toEqual({ changed: false, added: 0, removed: 0 });
  });

  it("keeps media synchronization opt-in", () => {
    expect(isSyncEnabledForKind({ ...DEFAULT_SYNC_SETTINGS, deviceId: "d" }, "note")).toBe(true);
    expect(isSyncEnabledForKind({ ...DEFAULT_SYNC_SETTINGS, deviceId: "d" }, "pdf")).toBe(false);
  });

  it("requires a device id", () => {
    expect(validateSyncSettings({ ...DEFAULT_SYNC_SETTINGS, deviceId: "" })).toContain("deviceId é obrigatório.");
  });
});
