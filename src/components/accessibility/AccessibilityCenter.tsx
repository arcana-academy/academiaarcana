"use client";

import { useEffect, useRef, useState } from "react";
import { useReadingPreferences } from "@/application/accessibility-preferences/useReadingPreferences";
import { useSiteAppearance } from "@/application/appearance/SiteAppearanceProvider";
import { useAccessibilityPreferencesContext } from "@/application/accessibility-preferences/AccessibilityPreferencesContext";

const sections = [
  ["vision", "Visão e leitura"],
  ["hearing", "Audição e mídia"],
  ["mobility", "Mobilidade"],
  ["cognition", "Cognição e foco"],
  ["assistive", "Tecnologias assistivas"],
  ["learning", "Estudo acessível"],
] as const;
type Section = (typeof sections)[number][0];

export function AccessibilityCenter() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section>("vision");
  const { reading, storageWarning, updateReading } = useReadingPreferences();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { appearance, setAppearance } = useSiteAppearance();
  const { state: motionState, setMotionPreference } = useAccessibilityPreferencesContext();

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);


  return (
    <div className="aa-accessibility-entry">
      <button
        ref={triggerRef}
        type="button"
        className="aa-button aa-button-secondary aa-accessibility-trigger"
        aria-expanded={open}
        aria-controls="aa-accessibility-center"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">♿</span>
        <span>Acessibilidade</span>
      </button>
      {open ? (
        <section
          id="aa-accessibility-center"
          className="aa-accessibility-panel"
          aria-label="Central de Acessibilidade"
        >
          <div className="aa-accessibility-panel-heading">
            <h2>Central de Acessibilidade</h2>
            <button
              ref={closeRef}
              className="aa-button aa-button-secondary aa-button-sm"
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              Fechar
            </button>
          </div>
          <p>Personalize sua experiência sem informar diagnósticos ou motivos.</p>
          <nav className="aa-accessibility-sections" aria-label="Categorias de acessibilidade">
            {sections.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="aa-button aa-button-secondary aa-button-sm"
                aria-pressed={section === id}
                onClick={() => setSection(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="aa-accessibility-controls">
            {section === "vision" ? (
              <>
                <label htmlFor="aa-appearance">Tema da Academia</label>
                <select
                  id="aa-appearance"
                  className="aa-input"
                  value={appearance}
                  onChange={(event) => setAppearance(event.target.value as "system" | "dark" | "light")}
                >
                  <option value="system">Automático — seguir o dispositivo</option>
                  <option value="dark">Biblioteca Noturna</option>
                  <option value="light">Pergaminho Claro</option>
                  <option value="custom" disabled>Tema avançado — gerenciado em Personalizar</option>
                </select>
                <label><input type="checkbox" checked={reading.largeText} onChange={(event) => updateReading("largeText", event.target.checked)} /> Ampliar texto</label>
                <label><input type="checkbox" checked={reading.extraSpacing} onChange={(event) => updateReading("extraSpacing", event.target.checked)} /> Aumentar espaçamento de leitura</label>
                <label><input type="checkbox" checked={reading.highContrast} onChange={(event) => updateReading("highContrast", event.target.checked)} /> Reforçar contraste</label>
                <p>O zoom do navegador e as configurações do dispositivo permanecem disponíveis.</p>
              </>
            ) : null}
            {section === "hearing" ? (
              <>
                <h3>Audição e mídia</h3>
                <p>Conteúdos publicados deverão oferecer legendas, transcrições e alternativas equivalentes quando aplicáveis. A seleção dessas opções pertence ao reprodutor de cada material.</p>
                <p>Esta área não ativa legendas ou Libras em materiais que ainda não possuem esses recursos.</p>
              </>
            ) : null}
            {section === "mobility" ? (
              <>
                <h3>Mobilidade</h3>
                <p>As ações devem funcionar por teclado, com foco visível e alternativas a arrastar ou a gestos complexos. Os atalhos não devem conflitar com comandos assistivos.</p>
                <p>Essas condições fazem parte da interface acessível por padrão; não exigem habilitação nesta Central.</p>
              </>
            ) : null}
            {section === "cognition" ? (
              <>
                <h3>Cognição e concentração</h3>
                <label><input type="checkbox" checked={reading.focusMode} onChange={(event) => updateReading("focusMode", event.target.checked)} /> Modo Foco — reduzir ornamentação, sem ocultar comandos essenciais</label>
                <label htmlFor="aa-motion">Animações</label>
                <select
                  id="aa-motion"
                  className="aa-input"
                  value={motionState?.configuredMotionPreference ?? "system"}
                  onChange={(event) => void setMotionPreference(event.target.value as "system" | "normal" | "reduced")}
                >
                  <option value="system">Seguir o dispositivo</option>
                  <option value="reduced">Reduzir movimento</option>
                  <option value="normal">Movimento padrão</option>
                </select>
                {motionState?.error ? <p role="alert">Não foi possível confirmar a preferência de movimento.</p> : null}
              </>
            ) : null}
            {section === "assistive" ? (
              <>
                <h3>Tecnologias assistivas</h3>
                <p>Leitores de tela, comandos de voz, ampliadores e dispositivos de entrada alternativos dependem de marcação semântica, nomes acessíveis e compatibilidade da interface, não de um botão de ativação.</p>
                <p>A compatibilidade deverá ser confirmada por testes com as tecnologias correspondentes.</p>
              </>
            ) : null}
            {section === "learning" ? (
              <>
                <h3>Grimórios e aprendizagem</h3>
                <p>Os modos Caderno e Leitura deverão preservar títulos, capítulos, páginas, fórmulas, imagens, alternativas textuais e navegação por teclado. Ajustes de leitura também devem estar disponíveis no editor.</p>
                <p>Recursos de exportação acessível serão sinalizados somente após implementação e validação.</p>
              </>
            ) : null}
          </div>
          {storageWarning ? (
            <p role="status">As escolhas podem valer apenas nesta sessão: não foi possível acessar o armazenamento deste dispositivo.</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
