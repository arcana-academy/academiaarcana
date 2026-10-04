import { describe, expect, it } from "vitest";

import {
  ACADEMIC_WRITING_TOOLKIT_DEFINITION,
  ACADEMIC_WRITING_TOOLKIT_OPERATIONS,
  ACADEMIC_WRITING_TOOLKIT_PROVIDER_ID,
  toIntegrationToolRequest,
} from "./academic-writing-toolkit";

describe("Academic Writing Toolkit integration boundary", () => {
  it("declares the exact supported toolkit operations", () => {
    expect(ACADEMIC_WRITING_TOOLKIT_OPERATIONS).toEqual([
      "audit_citations",
      "check_british_english",
      "review_paragraph_logic",
      "verify_bibtex_references",
      "create_reading_note_template",
    ]);
  });

  it("uses an MCP-only server-side integration definition", () => {
    expect(ACADEMIC_WRITING_TOOLKIT_DEFINITION).toMatchObject({
      id: ACADEMIC_WRITING_TOOLKIT_PROVIDER_ID,
      displayName: "Academic Writing Toolkit",
      authMode: "mcp",
      userConnectionRequired: false,
      serverSideOnly: true,
      scopes: [],
    });
  });

  it("normalizes an application request without exposing credentials", () => {
    expect(
      toIntegrationToolRequest({
        operation: "review_paragraph_logic",
        input: { text: "A short academic paragraph." },
      }),
    ).toEqual({
      providerId: ACADEMIC_WRITING_TOOLKIT_PROVIDER_ID,
      tool: "review_paragraph_logic",
      input: { text: "A short academic paragraph." },
    });
  });
});
