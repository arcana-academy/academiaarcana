"use client";

import { useTheme } from "@/design-system/themes";
import { PagePaperStyleView } from "@/components/workspace/PagePaperStyleView";
import { PageEditor } from "@/components/workspace/PageEditor";
import type { Page } from "@/domains/learning";

const page: Page = {
  id: "c96-proof", chapterId: "c96-chapter", title: "Conteúdo sintético",
  content: { type: "document", blocks: [
    { type: "paragraph", content: "Texto de estudo a ser lido com contraste." },
    { type: "image", content: "Referência fictícia", accessibility: { description: "Descrição significativa.", decorative: false } },
  ] },
  position: 0, createdAt: "2026-01-01", updatedAt: "2026-01-01",
};

export default function C96PreviewFixture() {
  const { setAppearance } = useTheme();
  return (
    <main style={{ maxWidth: "55rem", marginInline: "auto", padding: "1rem" }}>
      <h1>C96 — Dados sintéticos</h1>
      <button type="button" onClick={() => setAppearance("light")}>Usar tema claro</button>
      <PagePaperStyleView pageId={page.id}>
        <PageEditor page={page} canMoveUp={false} canMoveDown={false}
          onMove={async () => undefined}
          onDelete={async () => undefined}
          onSave={async ({ title, content }) => ({ ...page, title, content })}
        />
      </PagePaperStyleView>
    </main>
  );
}
