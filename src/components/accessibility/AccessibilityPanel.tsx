"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { applyTheme, useTheme } from "@/design-system/themes";

type AccessibilityOptions = {
  largerText: boolean;
  contrast: boolean;
  spacing: boolean;
  focus: boolean;
};
type OptionKey = keyof AccessibilityOptions;
type AccessibilityOptionsContextValue = {
  options: AccessibilityOptions;
  toggle: (key: OptionKey) => void;
};
const KEY = "academia-arcana.visual-accessibility-v1";
const defaults: AccessibilityOptions = {
  largerText: false, contrast: false, spacing: false, focus: false,
};
const Context = createContext<AccessibilityOptionsContextValue>({
  options: defaults,
  toggle: () => undefined,
});

function isOptions(value: unknown): value is AccessibilityOptions {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (Object.keys(defaults) as OptionKey[]).every((key) =>
    typeof record[key] === "boolean",
  );
}

export function VisualAccessibilityProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [options, setOptions] = useState<AccessibilityOptions>(defaults);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const entry = window.localStorage.getItem(KEY);
      if (entry) {
        const candidate: unknown = JSON.parse(entry);
        if (isOptions(candidate)) setOptions(candidate);
      }
    } catch {
      // Private browsing/storage-denied mode must not disable accessibility.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const target = document.documentElement;
    target.dataset.aaTextSize = options.largerText ? "large" : "normal";
    target.dataset.aaContrast = options.contrast ? "high" : "normal";
    target.dataset.aaSpacing = options.spacing ? "expanded" : "normal";
    target.dataset.aaFocus = options.focus ? "true" : "false";
    applyTheme(theme);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(options));
    } catch {
      // Continue with session-only preferences.
    }
  }, [loaded, options, theme]);

  const toggle = (key: OptionKey) => {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  };

  return <Context.Provider value={{ options, toggle }}>{children}</Context.Provider>;
}

const quickSettings: { key: OptionKey; name: string; description: string }[] = [
  { key: "largerText", name: "Texto maior", description: "Amplia a tipografia da interface." },
  { key: "contrast", name: "Contraste reforçado", description: "Intensifica bordas e textos." },
  { key: "spacing", name: "Espaçamento de leitura", description: "Amplia o espaçamento nos parágrafos." },
  { key: "focus", name: "Modo Foco", description: "Reduz a decoração, sem ocultar controles." },
];

const categories = [
  { heading: "Visão e leitura", details: "Contraste, ampliação e leitura confortável. Leitores de tela funcionam sem ativar este painel." },
  { heading: "Audição e mídia", details: "As aulas devem oferecer legendas e transcrições aplicáveis. Esses recursos dependem dos respectivos materiais." },
  { heading: "Mobilidade e controle", details: "Teclado, foco visível e alternativas a gestos devem funcionar por padrão." },
  { heading: "Cognição e concentração", details: "Modo Foco opcional, instruções claras e tempo de estudo flexível." },
  { heading: "Tecnologias assistivas", details: "Estrutura semântica, rótulos, mensagens de estado e compatibilidade com leitores de tela." },
  { heading: "Estudo acessível", details: "Descrições de conteúdo multimodal, alternativas para fórmulas e controles junto aos blocos dos grimórios, conforme disponibilidade." },
];

function QuickControls() {
  const context = useContext(Context);
  const groupId = useId();
   return (
    <div className="aa-a11y-controls" role="group" aria-label="Ajustes rápidos de acessibilidade">
      {quickSettings.map((setting) => (
        <label className="aa-a11y-choice" htmlFor={groupId + "-" + setting.key} key={setting.key}>
          <input
            id={groupId + "-" + setting.key}
            type="checkbox"
            checked={context.options[setting.key]}
            onChange={() => context.toggle(setting.key)}
          />
          <span>
            <strong>{setting.name}</strong>
            <small>{setting.description}</small>
          </span>
        </label>
      ))}
    </div>
  );
}

export function AccessibilityPanel({ variant }: { variant: "quick" | "full" }) {
  const { appearance, setAppearance } = useTheme();
  const themeId = useId();
  if (variant === "quick") {
    return (
      <details className="aa-a11y-disclosure">
        <summary aria-label="Abrir painel rápido de acessibilidade">Acessibilidade</summary>
        <div className="aa-a11y-popover">
          <h2>Ajustes rápidos</h2>
          <QuickControls />
          <Link href="/configuracoes#acessibilidade">Abrir Central completa de Acessibilidade</Link>
        </div>
      </details>
    );
  }

  return (
    <section className="aa-a11y-center" id="acessibilidade" aria-labelledby={themeId + "-heading"}>
      <h2 id={themeId + "-heading"}>Central de Acessibilidade</h2>
      <p>Preferências opcionais. A navegação por teclado e as alternativas semânticas não dependem de ativação.</p>
      <fieldset className="aa-a11y-appearance">
        <legend>Aparência inicial e preferência do dispositivo</legend>
        {([
          ["system", "Automático — conforme o dispositivo"],
          ["dark", "Biblioteca Noturna"],
          ["light", "Pergaminho Claro"],
        ] as const).map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name={themeId + "-appearance"}
              checked={appearance === value}
              onChange={() => setAppearance(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <h3>Controles rápidos</h3>
      <QuickControls />
      <h3>Recursos de acessibilidade</h3>
      <div className="aa-a11y-category-grid">
        {categories.map((category) => (
          <section key={category.heading} className="aa-a11y-category">
            <h4>{category.heading}</h4>
            <p>{category.details}</p>
          </section>
        ))}
      </div>
    </section>
  );
}
