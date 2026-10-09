"use client";

import { useMemo, useState } from "react";
import styles from "./TeacherActivitiesDemo.module.css";

/** 
 * Visual-only exercise management prototype.
 * Sample activities, dates and states are fictional; no APIs or student records.
 */
export const ACTIVITY_TYPES = ["Todos os tipos", "Exercício", "Revisão", "Missão"] as const;
export const ACTIVITY_STATES = ["Todas as situações", "Rascunho", "Programada", "Em andamento", "Encerrada"] as const;
type ActivityType = Exclude<(typeof ACTIVITY_TYPES)[number], "Todos os tipos">;
type ActivityState = Exclude<(typeof ACTIVITY_STATES)[number], "Todas as situações">;

type Activity = Readonly<{
  id: string;
  title: string;
  type: ActivityType;
  state: ActivityState;
  deadline: string;
  lesson: string;
  instructions: string;
  criteria: readonly string[];
}>;

const SAMPLE_ACTIVITIES: readonly Activity[] = [
  {
    id: "atividade-exemplo-01",
    title: "Explorando conceitos mágicos (fictícia)",
    type: "Exercício",
    state: "Em andamento",
    deadline: "15/10/2026 (fictício)",
    lesson: "Introdução à Academia",
    instructions: "Identificar três conceitos apresentados na aula (instrução demonstrativa).",
    criteria: ["Clareza", "Compreensão dos conceitos"],
  },
  {
    id: "atividade-exemplo-02",
    title: "Revisão dos Grimórios (fictícia)",
    type: "Revisão",
    state: "Programada",
    deadline: "22/10/2026 (fictício)",
    lesson: "Grimórios e Conhecimento",
    instructions: "Organizar uma síntese de conceitos (instrução demonstrativa).",
    criteria: ["Organização", "Síntese"],
  },
  {
    id: "atividade-exemplo-03",
    title: "Missão de Práticas Arcanas (fictícia)",
    type: "Missão",
    state: "Rascunho",
    deadline: "Não definido",
    lesson: "Práticas Arcanas",
    instructions: "Planejar etapas da missão (instrução demonstrativa).",
    criteria: ["Planejamento", "Autonomia"],
  },
  {
    id: "atividade-exemplo-04",
    title: "Retomada dos Fundamentos (fictícia)",
    type: "Exercício",
    state: "Encerrada",
    deadline: "01/10/2026 (fictício)",
    lesson: "Introdução à Academia",
    instructions: "Revisar os tópicos fundamentais (instrução demonstrativa).",
    criteria: ["Revisão", "Reflexão"],
  },
];

export function TeacherActivitiesDemo() {
  const [term, setTerm] = useState("");
  const [type, setType] = useState<(typeof ACTIVITY_TYPES)[number]>("Todos os tipos");
  const [state, setState] = useState<(typeof ACTIVITY_STATES)[number]>("Todas as situações");

  const filtered = useMemo(() => {
    const query = term.trim().toLocaleLowerCase("pt-BR");
    return SAMPLE_ACTIVITIES.filter((activity) =>
      (type === "Todos os tipos" || activity.type === type) &&
      (state === "Todas as situações" || activity.state === state) &&
      (!query || [activity.title, activity.lesson, activity.instructions].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(query)
      ))
    );
  }, [term, type, state]);

  return (
    <section className={styles.root} aria-labelledby="aa-teacher-activities-title">
      <h4 id="aa-teacher-activities-title">Atividades da turma — prévia demonstrativa</h4>
      <p className={styles.subtle}>
        Organização fictícia de atividades, prazos e critérios. Não há alunos, envios, notas ou ações reais.
      </p>

      <div className={styles.filters}>
        <label className={styles.field}>
          <span>Buscar atividade demonstrativa</span>
          <input type="search" value={term} placeholder="Atividade ou aula" onChange={(event) => setTerm(event.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Tipo de atividade</span>
          <select value={type} onChange={(event) => setType(event.target.value as (typeof ACTIVITY_TYPES)[number])}>
            {ACTIVITY_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span>Situação da atividade</span>
          <select value={state} onChange={(event) => setState(event.target.value as (typeof ACTIVITY_STATES)[number])}>
            {ACTIVITY_STATES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>

      <p className={styles.subtle} role="status" aria-live="polite">
        {filtered.length} atividade(s) demonstrativa(s) encontrada(s)
      </p>

      {filtered.length > 0 ? (
        <ul className={styles.list}>
          {filtered.map((activity) => (
            <li key={activity.id} className={styles.card}>
              <div className={styles.heading}>
                <strong>{activity.title}</strong>
                <span className={styles.pill}>{activity.state}</span>
              </div>
              <p className={styles.subtle}>
                {activity.type} · Aula: {activity.lesson} · Prazo: {activity.deadline}
              </p>
              <details>
                <summary>Ver orientações e critérios demonstrativos</summary>
                <p>{activity.instructions}</p>
                <strong>Critérios ilustrativos</strong>
                <ul>{activity.criteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
                <p className={styles.subtle}>
                  Entregas e participação: informações indisponíveis nesta prévia.
                </p>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>Nenhuma atividade demonstrativa corresponde aos filtros.</p>
      )}
      <p className={styles.warning}>
        Criar, editar, publicar, atribuir, corrigir e reorganizar atividades requerem vínculo docente,
        autorização por turma, validação de backend e testes de acesso. Nenhuma dessas ações está habilitada.
      </p>
    </section>
  );
}
