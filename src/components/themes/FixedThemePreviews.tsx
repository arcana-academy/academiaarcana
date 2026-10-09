import Image from "next/image";
import type { CSSProperties } from "react";
import { FEATURED_THEME_CHOICES } from "@/design-system/themes/featured-themes";
import { themePresets } from "@/design-system/themes/presets";

export function FixedThemePreviews() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {FEATURED_THEME_CHOICES.map((choice) => {
        const tokens = themePresets[choice.presetId];
        const surface: CSSProperties = {
          background: tokens.surfaces.canvas,
          color: tokens.text.primary,
          border: `1px solid ${tokens.border.default}`,
          borderRadius: tokens.radius.lg,
          padding: "1rem",
        };
        const panel: CSSProperties = {
          background: tokens.surfaces.panel,
          border: `1px solid ${tokens.border.default}`,
          borderRadius: tokens.radius.md,
          padding: "0.85rem",
        };
        return (
          <section key={choice.id} aria-labelledby={`theme-${choice.id}`} style={surface}>
            <h2 id={`theme-${choice.id}`} style={{ marginBottom: "0.25rem", color: tokens.text.primary }}>
              {choice.label}
            </h2>
            <p style={{ marginBottom: "1rem", color: tokens.text.secondary }}>{choice.description}</p>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 3fr", gap: "0.75rem" }}>
              <aside aria-label={`Prévia da barra lateral: ${choice.label}`} style={panel}>
                <p style={{ color: tokens.accent.primary, fontWeight: 700 }}>Academia Arcana</p>
                <p style={{ color: tokens.text.secondary }}>Santuário</p>
                <p style={{ color: tokens.text.secondary }}>Grimórios</p>
                <p style={{ color: tokens.text.secondary }}>Cronograma</p>
              </aside>
              <div style={{ display: "grid", gap: "0.75rem", minWidth: 0 }}>
                <header style={panel}>
                  <strong>Cabeçalho · Sua jornada</strong>
                </header>
                <div style={panel}>
                  <h3 style={{ color: tokens.accent.primary }}>Painel de estudo</h3>
                  <p style={{ color: tokens.text.secondary }}>
                    Prévia de hierarquia, tipografia e superfície. Dados de aprendizagem não são carregados.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Image
                      src="/assets/flonts/flonts-mago-mini-96.webp"
                      alt=""
                      width={48}
                      height={60}
                      style={{ objectFit: "contain", flexShrink: 0 }}
                    />
                    <span>Flonts está com você</span>
                  </div>
                </div>
                <footer style={{ ...panel, color: tokens.text.secondary }}>
                  Rodapé · Links e informações institucionais
                </footer>
              </div>
            </div>
            <p style={{ marginTop: "0.75rem", color: tokens.text.secondary, fontSize: "0.875rem" }}>
              Prévia visual · Preset existente: {tokens.name} · Nenhuma preferência foi alterada.
            </p>
          </section>
        );
      })}
    </div>
  );
}
