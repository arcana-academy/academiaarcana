"use client";
import { useState } from "react";
import type { Page } from "@/domains/learning";
import { PageEditor } from "@/components/workspace/PageEditor";

const initialPage: Page = {
  id: "synthetic-export-c97",
  chapterId: "synthetic-c97-chapter",
  title: "Anotações sobre astronomia",
  content: {
    type: "document",
    blocks: [
      { type: "paragraph", content: "Dados sintéticos de estudo." },
      { type: "image", content: "Referência ilustrativa fictícia",
        accessibility: { description: "Órbitas circulares descritas em palavras." } },
      { type: "image", content: "Ornamento decorativo fictício",
        accessibility: { decorative: true } },
    ],
  },
  position: 0,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

export default function SyntheticExportPage() {
  const [saves, setSaves] = useState(0);
  return (
    <main style={{ padding: "1rem", maxWidth: "54rem", marginInline: "auto" }}>
      <h1>C97 — diagnóstico sintético de exportação</h1>
      <p data-testid="c97-saves">{saves}</p>
      <PageEditor
        page={initialPage}
        canMoveUp={false}
        canMoveDown={false}
        onMove={async () => undefined}
        onDelete={async () => undefined}
        onSave={async (input) => {
          setSaves((current) => current + 1);
          return { ...initialPage, ...input };
        }}
      />
    </main>
  );
}
