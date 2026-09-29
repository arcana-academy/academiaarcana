import { SupabaseStudyTaskRepository } from "@/infrastructure/supabase/planning/study-task-repository";
import { isOutlookCalendarConnected } from "@/infrastructure/integrations/outlook-calendar-session";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { StudyTaskBoard } from "@/components/planning/StudyTaskBoard";

import {
  completeStudyTaskAction,
  createStudyTask,
} from "./actions";
import { createOutlookEventForTask } from "./outlook-actions";

export default async function CronogramaPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabaseStudyTaskRepository(supabase);

  const tasks = await repository.listUpcoming(
    claims.sub,
    new Date().toISOString(),
  );

  const outlookConnected = await isOutlookCalendarConnected();

  return (
    <AuthenticatedShell currentPath="/cronograma">
      <StudyTaskBoard
        tasks={tasks}
        outlookConnected={outlookConnected}
        onCreate={createStudyTask}
        onComplete={completeStudyTaskAction}
        onScheduleInOutlook={createOutlookEventForTask}
      />
    </AuthenticatedShell>
  );
}
