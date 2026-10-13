import Image from "next/image";
import Link from "next/link";

import styles from "./not-found.module.css";

/** Recover from an unknown route without requiring an authenticated session. */
export default function NotFound() {
  return (
    <main className={`aa-page ${styles.page}`} aria-labelledby="not-found-title">
      <section className={`aa-card aa-card-elevated ${styles.card}`}>
        <Image
          className={styles.seal}
          src="/assets/brand/aa-institutional-seal.svg"
          alt=""
          width={64}
          height={64}
        />
        <p className="aa-eyebrow">Academia Arcana · Orientação</p>
        <h1 id="not-found-title">Página não encontrada</h1>
        <p className={styles.description}>
          O caminho solicitado não existe ou já não está disponível. Você pode
          retornar ao início ou abrir seu Santuário.
        </p>
        <nav className={styles.actions} aria-label="Recuperar a navegação">
          <Link className="aa-button aa-button-primary" href="/">
            Voltar ao início
          </Link>
          <Link className="aa-button aa-button-secondary" href="/santuario">
            Abrir Santuário
          </Link>
        </nav>
      </section>
    </main>
  );
}
