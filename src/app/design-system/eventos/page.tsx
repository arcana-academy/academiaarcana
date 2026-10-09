import type { Metadata } from "next";
import { EventTemplatePreview } from "@/components/events/EventTemplatePreview";
import { EVENT_THEME_IDS } from "@/design-system/event-themes/catalog";
import "@/design-system/event-themes/event-themes.css";

export const metadata: Metadata = {
  title: "Prévia de temas de eventos | Academia Arcana",
  description: "Referências demonstrativas de temas sazonais, não eventos publicados.",
  robots: { index: false, follow: false },
};

export default function EventThemesPreviewPage() {
  return (
    <main id="conteudo" style={{ maxWidth: "74rem", padding: "2rem 1rem", margin: "0 auto" }}>
      <h1>Temas de eventos — propostas visuais</h1>
      <p>Prévia interna do Design System. Nenhuma inscrição, anúncio ou conexão externa está ativa nesta página.</p>
      <div style={{ display: "grid", gap: "1.5rem", paddingTop: "1rem" }}>
        {EVENT_THEME_IDS.map((id) => <EventTemplatePreview key={id} themeId={id} />)}
      </div>
    </main>
  );
}
