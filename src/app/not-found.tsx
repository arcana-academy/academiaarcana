import Link from "next/link";

export default function NotFound() {
  return (
    <main className="aa-not-found">
      <div className="aa-card aa-card-elevated aa-not-found-card">
        <p className="aa-page-eyebrow">Academia Arcana</p>
        <h1>Página não encontrada</h1>
        <p className="aa-page-description">
          O caminho solicitado não existe ou já não está disponível.
        </p>
        <div className="aa-not-found-actions">
          <Link className="aa-button aa-button-primary" href="/">
            Voltar ao início
          </Link>
          <Link className="aa-button aa-button-secondary" href="/santuario">
            Abrir Santuário
          </Link>
        </div>
      </div>
    </main>
  );
}
