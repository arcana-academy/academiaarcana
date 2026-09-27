import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const ITERATIONS = 50;
const PARALLEL_PAIRS = 10;
const TEST_EMAIL = "move-workspace-concurrency@example.com";
const TEST_PASSWORD = "MoveWorkspacePage123!";
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function localStatus() {
  const executable = path.join(
    projectRoot,
    "node_modules",
    "supabase",
    "dist",
    "supabase.js",
  );
  const output = execFileSync(
    process.execPath,
    [executable, "status", "-o", "json"],
    {
      cwd: projectRoot,
      encoding: "utf8",
    },
  );
  return JSON.parse(output);
}

function checked(result, operation) {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`);
  return result.data;
}

async function authenticate(url, key) {
  const client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  let result = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (result.error) {
    result = await client.auth.signUp({ email: TEST_EMAIL, password: TEST_PASSWORD });

    if (result.data.session === null) {
      result = await client.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
    }
  }

  checked(result, "autenticação local");
  assert(result.data.session, "Sessão local ausente.");
  return { client, userId: result.data.user.id };
}

async function createFixture(client, userId) {
  const grimoireId = randomUUID();
  const notebookId = randomUUID();

  checked(
    await client.from("grimoires").insert({
      id: grimoireId,
      owner_id: userId,
      title: "Concorrência moveWorkspacePage",
    }),
    "criar grimório",
  );
  checked(
    await client.from("notebooks").insert({
      id: notebookId,
      grimoire_id: grimoireId,
      title: "Concorrência",
      position: 0,
    }),
    "criar caderno",
  );

  const chapters = Array.from({ length: ITERATIONS }, (_, position) => ({
    id: randomUUID(),
    position,
  }));
  checked(
    await client.from("chapters").insert(
      chapters.map((chapter) => ({
        id: chapter.id,
        notebook_id: notebookId,
        title: `Capítulo ${chapter.position + 1}`,
        position: chapter.position,
      })),
    ),
    "criar capítulos",
  );

  const pages = chapters.flatMap((chapter) =>
    [0, 1, 2].map((position) => ({
      id: randomUUID(),
      chapterId: chapter.id,
      position,
    })),
  );
  checked(
    await client.from("pages").insert(
      pages.map((page) => ({
        id: page.id,
        chapter_id: page.chapterId,
        title: `Página ${page.position + 1}`,
        content: { type: "document", blocks: [] },
        position: page.position,
      })),
    ),
    "criar páginas",
  );

  return { grimoireId, chapters, pages };
}

async function runMoves(client, fixture) {
  const byChapter = new Map(
    fixture.chapters.map((chapter) => [
      chapter.id,
      fixture.pages.filter((page) => page.chapterId === chapter.id),
    ]),
  );

  for (let offset = 0; offset < ITERATIONS; offset += PARALLEL_PAIRS) {
    const calls = [];
    for (const chapter of fixture.chapters.slice(offset, offset + PARALLEL_PAIRS)) {
      const pages = byChapter.get(chapter.id);
      assert(pages?.length === 3, `Fixture inválida: ${chapter.id}.`);
      calls.push(
        client.rpc("move_workspace_page", {
          p_page_id: pages[0].id,
          p_direction: "down",
        }),
        client.rpc("move_workspace_page", {
          p_page_id: pages[1].id,
          p_direction: "up",
        }),
      );
    }

    for (const result of await Promise.all(calls)) {
      checked(result, "movimentação concorrente");
      assert(
        result.data && typeof result.data === "object",
        "Resposta concorrente sem moved_page.",
      );
    }
  }
}

async function assertFinalState(client, fixture) {
  const rows = checked(
    await client
      .from("pages")
      .select("chapter_id, position")
      .in("chapter_id", fixture.chapters.map((chapter) => chapter.id)),
    "verificar estado final",
  );
  assert(rows.length === ITERATIONS * 3, "A consulta final perdeu páginas.");

  for (const chapter of fixture.chapters) {
    const positions = rows
      .filter((row) => row.chapter_id === chapter.id)
      .map((row) => row.position)
      .sort((left, right) => left - right);
    assert(
      JSON.stringify(positions) === JSON.stringify([0, 1, 2]),
      `Posições inválidas em ${chapter.id}: ${positions.join(",")}.`,
    );
  }

  const keys = rows.map((row) => `${row.chapter_id}:${row.position}`);
  assert(new Set(keys).size === keys.length, "Posições duplicadas persistidas.");
}

async function main() {
  const status = localStatus();
  const url = status.API_URL ?? status.api?.url;
  const key =
    status.PUBLISHABLE_KEY ??
    status.api?.publishable_keys?.[0] ??
    status.ANON_KEY ??
    status.api?.anon_key;
  assert(url, "Supabase local não expôs API_URL.");
  assert(key, "Supabase local não expôs PUBLISHABLE_KEY.");

  const { client, userId } = await authenticate(url, key);
  let fixture;

  try {
    fixture = await createFixture(client, userId);
    const startedAt = Date.now();
    await runMoves(client, fixture);
    await assertFinalState(client, fixture);
    process.stdout.write(
      `${JSON.stringify({
        iterations: ITERATIONS,
        rpcCalls: ITERATIONS * 2,
        chapters: ITERATIONS,
        duplicatePositions: 0,
        durationMs: Date.now() - startedAt,
        passed: true,
      })}\n`,
    );
  } finally {
    if (fixture) {
      const cleanup = await client
        .from("grimoires")
        .delete()
        .eq("id", fixture.grimoireId);
      if (cleanup.error) {
        process.stderr.write(`Falha na limpeza: ${cleanup.error.message}\n`);
      }
    }
  }
}

await main();
