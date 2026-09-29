import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AIRTABLE_INTEGRATION_DEFINITION,
  AirtableConnectionError,
  getAirtableApiKey,
  getAirtableBaseId,
  verifyAirtableConnection,
} from "./airtable";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Airtable integration", () => {
  it("declares a server-side integration", () => {
    expect(AIRTABLE_INTEGRATION_DEFINITION.serverSideOnly).toBe(true);
    expect(AIRTABLE_INTEGRATION_DEFINITION.userConnectionRequired).toBe(false);
    expect(AIRTABLE_INTEGRATION_DEFINITION.capabilities).toEqual(["read", "write", "search", "metadata", "analytics"]);
  });

  it("requires the personal access token", () => {
    vi.stubEnv("AIRTABLE_PERSONAL_ACCESS_TOKEN", "");
    expect(() => getAirtableApiKey()).toThrow(AirtableConnectionError);
  });

  it("requires the base id", () => {
    vi.stubEnv("AIRTABLE_BASE_ID", "");
    expect(() => getAirtableBaseId()).toThrow(AirtableConnectionError);
  });

  it("verifies base access without exposing the credential in the result", async () => {
    vi.stubEnv("AIRTABLE_PERSONAL_ACCESS_TOKEN", "pat_test");
    vi.stubEnv("AIRTABLE_BASE_ID", "app_test");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ tables: [{ id: "tbl_test", name: "Content" }] }), { status: 200 }),
    );
    const result = await verifyAirtableConnection();
    expect(result.tableCount).toBe(1);
    expect(JSON.stringify(result)).not.toContain("pat_test");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/meta/bases/app_test/tables");
    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer pat_test");
  });
});