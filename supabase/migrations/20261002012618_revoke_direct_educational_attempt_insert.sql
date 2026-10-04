-- Educational evidence must be recorded only through the atomic authenticated RPC.
revoke insert
  on table public.educational_practice_attempts
  from authenticated;
