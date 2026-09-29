import type {
  IntegrationDefinition,
  IntegrationToolResult,
} from "./contracts";

export const OUTLOOK_CALENDAR_PROVIDER_ID = "outlook-calendar" as const;
export const OUTLOOK_CALENDAR_PLUGIN_NAME = "Outlook Calendar" as const;
export const MICROSOFT_GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0" as const;

export const OUTLOOK_CALENDAR_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "User.Read",
  "Calendars.ReadWrite",
] as const;

export const OUTLOOK_CALENDAR_INTEGRATION_DEFINITION = {
  id: OUTLOOK_CALENDAR_PROVIDER_ID,
  displayName: OUTLOOK_CALENDAR_PLUGIN_NAME,
  authMode: "oauth2",
  capabilities: ["read", "write", "search", "calendar"],
  userConnectionRequired: true,
  serverSideOnly: true,
  scopes: OUTLOOK_CALENDAR_SCOPES,
  documentationUrl:
    "https://learn.microsoft.com/en-us/graph/api/resources/calendar",
} satisfies IntegrationDefinition;

export type OutlookCalendarOperation =
  | "list_calendars"
  | "list_events"
  | "find_available_slots"
  | "create_event";

export class OutlookCalendarError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "OutlookCalendarError";
  }
}

type GraphError = { error?: { message?: string } };

async function graphRequest<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${MICROSOFT_GRAPH_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as GraphError | null;
    throw new OutlookCalendarError(
      payload?.error?.message ?? `Microsoft Graph respondeu com HTTP ${response.status}.`,
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export type OutlookCalendar = {
  id: string;
  name: string | null;
  isDefaultCalendar: boolean | null;
  canEdit: boolean | null;
};

export type OutlookEvent = {
  id: string;
  subject: string | null;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  webLink?: string | null;
  isAllDay?: boolean | null;
  showAs?: string | null;
};

export type OutlookAvailableSlot = {
  start_datetime: string;
  end_datetime: string;
  duration_minutes: number;
};

export class OutlookCalendarClient {
  constructor(private readonly accessToken: string) {}

  async listCalendars(): Promise<OutlookCalendar[]> {
    const data = await graphRequest<{
      value: Array<{
        id: string;
        name?: string | null;
        isDefaultCalendar?: boolean | null;
        canEdit?: boolean | null;
      }>;
    }>(this.accessToken, "/me/calendars");

    return data.value.map((calendar) => ({
      id: calendar.id,
      name: calendar.name ?? null,
      isDefaultCalendar: calendar.isDefaultCalendar ?? null,
      canEdit: calendar.canEdit ?? null,
    }));
  }

  async listEvents(
    start: string,
    end: string,
    calendarId?: string,
  ): Promise<OutlookEvent[]> {
    const path = calendarId
      ? `/me/calendars/${encodeURIComponent(calendarId)}/calendarView?startDateTime=${encodeURIComponent(start)}&endDateTime=${encodeURIComponent(end)}`
      : `/me/calendarView?startDateTime=${encodeURIComponent(start)}&endDateTime=${encodeURIComponent(end)}`;

    const data = await graphRequest<{
      value: OutlookEvent[];
    }>(this.accessToken, path, {
      headers: { Prefer: 'outlook.timezone="UTC"' },
    });

    return data.value;
  }

  async findAvailableSlots(
    start: string,
    end: string,
    durationMinutes: number,
  ): Promise<OutlookAvailableSlot[]> {
    const data = await graphRequest<{
      value?: Array<{
        scheduleId?: string;
        availabilityView?: string;
        scheduleItems?: Array<{
          start: { dateTime: string; timeZone: string };
          end: { dateTime: string; timeZone: string };
        }>;
      }>;
    }>(this.accessToken, "/me/calendar/getSchedule", {
      method: "POST",
      body: JSON.stringify({
        schedules: ["me"],
        startTime: { dateTime: start, timeZone: "UTC" },
        endTime: { dateTime: end, timeZone: "UTC" },
        availabilityViewInterval: durationMinutes,
      }),
    });

    const schedule = data.value?.[0];
    if (!schedule?.availabilityView) return [];

    const slots: OutlookAvailableSlot[] = [];
    const interval = durationMinutes;
    for (let index = 0; index < schedule.availabilityView.length; index += 1) {
      if (schedule.availabilityView[index] !== "0") continue;
      let endIndex = index + 1;
      while (
        endIndex < schedule.availabilityView.length &&
        schedule.availabilityView[endIndex] === "0"
      ) {
        endIndex += 1;
      }
      const availableMinutes = (endIndex - index) * interval;
      if (availableMinutes < durationMinutes) continue;

      const startDate = new Date(start);
      startDate.setUTCMinutes(startDate.getUTCMinutes() + index * interval);
      const endDate = new Date(startDate);
      endDate.setUTCMinutes(endDate.getUTCMinutes() + durationMinutes);

      slots.push({
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
        duration_minutes: durationMinutes,
      });
    }

    return slots;
  }

  async createEvent(input: {
    subject: string;
    start: string;
    end: string;
    body?: string;
    calendarId?: string;
    reminderMinutesBeforeStart?: number;
  }): Promise<OutlookEvent> {
    const path = input.calendarId
      ? `/me/calendars/${encodeURIComponent(input.calendarId)}/events`
      : "/me/calendar/events";

    return graphRequest<OutlookEvent>(this.accessToken, path, {
      method: "POST",
      body: JSON.stringify({
        subject: input.subject,
        body: { contentType: "Text", content: input.body ?? "" },
        start: { dateTime: input.start, timeZone: "UTC" },
        end: { dateTime: input.end, timeZone: "UTC" },
        isReminderOn: true,
        reminderMinutesBeforeStart:
          input.reminderMinutesBeforeStart ?? 15,
        showAs: "busy",
      }),
    });
  }

  async execute(
    operation: OutlookCalendarOperation,
    input: Record<string, unknown>,
  ): Promise<IntegrationToolResult> {
    switch (operation) {
      case "list_calendars":
        return {
          providerId: OUTLOOK_CALENDAR_PROVIDER_ID,
          tool: operation,
          output: await this.listCalendars(),
        };
      case "list_events":
        return {
          providerId: OUTLOOK_CALENDAR_PROVIDER_ID,
          tool: operation,
          output: await this.listEvents(
            String(input.start),
            String(input.end),
            typeof input.calendarId === "string" ? input.calendarId : undefined,
          ),
        };
      case "find_available_slots":
        return {
          providerId: OUTLOOK_CALENDAR_PROVIDER_ID,
          tool: operation,
          output: await this.findAvailableSlots(
            String(input.start),
            String(input.end),
            Number(input.durationMinutes),
          ),
        };
      case "create_event":
        return {
          providerId: OUTLOOK_CALENDAR_PROVIDER_ID,
          tool: operation,
          output: await this.createEvent({
            subject: String(input.subject),
            start: String(input.start),
            end: String(input.end),
            body: typeof input.body === "string" ? input.body : undefined,
            calendarId:
              typeof input.calendarId === "string" ? input.calendarId : undefined,
            reminderMinutesBeforeStart:
              typeof input.reminderMinutesBeforeStart === "number"
                ? input.reminderMinutesBeforeStart
                : undefined,
          }),
        };
    }
  }
}
