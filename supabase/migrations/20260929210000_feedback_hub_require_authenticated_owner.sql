-- Feedback Hub: every persisted response must belong to an authenticated user.
alter table public.feedback_responses
  alter column user_id set not null;

revoke all on table public.feedback_responses from anon;
revoke all on table public.feedback_responses from authenticated;
grant select, insert on table public.feedback_responses to authenticated;
