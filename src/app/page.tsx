import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import styles from "./ArcanaLanding.module.css";

async function hasAuthenticatedSession(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    return Boolean(data?.claims?.sub);
  } catch {
    return false;
  }
}

export default async function Page() {
  if (await hasAuthenticatedSession()) redirect("/santuario");

  return (
    <main className={styles.page} aria-labelledby="home-title">
      <div className={styles.art} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />

      <header className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Academia Arcana · espaço de estudo</p>
          <h1 id="home-title">Transforme estudo em <span>uma jornada.</span></h1>
          <p className={styles.lead}>
            Um ambiente para reunir conhecimento, organizar seus estudos e voltar ao próximo passo
            sem perder o fio daquilo que você está construindo.
          </p>
          <div className={styles.actions}>
            <Link className="aa-button aa-button-primary aa-button-lg" href="/cadastro">
              Começar minha jornada
            </Link>
            <Link className="aa-button aa-button-ghost aa-button-lg" href="/login">
              Já tenho uma conta
            </Link>
          </div>
          <div className={styles.signature} aria-label="Princípios da Academia Arcana">
            <span>Contexto</span><i aria-hidden="true">✦</i><span>Ritmo</span><i aria-hidden="true">✦</i><span>Continuidade</span>
          </div>
        </div>
        <div className={styles.sigil} aria-hidden="true"><span>✦</span></div>
      </header>

      <section className={styles.pillars} aria-label="Pilares da Academia Arcana">
        <article>
          <span className={styles.pillarMark} aria-hidden="true">◇</span>
          <div><p className={styles.cardEyebrow}>01 · Santuário</p><h2>Volte ao ponto certo.</h2><p>Contexto, progresso e próximo passo reunidos em um único lugar.</p></div>
        </article>
        <article>
          <span className={styles.pillarMark} aria-hidden="true">✧</span>
          <div><p className={styles.cardEyebrow}>02 · Grimórios</p><h2>Construa seu acervo.</h2><p>Organize livros, capítulos e páginas em uma biblioteca feita para estudar.</p></div>
        </article>
        <article>
          <span className={styles.pillarMark} aria-hidden="true">◈</span>
          <div><p className={styles.cardEyebrow}>03 · Seu ritmo</p><h2>Estude de um jeito que sustenta.</h2><p>Planejamento e personalização sem transformar seu espaço em mais uma fonte de ruído.</p></div>
        </article>
      </section>
    </main>
  );
}
