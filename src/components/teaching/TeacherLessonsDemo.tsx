"use client";

import { useMemo, useState } from "react";
import styles from "./TeacherLessonsDemo.module.css";

/**
 * Local-only teaching prototype. No fetch, data mutation, enrollment or
 * authorization grants. All content is explicitly fictional.
 */
export const DEMO_LESSON_STATES = [
  "Todas",
  "Programada",
  "Em andamento",
  "Concluída",
] as const;
type LessonState = Exclude<(typeof DEMO_LESSON_STATES)[number], "Todas">;
type DemoLesson = Readonly<{
  id: string;
  title: string;
  status: LessonState;
  focus: string;
  materials: readonly string[];
}>;

const LESSONS: readonly DemoLesson[] = [
  {
    id: "demo-aula-01",
    title: "Aula 01 — Introdução à Academia",
    status: "Concluída",
    focus: "Objetivos e vocabulário inicial",
    materials: ["Guia introdutório (fictício)", "Roteiro de estudo (fictício)"],
  },
  {
    id: "demo-aula-02",
    title: "Aula 02 — Grimórios e Conhecimento",
    status: "Em andamento",
    focus: "Organização do conhecimento em grimórios",
    materials: ["Mapa conceitual (fictício)"],
  },
  {
    id: "demo-aula-03",
    title: "Aula 03 — Práticas Arcanas",
    status: "Programada",
    focus: "Exercícios de revisão",
    materials: [],
  },
];

export function TeacherLessonsDemo() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof DEMO_LESSON_STATES)[number]>("Todas");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return LESSONS.filter((lesson) =>
      (status === "Todas" || lesson.status === status) &&
      (!normalized || [lesson.title, lesson.focus].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(normalized)
      ))
    );
  }, [query, status]);

  return (
    <section aria-labelledby="aa-demo-lessons-heading" className={styles.root}>
      <h4 id="aa-demo-lessons-heading">Listagem de aulas — dados demonstrativos</h4>
      <p className={styles.context}>
        Busca e filtros locais para avaliar a interface. Nenhum planejamento real foi carregado.
      </p>
      <div className={styles.filters}>
        <label className={styles.field}>
          <span>Buscar aula demonstrativa</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder="Título ou assunto" />
        </label>
        <label className={styles.field}>
          <span>Situação da aula</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as (typeof DEMO_LESSON_STATES)[number])}>
            {DEMO_LESSON_STATES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <p role="status" className={styles.context}>
        {filtered.length} aula(s) demonstrativa(s) encontrada(s)
      </p>
      {filtered.length > 0 ? (
        <ul className={styles.list}>
          {filtered.map((lesson) => (
            <li key={lesson.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <strong>{lesson.title}</strong>
                <span className={styles.status}>{lesson.status}</span>
              </div>
              <p>{lesson.focus}</p>
              <details>
                <summary>Detalhes e materiais demonstrativos</summary>
                {lesson.materials.length ? (
                  <ul>{lesson.materials.map((material) => <li key={material}>{material}</li>)}</ul>
                ) : (
                  <p>Materiais ainda não disponíveis nesta demonstração.</p>
                )}
                <p className={styles.context}>Sala de Aula e atividades relacionadas: acesso operacional pendente.</p>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>Nenhuma aula demonstrativa corresponde aos filtros.</p>
      )}
      <p className={styles.warning}>
        Criar, editar, reorganizar, publicar aulas e consultar participação real: ações não habilitadas.
        Exigem vínculo docente, autorização por turma e validação de persistência.
      </p>
    </section>
  );
}
