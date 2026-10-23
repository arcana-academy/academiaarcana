"use client";

import { useState } from "react";
import { PageEditor } from "@/components/workspace/PageEditor";
import type { Page } from "@/domains/learning";

/** Synthetic test fixture; never part of a release PR. */
const example: Page = {
  id: "c98-synthetic-private",
  chapterId: "c98-synthetic-chapter",
  title: "Pesquisa interdisciplinar",
  content: {
    type: "document",
    blocks: [
      { type: "paragraph", content: "Observação inicial." },
      { type: "image", content: "midia/referencia-ficticia.png",
        accessibility: { description: "Diagrama das fases lunares.", decorative: false } },
      { type: "image", content: "ornamento-ficticio.png",
        accessibility: { decorative: true } },
    ],
  },
  position: 0,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

export default function C98ExportFixture() {
  const [saves, setSaves] = useState(0);
  return (
    <main style={{ maxWidth: "55rem", marginInline: "auto", padding: "1rem" }}>
      <h1>C98 — Apenas dados sintéticos</h1>
      <output data-testid="save-count">{saves}</output>
      <PageEditor page={example}
        canMoveUp={false}
        canMoveDown={false}
        onMove={async () => undefined}
        onDelete={async () => undefined}
        onSave={async (input) => {
          setSaves((n) => n + 1);
          return { ...example, ...input };
        }}
      />
    </main>
  );
}
