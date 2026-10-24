"use client";

import { useState } from "react";
import { PageEditor } from "@/components/workspace/PageEditor";
import type { Page } from "@/domains/learning";

/** Synthetic diagnostic route, restricted to an unmerged C99 proof branch. */
const fixture: Page = {
  id: "c99-synthetic-study",
  chapterId: "c99-synthetic-chapter",
  title: "Aula sintética acessível",
  content: {
    type: "document",
    blocks: [
      { type: "image", content: "referencia-sonora-ficticia.wav",
        accessibility: { description: "Descrição autoral original.", decorative: false } },
      { type: "notation-experimental", content: "Dó Ré Mi",
        accessibility: { description: "Três notas ascendentes." } },
      { type: "image", content: "moldura-decorativa-ficticia.png",
        accessibility: { decorative: true } },
    ],
  },
  position: 0,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

export default function C99AccessibilityProof() {
  const [saves, setSaves] = useState(0);
  return (
    <main style={{ maxWidth: "56rem", margin: "0 auto", padding: "1rem" }}>
      <h1>C99 — Prova sintética, sem mídia ou contas reais</h1>
      <output data-testid="c99-save-count" aria-label="Salvamentos confirmados">{saves}</output>
      <PageEditor
        page={fixture}
        canMoveUp={false}
        canMoveDown={false}
        onMove={async () => undefined}
        onDelete={async () => undefined}
        onSave={async (input) => {
          setSaves((count) => count + 1);
          return { ...fixture, ...input };
        }}
      />
    </main>
  );
}
