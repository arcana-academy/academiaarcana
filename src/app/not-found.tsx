import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="aa-error-page" aria-labelledby="not-found-title">
      <section className="aa-card aa-card-elevated aa-error-state">
        <div className="aa-card-icon" aria-hidden="true">
          <Compass size={22} strokeWidth={1.8} />
        </div>
        <p className="aa-eyebrow">404</p>
        <h1 id="not-found-title">Este caminho não existe</h1>
        <p>
          A página que você procurou não foi encontrada ou ainda não foi
          implementada.
        </p>
        <Link className="aa-button aa-button-primary" href="/">
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}
