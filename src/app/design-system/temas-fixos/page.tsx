import type { Metadata } from "next";
import { FixedThemePreviews } from "@/components/themes/FixedThemePreviews";

export const metadata: Metadata = {
  title: "Temas fixos — prévia | Academia Arcana",
  description: "Comparação das quatro propostas visuais usando presets do Design System existente.",
  robots: { index: false, follow: false },
};

export default function FixedThemesPage() {
  return (
    <main style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Temas fixos — prévias de implementação</h1>
      <p>Propostas que reutilizam os tokens existentes. Não são configurações aplicadas à conta.</p>
      <FixedThemePreviews />
    </main>
  );
}
