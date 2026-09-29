import { describe, expect, it, vi } from "vitest";

import {
  OUTLOOK_CALENDAR_INTEGRATION_DEFINITION,
  OUTLOOK_CALENDAR_SCOPES,
  OutlookCalendarClient,
} from "./outlook-calendar";

describe("Outlook Calendar integration", () => {
  it("declares least-privilege calendar scopes and server-side execution", () => {
    expect(OUTLOOK_CALENDAR_INTEGRATION_DEFINITION.authMode).toBe("oauth2");
    expect(OUTLOOK_CALENDAR_INTEGRATION_DEFINITION.serverSideOnly).toBe(true);
    expect(OUTLOOK_CALENDAR_SCOPES).toContain("Calendars.ReadWrite");
    expect(OUTLOOK_CALENDAR_SCOPES).toContain("offline_access");
  });

  it("creates an Outlook event through Microsoft Graph", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "event-1",
            subject: "Academia Arcana · Revisar",
            start: { dateTime: "2026-09-30T15:00:00.000Z", timeZone: "UTC" },
            end: { dateTime: "2026-09-30T15:50:00.000Z", timeZone: "UTC" },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      );

    const event = await new OutlookCalendarClient("access-token").createEvent({
      subject: "Academia Arcana · Revisar",
      start: "2026-09-30T15:00:00.000Z",
      end: "2026-09-30T15:50:00.000Z",
    });

    expect(event.id).toBe("event-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://graph.microsoft.com/v1.0/me/calendar/events",
      expect.objectContaining({ method: "POST" }),
    );

    fetchMock.mockRestore();
  });

  it("falls back to calendar events when Graph availability is unsupported", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { message: "getSchedule unsupported" } }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            value: [
              {
                id: "event-1",
                subject: "Aula",
                start: { dateTime: "2026-09-30T15:30:00.000Z", timeZone: "UTC" },
                end: { dateTime: "2026-09-30T16:30:00.000Z", timeZone: "UTC" },
                isCancelled: false,
                showAs: "busy",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const slots = await new OutlookCalendarClient("access-token").findAvailableSlots(
      "2026-09-30T14:00:00.000Z",
      "2026-09-30T18:00:00.000Z",
      50,
    );

    expect(slots[0]).toMatchObject({
      start_datetime: "2026-09-30T14:00:00.000Z",
      end_datetime: "2026-09-30T14:50:00.000Z",
      duration_minutes: 50,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockRestore();
  });
});
