import { describe, expect, it, vi } from "vitest";

import type {
  MestreArcanoToolContext,
  MestreArcanoDocumentContext,
} from "@/domains/intelligence";

import {
  executeMestreArcanoTool,
  MESTRE_ARCANO_TOOLS,
} from "./mestre-arcano-tools";

function createContext(
  overrides: Partial<MestreArcanoToolContext> = {},
): MestreArcanoToolContext {
  return {
    learner: {
      getGamificationProfile: vi.fn().mockResolvedValue({
        xp: 120,
        streakDays: 4,
        lastActiveOn: "2026-09-30",
        updatedAt: "2026-09-30T10:00:00.000Z",
      }),
      listTodayMissions: vi.fn().mockResolvedValue([
        {
          id: "mission-1",
          code: "daily-study",
          title: "Estudar hoje",
          rewardXp: 20,
          targetDate: "2026-09-30",
          completed: false,
          completedAt: null,
        },
      ]),
      listUpcomingStudyTasks: vi.fn().mockResolvedValue([
        {
          id: "task-1",
          title: "Revisar anatomia",
          dueAt: "2026-09-30T18:00:00.000Z",
          status: "pending",
          completedAt: null,
        },
      ]),
    },
    documents: {
      listConnectedSharePointSources: vi.fn().mockResolvedValue({
        connected: true,
        sources: [],
      }),
      getSharePointDocumentContext: vi.fn().mockResolvedValue({
        source: {
          id: "source-1",
          providerId: "microsoft-sharepoint",
          siteId: "site-1",
          driveId: "drive-1",
          itemId: "item-1",
          name: "notes.md",
          mimeType: "text/markdown",
          webUrl: "https://example.test/notes.md",
          lastModifiedAt: null,
          sizeBytes: 10,
        },
        content: "Study notes",
        truncated: false,
        currentDocument: {
          name: "notes.md",
          mimeType: "text/markdown",
          sizeBytes: 10,
          lastModifiedAt: null,
          webUrl: "https://example.test/notes.md",
        },
      } satisfies MestreArcanoDocumentContext),
    },
    ...overrides,
  };
}

describe("Mestre Arcano tools", () => {
  it("declares the authorized tools as strict functions", () => {
    for (const tool of MESTRE_ARCANO_TOOLS) {
      expect(tool).toMatchObject({
        type: "function",
        strict: true,
      });
    }

    expect(
      MESTRE_ARCANO_TOOLS.find(
        (tool) => tool.name === "get_sharepoint_document_context",
      ),
    ).toMatchObject({
      parameters: {
        required: ["sourceId"],
      },
    });
  });

  it("reads learner data only through the authorized learner port", async () => {
    const context = createContext();

    await expect(
      executeMestreArcanoTool(
        { name: "get_gamification_profile", arguments: "{}" },
        context,
      ),
    ).resolves.toBe(
      JSON.stringify({
        xp: 120,
        streakDays: 4,
        lastActiveOn: "2026-09-30",
        updatedAt: "2026-09-30T10:00:00.000Z",
      }),
    );

    await executeMestreArcanoTool(
      { name: "get_today_missions", arguments: "{}" },
      context,
    );
    await executeMestreArcanoTool(
      { name: "get_upcoming_study_tasks", arguments: JSON.stringify({ limit: 3 }) },
      context,
    );

    expect(context.learner.getGamificationProfile).toHaveBeenCalledOnce();
    expect(context.learner.listTodayMissions).toHaveBeenCalledOnce();
    expect(context.learner.listUpcomingStudyTasks).toHaveBeenCalledWith(
      expect.any(String),
      3,
    );
  });

  it("reads SharePoint only through the authorized document port", async () => {
    const context = createContext();

    const sources = JSON.parse(
      await executeMestreArcanoTool(
        { name: "get_connected_sharepoint_sources", arguments: "{}" },
        context,
      ),
    );
    const document = JSON.parse(
      await executeMestreArcanoTool(
        {
          name: "get_sharepoint_document_context",
          arguments: JSON.stringify({ sourceId: "source-1" }),
        },
        context,
      ),
    );

    expect(sources).toEqual({ connected: true, sources: [] });
    expect(document).toMatchObject({
      source: { id: "source-1", providerId: "microsoft-sharepoint" },
      content: "Study notes",
    });
    expect(context.documents.listConnectedSharePointSources).toHaveBeenCalledOnce();
    expect(context.documents.getSharePointDocumentContext).toHaveBeenCalledWith(
      "source-1",
    );
  });

  it("rejects malformed tool arguments and unknown tools", async () => {
    const context = createContext();

    await expect(
      executeMestreArcanoTool(
        { name: "get_upcoming_study_tasks", arguments: "{" },
        context,
      ),
    ).rejects.toThrow("Argumentos de ferramenta inválidos.");

    await expect(
      executeMestreArcanoTool(
        { name: "get_unknown_tool", arguments: "{}" },
        context,
      ),
    ).rejects.toThrow("Ferramenta do Mestre Arcano não autorizada.");
  });

  it("requires a valid SharePoint source id", async () => {
    const context = createContext();

    await expect(
      executeMestreArcanoTool(
        {
          name: "get_sharepoint_document_context",
          arguments: JSON.stringify({ sourceId: 123 }),
        },
        context,
      ),
    ).rejects.toThrow("ID da fonte do SharePoint inválido.");

    expect(
      context.documents.getSharePointDocumentContext,
    ).not.toHaveBeenCalled();
  });
});
