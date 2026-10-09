import Link from "next/link";
"use client";

import { useMemo, useState } from "react";
import { FlontsPortrait } from "@/components/flonts/FlontsPortrait";
import styles from "./TeacherClassesDemo.module.css";

const DEMONSTRATIVE_CLASSES = [
  { id: "sample-a", title: "Fundamentos da Magia — Turma A", stage: "Em andamento", note: "Roteiro e materiais demonstrativos" },
  { id: "sample-b", title: "Introdução aos Grimórios — Turma B", stage: "Programada", note: "Aulas futuras demonstrativas" },
  { id: "sample-c", title: "História Arcana — Turma C", stage: "Concluída", note: "Histórico demonstrativo" },
] as const;

export function TeacherClassesDemo() {
  const [term, setTerm] = useState("");
  const [stage, setStage] = useState("todas");
  const filtered = useMemo(() => {
    const query = term.trim().toLocaleLowerCase("pt-BR");
    return DEMONSTRATIVE_CLASSES.filter((entry) => (
      (stage === "todas" || stage === entry.stage) &&
      (!query || entry.title.toLocaleLowerCase("pt-BR").includes(query))
    ));
  }, [term, stage]);

  return (
    <section aria-labelledby="aa-teacher-classes-title" className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Portal do Professor · Protótipo com dados fictícios</p>
          <h2 id="aa-teacher-classes-title">Turmas</h2>
          <p>Explore a organização e os filtros. Não existem turmas ou permissões reais nesta prévia.</p>
        </div>
        <div className={styles.flonts}><FlontsPortrait /><span>Flonts está com você</span></div>
      </header>
      <div className={styles.filters}>
        <div className={styles.field}>
          <label htmlFor="aa-teacher-search">Buscar turma fictícia</label>
          <input id="aa-teacher-search" type="search" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Nome da turma" />
        </div>
        <div className={styles.field}>
          <label htmlFor="aa-teacher-status">Situação demonstrativa</label>
          <select id="aa-teacher-status" value={stage} onChange={(event) => setStage(event.target.value)}>
            <option value="todas">Todas</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Programada">Programada</option>
            <option value="Concluída">Concluída</option>
          </select>
        </div>
      </div>
      <p role="status" className={styles.count}>{filtered.length} turma(s) demonstrativa(s) encontrada(s)</p>
      {filtered.length > 0 ? (
        <ul className={styles.list}>
          {filtered.map((entry) => (
            <li key={entry.id} className={styles.card}>
              <div>{entry.id === "sample-a" ? <Link href="/design-system/portais/professor/turmas/turma-a"><strong>{entry.title}</strong> — ver abas demonstrativas</Link> : <strong>{entry.title}</strong>}<p>{entry.note}</p></div>
              <span className={styles.stage}>{entry.stage}</span>
            </li>
          ))}
        </ul>
      ) : <p role="status" className={styles.empty}>Nenhuma turma demonstrativa corresponde aos filtros.</p>}
      <p className={styles.notice}>
        <strong>Acesso real bloqueado:</strong> matrícula, vínculo docente e política de autorização por recurso ainda precisam de aprovação.
        Os filtros funcionam somente sobre os exemplos locais, sem conexão com o banco.
      </p>
    </section>
  );
}
