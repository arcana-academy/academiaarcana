import { AccessibilityPanel } from "@/components/accessibility/AccessibilityPanel";

/** Synthetic public fixture. Exists only in the C88 diagnostic branch; not in the MVP PR. */
export default function C88VisualFixture() {
  return (
    <main style={{padding: "1rem", maxWidth: "60rem", marginInline: "auto"}}>
      <header className="aa-topbar" style={{position:"relative"}}>
        <span>Academia Arcana — C88 · dados sintéticos</span>
        <AccessibilityPanel variant="quick" />
      </header>
      <h1>Teste visual de acessibilidade</h1>
      <p>O conhecimento pode ser explorado em qualquer ritmo.</p>
      <AccessibilityPanel variant="full" />
    </main>
  );
}
