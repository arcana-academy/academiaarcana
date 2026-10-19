import { OutlookCalendarClient } from "@/infrastructure/integrations/outlook-calendar";
import {
  getOutlookAccessToken,
  isOutlookCalendarConnected,
} from "@/infrastructure/integrations/outlook-calendar-session";
import { SupabaseStudyTaskRepository } from "@/infrastructure/supabase/planning/study-task-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { StudyTaskBoard } from "@/components/planning/StudyTaskBoard";

import {
  completeStudyTaskAction,
  createStudyTask,
} from "./actions";
import { createOutlookEventForTask } from "./outlook-actions";

/**
 * Render the authenticated user's pending tasks and next seven days of Outlook events.
 * Redirect unauthenticated users to login and refresh the Outlook token when needed.
 * Missing tokens and token/event retrieval failures render an unavailable calendar;
 * task loading and Outlook connection lookup errors propagate to the caller.
 */
export default async function CronogramaPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabaseStudyTaskRepository(supabase);

  const tasks = await repository.listUpcoming(
    claims.sub,
    new Date().toISOString(),
  );

  const outlookConnected = await isOutlookCalendarConnected();
  let outlookEventsUnavailable = false;
  let outlookEvents: Awaited<
    ReturnType<OutlookCalendarClient["listEvents"]>
  > = [];

  if (outlookConnected) {
    try {
      const accessToken = await getOutlookAccessToken({ refresh: true });
      if (accessToken) {
        const start = new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        outlookEvents = await new OutlookCalendarClient(accessToken).listEvents(
          start.toISOString(),
          end.toISOString(),
        );
      } else {
        // The connection can disappear before the token lookup completes.
        outlookEventsUnavailable = true;
      }
    } catch {
      outlookEventsUnavailable = true;
      outlookEvents = [];
    }
  }

  return (
    <AuthenticatedShell currentPath="/cronograma">
      <StudyTaskBoard
        tasks={tasks}
        outlookConnected={outlookConnected}
        outlookEvents={outlookEvents}
        outlookEventsUnavailable={outlookEventsUnavailable}
        onCreate={createStudyTask}
        onComplete={completeStudyTaskAction}
        onScheduleInOutlook={createOutlookEventForTask}
      />
    </AuthenticatedShell>
  );
}
