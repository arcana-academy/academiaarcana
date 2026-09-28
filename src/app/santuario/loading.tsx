const skeletonRows = [
  { className: "aa-skeleton-title", label: "Título" },
  { className: "aa-skeleton-line aa-skeleton-line-short", label: "Contexto" },
];

export default function SanctuaryLoading() {
  return (
    <main className="aa-page" aria-busy="true" aria-labelledby="sanctuary-loading-title">
      <header className="aa-card aa-card-elevated aa-page-header">
        <p className="aa-eyebrow">Santuário</p>
        <h1 id="sanctuary-loading-title">Carregando o Santuário</h1>
        <p role="status">Buscando seu contexto de aprendizagem…</p>
      </header>

      <section
        className="aa-card-grid"
        aria-hidden="true"
        data-testid="sanctuary-loading-skeleton"
      >
        {["header", "primary-action", "areas"].map((key) => (
          <div
            className="aa-card aa-card-default aa-skeleton-card"
            key={key}
            data-testid={"sanctuary-loading-" + key}
          >
            {skeletonRows.map((row) => (
              <div className={row.className} key={row.label} />
            ))}
            {key === "areas" ? (
              <>
                <div className="aa-skeleton-block" />
                <div className="aa-skeleton-block" />
              </>
            ) : null}
          </div>
        ))}
      </section>
    </main>
  );
}
