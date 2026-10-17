import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  isOutlookCalendarConnected: vi.fn(),
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mocked.requireAuthenticatedUser,
}));

vi.mock("@/infrastructure/integrations/outlook-calendar-session", () => ({
  isOutlookCalendarConnected: mocked.isOutlookCalendarConnected,
}));

vi.mock("@/infrastructure/integrations/outlook-calendar", () => ({
  OUTLOOK_CALENDAR_INTEGRATION_DEFINITION: {
    id: "outlook-calendar",
    name: "Microsoft Outlook Calendar",
  },
}));

import { GET } from "./route";

describe("authenticated Outlook status boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.requireAuthenticatedUser.mockResolvedValue({ sub: "synthetic-user" });
  });

  it.each([true, false])(
    "preserves the existing connected=%s contract and avoids caching user state",
    async (connected) => {
      mocked.isOutlookCalendarConnected.mockResolvedValue(connected);

      const response = await GET();

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        provider: { id: "outlook-calendar", name: "Microsoft Outlook Calendar" },
        connected,
      });
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(mocked.requireAuthenticatedUser).toHaveBeenCalledOnce();
      expect(mocked.isOutlookCalendarConnected).toHaveBeenCalledOnce();
    },
  );

  it("returns a neutral recoverable outage instead of throwing or claiming disconnection", async () => {
    const canary = "SYNTHETIC_PROVIDER_DIAGNOSTIC_MUST_NOT_LEAK";
    mocked.isOutlookCalendarConnected.mockRejectedValue(new Error(canary));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({
      provider: { id: "outlook-calendar", name: "Microsoft Outlook Calendar" },
      connected: null,
      status: "unavailable",
    });
    expect(JSON.stringify(payload)).not.toContain(canary);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("preserves the authenticated route guard and never queries Outlook on denied access", async () => {
    mocked.requireAuthenticatedUser.mockRejectedValue(
      new Error("SYNTHETIC_AUTHORIZATION_DENIED"),
    );

    await expect(GET()).rejects.toThrow("SYNTHETIC_AUTHORIZATION_DENIED");
    expect(mocked.isOutlookCalendarConnected).not.toHaveBeenCalled();
  });
});
