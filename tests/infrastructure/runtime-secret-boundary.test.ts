import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const readRepoFile = (path: string) =>
  readFileSync(resolve(root, path), "utf8");

const RUNTIME_SECRET_CONSUMERS = [
  "src/infrastructure/openai/mestre-arcano.ts",
  "src/infrastructure/parallel/parallel-search.ts",
  "src/infrastructure/exa/search.ts",
  "src/infrastructure/integrations/todoist.ts",
  "src/infrastructure/integrations/notion.ts",
  "src/infrastructure/integrations/asana.ts",
  "src/infrastructure/integrations/trello.ts",
  "src/infrastructure/integrations/microsoft-sharepoint.ts",
  "src/infrastructure/integrations/outlook-calendar-oauth.ts",
  "src/infrastructure/integrations/outlook-calendar-session.ts",
  "src/infrastructure/integrations/datacamp.ts",
  "src/infrastructure/integrations/airtable.ts",
  "src/infrastructure/integrations/dropbox.ts",
  "src/infrastructure/integrations/open-source-ai-gateway.ts",
] as const;

describe("runtime-only secret boundary", () => {
  it("prefers the central runtime secret resolver for server credentials", () => {
    for (const path of RUNTIME_SECRET_CONSUMERS) {
      expect(readRepoFile(path)).toContain("runtime-secrets");
    }
  });

  it("does not read the critical migrated credentials directly from process.env", () => {
    const directReads = [
      "process.env.OPENAI_API_KEY",
      "process.env.PARALLEL_API_KEY",
      "process.env.EXA_API_KEY",
      "process.env.TODOIST_CLIENT_SECRET",
      "process.env.NOTION_CLIENT_SECRET",
      "process.env.ASANA_CLIENT_SECRET",
      "process.env.TRELLO_CLIENT_SECRET",
      "process.env.MICROSOFT_CLIENT_SECRET",
      "process.env.MICROSOFT_ENTRA_CLIENT_SECRET",
      "process.env.OUTLOOK_CALENDAR_SESSION_SECRET",
      "process.env.DATACAMP_API_KEY",
      "process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN",
      "process.env.DROPBOX_RUNTIME_TOKEN",
      "process.env.MICROSOFT_GRAPH_ACCESS_TOKEN",
    ];

    for (const path of RUNTIME_SECRET_CONSUMERS) {
      const content = readRepoFile(path);
      for (const directRead of directReads) {
        expect(content).not.toContain(directRead);
      }
    }
  });

  it("keeps secret-dependent integration status pages dynamic", () => {
    expect(
      readRepoFile("src/app/integracoes/ia-aberta/page.tsx"),
    ).toContain('export const dynamic = "force-dynamic";');

    expect(
      readRepoFile("src/app/integracoes/page.tsx"),
    ).toContain('export const dynamic = "force-dynamic";');
  });
});
