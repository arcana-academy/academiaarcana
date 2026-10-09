import { resolveEventTheme, type EventThemeId } from "@/design-system/event-themes/catalog";

/** Static preview: no form submissions, announcements or real event enrollment. */
export function EventTemplatePreview({ themeId }: { themeId: EventThemeId }) {
  const theme = resolveEventTheme(themeId);
  if (!theme) return null;
  const headingId = "aa-event-" + theme.id;
  return (
    <section aria-labelledby={headingId} className="aa-event-preview" data-aa-event-theme={theme.id}>
      <p className="aa-event-preview__muted">Prévia visual · Evento não publicado</p>
      <h2 id={headingId}>{theme.name}</h2>
      <p>{theme.tagline}</p>
      <p className="aa-event-preview__muted">{theme.description}</p>
      <div className="aa-event-preview__grid">
        <div className="aa-event-preview__panel">
          <h3>Landing</h3>
          <p>Apresentação temática e orientações de participação.</p>
        </div>
        <div className="aa-event-preview__panel">
          <h3>Formulário</h3>
          <p>Layout de inscrição ilustrativo; nenhum dado é coletado.</p>
        </div>
        <div className="aa-event-preview__panel">
          <h3>Galeria</h3>
          <p>Espaços reservados para imagens aprovadas e descrições acessíveis.</p>
        </div>
        <div className="aa-event-preview__panel">
          <h3>Cronograma</h3>
          <p>Estrutura para datas e horários reais, sem eventos fictícios.</p>
        </div>
      </div>
    </section>
  );
}
