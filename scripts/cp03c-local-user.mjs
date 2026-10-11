import { createClient } from "@supabase/supabase-js";
import { validateCp03cIsolation, verifyLocalAuthReady } from "./cp03c-local-boundary.mjs";

const env = process.env;
const { supabase } = validateCp03cIsolation(env, { requireUser: true, requireAdmin: true });
await verifyLocalAuthReady(env);
const client = createClient(supabase, env.CP03C_EPHEMERAL_SUPABASE_ADMIN_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await client.auth.admin.createUser({
  email: env.E2E_EMAIL,
  password: env.E2E_PASSWORD,
  email_confirm: true,
});
if (error || !data?.user?.id) throw new Error("CP03C BLOCKED: disposable local user provisioning failed");
console.log("CP03C OK: one disposable user created in loopback Supabase Auth");
