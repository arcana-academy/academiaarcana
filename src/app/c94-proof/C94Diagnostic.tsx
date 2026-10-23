"use client";

import { useState } from "react";
import { useTheme } from "@/design-system/themes";
import { PagePaperStyleView } from "@/components/workspace/PagePaperStyleView";
import { PageFrameStyleView } from "@/components/workspace/PageFrameStyleView";
import { PageEditor } from "@/components/workspace/PageEditor";
import type { Page } from "@/domains/learning";

/** Synthetic-only C94 route lives on diagnostic branch, never in release PRs. */
const fixturePage: Page = {
  id: "c94-synthetic-browser-page",
  chapterId: "c94-chapter",
  title: "Conhecimento científico — demonstração",
  content: { type: "document", blocks: [] },
  position: 0,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

export default function C94Diagnostic() {
  const { setAppearance } = useTheme();
  const [saves, setSaves] = useState(0);
  return (
    <main style={{ maxWidth: "60rem", width: "100%", marginInline: "auto", padding: "1rem" }}>
      <h1>C94 — experimento sintético de composição</h1>
      <button type="button" onClick={() => setAppearance("light")}>Tema claro C94</button>
      <p aria-label="Contagem de gravações" data-testid="c94-save-count">{saves}</p>
      <PagePaperStyleView pageId={fixturePage.id}>
        <PageFrameStyleView pageId={fixturePage.id}>
          <PageEditor
            page={fixturePage}
            canMoveUp={false}
            canMoveDown={false}
            onMove={async () => undefined}
            onDelete={async () => undefined}
            onSave={async ({ title, content }) => {
              setSaves((v) => v + 1);
              return { ...fixturePage, title, content };
            }}
          />
        </PageFrameStyleView>
      </PagePaperStyleView>
    </main>
  );
}
