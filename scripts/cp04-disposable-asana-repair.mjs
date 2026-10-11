// CP04 diagnostic candidate. Execute ONLY after composing the pinned PRs in
// a disposable GitHub Actions runner. Never commit/push patched application files.
import { readFileSync, writeFileSync } from "node:fs";

function rewrite(path, operations) {
  let content = readFileSync(path, "utf8");
  for (const [before, after] of operations) {
    const hits = content.split(before).length - 1;
    if (hits !== 1) throw new Error(`CP04 REPAIR ABORT: expected one anchor in ${path}; found ${hits}`);
    content = content.replace(before, after);
  }
  writeFileSync(path, content);
  console.log(`CP04 EPHEMERAL REPAIR: ${path}`);
}

const adapter = "src/infrastructure/integrations/asana.ts";
let original = readFileSync(adapter, "utf8");
const start = original.indexOf("export async function refreshAsanaCredentials(");
const end = original.indexOf("\nasync function asanaRequest", start);
if (start < 0 || end < 0) throw new Error("CP04 REPAIR ABORT: refresh function boundary changed");
let fragment = original.slice(start, end);
const anchor1 = "  const response = await fetch(ASANA_OAUTH_TOKEN_URL, {";
const anchor2 = '  });\n\n  if (!response.ok) {\n    throw new AsanaConnectionError("A autorização do Asana expirou ou foi revogada. Reconecte a conta.", "reauthorization_required");\n  }';
if (fragment.split(anchor1).length !== 2 || fragment.split(anchor2).length !== 2) {
  throw new Error("CP04 REPAIR ABORT: Asana refresh exact anchors changed");
}
fragment = fragment.replace(anchor1,
  "  let response: Response;\n  try {\n    response = await fetch(ASANA_OAUTH_TOKEN_URL, {");
fragment = fragment.replace(anchor2,
  '  });\n  } catch {\n    throw new AsanaConnectionError("Falha temporária na renovação Asana.", "request_failed");\n  }\n\n  if (!response.ok) {\n    if (response.status === 408 || response.status === 429 || response.status >= 500) {\n      throw new AsanaConnectionError("Renovação Asana temporariamente indisponível.", "request_failed");\n    }\n    throw new AsanaConnectionError("A autorização do Asana expirou ou foi revogada. Reconecte a conta.", "reauthorization_required");\n  }');
writeFileSync(adapter, original.slice(0, start) + fragment + original.slice(end));
console.log(`CP04 EPHEMERAL REPAIR: ${adapter}`);

rewrite("src/app/api/integrations/asana/_lib.ts", [
  ["  ASANA_CREDENTIALS_COOKIE,\n  decryptAsanaCredentials,", "  ASANA_CREDENTIALS_COOKIE,\n  AsanaConnectionError,\n  decryptAsanaCredentials,"],
  [
    '    } catch {\n      cookieStore.delete(ASANA_CREDENTIALS_COOKIE);\n      return { credentials: null, status: "reauthorization_required" as const };\n    }',
    '    } catch (error) {\n      if (error instanceof AsanaConnectionError &&\n          (error.code === "request_failed" || error.code === "rate_limited")) {\n        return { credentials: null, status: "request_failed" as const };\n      }\n      cookieStore.delete(ASANA_CREDENTIALS_COOKIE);\n      return { credentials: null, status: "reauthorization_required" as const };\n    }',
  ],
]);

rewrite("src/app/api/integrations/asana/projects/route.ts", [
  ['      status: 200, headers: { "Cache-Control": "private, no-store" },',
   '      status: status === "request_failed" ? 502 : 200, headers: { "Cache-Control": "private, no-store" },'],
]);

rewrite("src/app/api/integrations/asana/tasks/route.ts", [
  ['  if (!credentials) return NextResponse.json({ providerId: "asana", status, tasks: [] }, {\n    headers: { "Cache-Control": "private, no-store" },',
   '  if (!credentials) return NextResponse.json({ providerId: "asana", status, tasks: [] }, {\n    status: status === "request_failed" ? 502 : 200,\n    headers: { "Cache-Control": "private, no-store" },'],
  // Both write methods share exactly one intended status expression.
  ['  if (!credentials) return NextResponse.json({ providerId: "asana", status }, { status: 401 });\n\n  try {\n    const body = await request.json() as {\n      name?: string;',
   '  if (!credentials) return NextResponse.json({ providerId: "asana", status }, { status: status === "request_failed" ? 502 : 401 });\n\n  try {\n    const body = await request.json() as {\n      name?: string;'],
  ['  if (!credentials) return NextResponse.json({ providerId: "asana", status }, { status: 401 });\n\n  try {\n    const body = await request.json() as { taskId?: string };',
   '  if (!credentials) return NextResponse.json({ providerId: "asana", status }, { status: status === "request_failed" ? 502 : 401 });\n\n  try {\n    const body = await request.json() as { taskId?: string };'],
]);
console.log("CP04 PROPOSED EPHEMERAL REPAIR READY: no branch or PR modified");
