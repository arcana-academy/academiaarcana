-- Least-privilege hardening for the study-task reward RPCs.
-- The application-facing wrapper and the privileged implementation are only
-- needed by the authenticated application flow.

revoke execute on function public.complete_study_task_with_reward(uuid)
  from service_role;

revoke execute on function private.complete_study_task_with_reward(uuid)
  from service_role;
