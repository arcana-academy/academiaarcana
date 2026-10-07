"use client";

import { useEffect } from "react";

import { Badge, Button, Card, Input, Progress } from "@/components/ui";
import { useTheme } from "@/design-system/themes";
import { THEME_IDS, themePresets } from "@/design-system/themes/presets";
import type { ThemeId } from "@/design-system/tokens/types";

function isThemeId(value: string | null): value is ThemeId {
  return Boolean(value && THEME_IDS.includes(value as ThemeId));
}

export function ThemeShowcase() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("theme");
    if (isThemeId(requested)) {
      setTheme(requested);
    }
  }, [setTheme]);

  return (
    <main
      className="aa-app-shell"
      data-testid="theme-showcase"
      style={{ display: "grid", gap: "var(--aa-spacing-lg)" }}
    >
      <header style={{ display: "grid", gap: "var(--aa-spacing-sm)" }}>
        <p className="aa-eyebrow">Design System · regressão visual</p>
        <h1 style={{ margin: 0 }}>Academia Arcana</h1>
        <p className="aa-state-copy" style={{ margin: 0 }}>
          Tema ativo:{" "}
          <strong data-testid="active-theme">{themePresets[theme].name}</strong>
        </p>
        <label className="aa-field">
          Tema
          <select
            className="aa-input"
            value={theme}
            onChange={(event) => setTheme(event.target.value as ThemeId)}
          >
            {THEME_IDS.map((id) => (
              <option key={id} value={id}>
                {themePresets[id].name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section
        style={{
          display: "grid",
          gap: "var(--aa-spacing-md)",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
        }}
      >
        <Card>
          <h2>Superfície</h2>
          <p>Texto primário, secundário e estrutura acadêmica.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--aa-spacing-sm)" }}>
            <Badge>Neutro</Badge>
            <Badge variant="success">Sucesso</Badge>
            <Badge variant="warning">Atenção</Badge>
            <Badge variant="info">Informação</Badge>
          </div>
        </Card>

        <Card variant="elevated">
          <h2>Interação</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--aa-spacing-sm)" }}>
            <Button>Primária</Button>
            <Button variant="secondary">Secundária</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Perigo</Button>
          </div>
        </Card>

        <Card variant="inset">
          <h2>Formulário</h2>
          <Input
            label="Campo de estudo"
            defaultValue="Conhecimento arcano"
            description="Descrição auxiliar legível."
          />
        </Card>
      </section>

      <Card variant="elevated">
        <h2>Progresso</h2>
        <Progress value={64} label="Progresso demonstrativo: 64%" />
      </Card>
    </main>
  );
}
