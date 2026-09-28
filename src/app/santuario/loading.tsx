import { Skeleton } from "@/components/ui";

export default function SanctuaryLoading() {
  return (
    <main
      className="aa-page aa-page-wide aa-loading-page"
      aria-busy="true"
      aria-labelledby="sanctuary-loading-title"
    >
      <header className="aa-page-header">
        <p className="aa-eyebrow">Santuário</p>
        <h1 id="sanctuary-loading-title">Carregando o Santuário</h1>
        <p role="status">Buscando seu contexto de aprendizagem…</p>
      </header>

      <div className="aa-skeleton-grid" aria-hidden="true">
        <section className="aa-card aa-card-default">
          <Skeleton className="aa-skeleton-xl" />
          <Skeleton className="aa-skeleton-sm" />
        </section>

        <section className="aa-card aa-card-default">
          <Skeleton className="aa-skeleton-action" />
        </section>

        <section className="aa-card aa-card-default">
          <Skeleton className="aa-skeleton-area" />
          <Skeleton className="aa-skeleton-area" />
        </section>
      </div>
    </main>
  );
}
