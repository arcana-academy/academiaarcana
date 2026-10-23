import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

// Fail closed: never direct synthetic-account tests at a hosted database.
const raw = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8" });
const variables = Object.fromEntries(raw.split(/\r?\n/).flatMap(line => {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  return match ? [[match[1], match[2].replace(/^["']|["']$/g, "")]] : [];
}));
const url = new URL(variables.API_URL);
assert.equal(url.protocol, "http:");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
assert.ok(variables.ANON_KEY);

function client() {
  const entries = new Map();
  return createClient(url.toString(), variables.ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: true, detectSessionInUrl: false,
      storage: { getItem: k => entries.get(k) ?? null,
        setItem: (k, v) => entries.set(k, v), removeItem: k => entries.delete(k) } },
  });
}
function ok(result) { assert.ifError(result.error); return result.data; }
function sessionId(jwt) {
  const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"));
  assert.ok(payload.exp && payload.session_id);
  return payload.session_id;
}
async function main() {
  const a1 = client(), a2 = client(), b = client();
  const seed = `${Date.now()}-${process.pid}`;
  const emailA = `a-${seed}@example.test`, emailB = `b-${seed}@example.test`;
  const password = "Isolated-Auth-QA-2026!";
  const aa = ok(await a1.auth.signUp({ email: emailA, password }));
  const bb = ok(await b.auth.signUp({ email: emailB, password }));
  assert.ok(aa.user && aa.session && bb.user && bb.session);
  const second = ok(await a2.auth.signInWithPassword({ email: emailA, password }));
  assert.ok(second.session);
  assert.notEqual(sessionId(aa.session.access_token), sessionId(second.session.access_token));
  assert.notEqual(aa.user.id, bb.user.id);

  const rowA = ok(await a2.from("grimoires").insert({ owner_id: aa.user.id, title: "test A" }).select("id").single());
  const rowB = ok(await b.from("grimoires").insert({ owner_id: bb.user.id, title: "test B" }).select("id").single());
  const aRows = ok(await a2.from("grimoires").select("id"));
  const bRows = ok(await b.from("grimoires").select("id"));
  assert.deepEqual(aRows.map(x => x.id), [rowA.id]);
  assert.deepEqual(bRows.map(x => x.id), [rowB.id]);
  const attempted = ok(await a2.from("grimoires").update({ title: "denied" }).eq("id", rowB.id).select("id"));
  assert.equal(attempted.length, 0);
  console.log("PASS: isolated two-account RLS behavior");

  // C25: extend the already-isolated two-account exercise to the actual
  // task-completion RPC, with no external endpoints or productive identities.
  const taskA = ok(await a2.from("study_tasks")
    .insert({ owner_id: aa.user.id, title: "Synthetic task A" })
    .select("id").single());
  const taskB = ok(await b.from("study_tasks")
    .insert({ owner_id: bb.user.id, title: "Synthetic task B" })
    .select("id").single());

  const forgedOwner = await a2.from("study_tasks")
    .insert({ owner_id: bb.user.id, title: "Forged task owner" })
    .select("id").single();
  assert.ok(forgedOwner.error, "RLS must reject an insert claiming a different owner");
  assert.equal(forgedOwner.error.code, "42501");

  const crossRead = ok(await a2.from("study_tasks").select("id").eq("id", taskB.id));
  assert.equal(crossRead.length, 0, "Account A cannot read B's task");

  const foreignCompletion = await a2.rpc("complete_study_task_with_reward", {
    p_task_id: taskB.id,
  });
  assert.ok(foreignCompletion.error, "Cross-owner reward RPC must reject the task");
  assert.equal(foreignCompletion.error.code, "P0002");
  const bPending = ok(await b.from("study_tasks")
    .select("status").eq("id", taskB.id).single());
  assert.equal(bPending.status, "pending", "Denied RPC must not complete B's task");
  const bBefore = ok(await b.from("gamification_profiles").select("xp"));
  assert.equal(bBefore.length, 0, "Denied RPC must not create B's reward profile");

  const firstA = ok(await a2.rpc("complete_study_task_with_reward", {
    p_task_id: taskA.id,
  }));
  assert.equal(firstA.length, 1);
  assert.equal(firstA[0].task_id, taskA.id);
  assert.equal(firstA[0].task_owner_id, aa.user.id);
  assert.equal(firstA[0].task_status, "completed");
  assert.equal(firstA[0].mission_completed, true);
  assert.equal(Number(firstA[0].xp), 10);

  const retryA = ok(await a2.rpc("complete_study_task_with_reward", {
    p_task_id: taskA.id,
  }));
  assert.equal(retryA.length, 1);
  assert.equal(retryA[0].task_status, "completed");
  assert.equal(retryA[0].mission_completed, false, "Repeat RPC must not award again");
  assert.equal(Number(retryA[0].xp), 10, "Retry must preserve exactly 10 XP");

  const aMissions = ok(await a2.from("missions")
    .select("code,completed_at").eq("code", "complete-study-task"));
  assert.equal(aMissions.length, 1, "One daily mission per owner");
  assert.ok(aMissions[0].completed_at);
  const bOwn = ok(await b.rpc("complete_study_task_with_reward", { p_task_id: taskB.id }));
  assert.equal(bOwn.length, 1);
  assert.equal(bOwn[0].task_owner_id, bb.user.id);
  assert.equal(bOwn[0].mission_completed, true);
  assert.equal(Number(bOwn[0].xp), 10);

  const aProfile = ok(await a2.from("gamification_profiles").select("owner_id,xp"));
  const bProfile = ok(await b.from("gamification_profiles").select("owner_id,xp"));
  assert.deepEqual(aProfile.map(row => [row.owner_id, Number(row.xp)]), [[aa.user.id, 10]]);
  assert.deepEqual(bProfile.map(row => [row.owner_id, Number(row.xp)]), [[bb.user.id, 10]]);
  const bMissions = ok(await b.from("missions").select("code"));
  assert.deepEqual(bMissions.map(row => row.code), ["complete-study-task"]);
  console.log("PASS: local two-account task RLS, cross-owner RPC denial, retry idempotency, independent XP/missions");

  ok(await a1.auth.signOut({ scope: "global" }));
  assert.ok((await a2.auth.refreshSession()).error, "Session A2 must not refresh");
  assert.ok(ok(await b.auth.refreshSession()).session, "Independent B session must survive");
  console.log("PASS: global sign-out revokes other refresh token; B remains signed in");
  console.log("NOTE: old access JWT validity until exp is not asserted or misreported");
}
main().catch(error => { console.error("FAIL: local Auth QA:", error.message); process.exitCode = 1; });
