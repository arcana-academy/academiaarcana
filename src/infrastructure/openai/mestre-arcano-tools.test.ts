import { describe, expect, it, vi } from "vitest";

import {
  executeMestreArcanoTool,
  MESTRE_ARCANO_TOOLS,
} from "./mestre-arcano-tools";

describe("Mestre Arcano tools", () => {
  it("declares the available tools as strict functions", () => {
    expect(MESTRE_ARCANO_TOOLS).toHaveLength(5);
    expect(MESTRE_ARCANO_TOOLS.every((tool) => tool.type === "function" && tool.strict)).toBe(true);
  });

  it("reads user context only through the intelligence context port", async () => {
    const context = {
      getGamificationProfile: vi.fn().mockResolvedValue({ xp: 12, streakDays: 3, lastActiveOn: "2026-09-30", updatedAt: "2026-09-30T10:00:00Z" }),
      getTodayMissions: vi.fn().mockResolvedValue([]),
      getUpcomingStudyTasks: vi.fn().mockResolvedValue([]),
      getConnectedSharePointSources: vi.fn().mockResolvedValue({ connected: false, sources: [] }),
      getSharePointDocumentContext: vi.fn(),
    };

    const output = await executeMestreArcanoTool(
      { name: "get_gamification_profile", arguments: "{}" },
      { context },
    );

    expect(JSON.parse(output)).toEqual({ xp: 12, streakDays: 3, lastActiveOn: "2026-09-30", updatedAt: "2026-09-30T10:00:00Z" });
    expect(context.getGamificationProfile).toHaveBeenCalledOnce();
  });

  it("does not expose connected SharePoint sources when the provider is not connected", async () => {
    const context = {
      getGamificationProfile: vi.fn(),
      getTodayMissions: vi.fn(),
      getUpcomingStudyTasks: vi.fn(),
      getConnectedSharePointSources: vi.fn().mockResolvedValue({ connected: false, sources: [] }),
      getSharePointDocumentContext: vi.fn(),
    };

    const output = await executeMestreArcanoTool(
      { name: "get_connected_sharepoint_sources", arguments: "{}" },
      { context },
    );

    expect(JSON.parse(output)).toEqual({ connected: false, sources: [] });
  });

  it("passes document source ids through the authorized context port", async () => {
    const context = {
      getGamificationProfile: vi.fn(),
      getTodayMissions: vi.fn(),
      getUpcomingStudyTasks: vi.fn(),
      getConnectedSharePointSources: vi.fn(),
      getSharePointDocumentContext: vi.fn().mockResolvedValue({ content: "Study notes" }),
    };

    const output = await executeMestreArcanoTool(
      {
        name: "get_sharepoint_document_context",
        arguments: JSON.stringify({ sourceId: "source-1" }),
      },
      { context },
    );

    expect(JSON.parse(output)).toEqual({ content: "Study notes" });
    expect(context.getSharePointDocumentContext).toHaveBeenCalledWith("source-1");
  });

  it("rejects malformed tool arguments", async () => {
    const context = {
      getGamificationProfile: vi.fn(),
      getTodayMissions: vi.fn(),
      getUpcomingStudyTasks: vi.fn(),
      getConnectedSharePointSources: vi.fn(),
      getSharePointDocumentContext: vi.fn(),
    };

    await expect(
      executeMestreArcanoTool(
        { name: "get_sharepoint_document_context", arguments: "{" },
        { context },
      ),
    ).rejects.toThrow("Argumentos de ferramenta inválidos.");
  });
});
