"use client";

import { useMemo, useState } from "react";
import styles from "./TeacherAssessmentsDemo.module.css";

/**
 * Professor / Turma A / Avaliações — strictly illustrative UI.
 * No student data, scores, persisted rubrics, API calls or authorization grants.
 */
export const ASSESSMENT_KINDS = ["Todos os tipos", "Diagnóstica", "Formativa", "Síntese"] as const;
export const ASSESSMENT_STATUSES = ["Todas as situações", "Rascunho", "Programada", "Encerrada"] as const;

type Kind = Exclude<(typeof ASSESSMENT_KINDS)[number], "Todos os tipos">;
type Status = Exclude<(typeof ASSESSMENT_STATUSES)[number], "Todas as situações">;
type Criterion = Readonly<{
  name: string;
  guidance: string;
  levels: readonly [string, string, string];
}>;
type Assessment = Readonly<{
  id: string;
  title: string;
  kind: Kind;
  status: Status;
  lesson: string;
  schedule: string;
  objective: string;
  rubric: readonly Criterion[];
}>;

const LEVELS = ["Em desenvolvimento", "Em progresso", "Consolidado"] as const;

/** Fictitious records are intentionally not associated with people or grades. */
const SAMPLE_ASSESSMENTS: readonly Assessment[] = [
  {
    id: "avaliacao-demo-01",
    title: "Sondagem dos Fundamentos (fictícia)",
    kind: "Diagnóstica",
    status: "Encerrada",
    lesson: "Introdução à Academia",
    schedule: "01/10/2026 (data fictícia)",
    objective: "Reconhecer conhecimentos prévios, sem classificar estudantes.",
    rubric: [
      { name: "Identificação de conceitos", guidance: "Observa se os conceitos foram reconhecidos e explicados.", levels: LEVELS },
      { name: "Reflexão inicial", guidance: "Observa conexões estabelecidas com experiências anteriores.", levels: LEVELS },
    ],
  },
  {
    id: "avaliacao-demo-02",
    title: "Reflexões sobre Grimórios (fictícia)",
    kind: "Formativa",
    status: "Programada",
    lesson: "Grimórios e Conhecimento",
    schedule: "23/10/2026 (data fictícia)",
    objective: "Oferecer orientações formativas sem punição pelo ritmo de aprendizagem.",
    rubric: [
      { name: "Organização", guidance: "Verifica a clareza da estrutura apresentada.", levels: LEVELS },
      { name: "Argumentação", guidance: "Verifica a justificativa das conexões propostas.", levels: LEVELS },
    ],
  },
  {
    id: "avaliacao-demo-03",
    title: "Síntese de Práticas Arcanas (fictícia)",
    kind: "Síntese",
    status: "Rascunho",
    lesson: "Práticas Arcanas",
    schedule: "Ainda não definida",
    objective: "Planejar uma síntese de aprendizagem antes da publicação.",
    rubric: [
      { name: "Síntese de conteúdos", guidance: "Considera as relações entre tópicos essenciais.", levels: LEVELS },
      { name: "Autonomia", guidance: "Considera a explicação das próprias decisões.", levels: LEVELS },
    ],
  },
];

export function TeacherAssessmentsDemo() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<(typeof ASSESSMENT_KINDS)[number]>("Todos os tipos");
  const [status, setStatus] = useState<(typeof ASSESSMENT_STATUSES)[number]>("Todas as situações");

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return SAMPLE_ASSESSMENTS.filter((assessment) =>
      (kind === "Todos os tipos" || assessment.kind === kind) &&
      (status === "Todas as situações" || assessment.status === status) &&
      (!term || [assessment.title, assessment.lesson, assessment.objective].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(term)
      ))
    );
  }, [query, kind, status]);

  return (
    <section className={styles.root} aria-labelledby="aa-assessments-title">
      <h4 id="aa-assessments-title">Avaliações e rubricas — prévia demonstrativa</h4>
      <p className={styles.muted}>
        Critérios, estados e datas fictícios. Nenhuma nota, resposta, estudante ou resultado real é exibido.
      </p>
      <div className={styles.filters}>
        <label className={styles.field}>
          <span>Buscar avaliação demonstrativa</span>
          <input type="search" value={query} placeholder="Título, aula ou objetivo"
            onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Tipo de avaliação</span>
          <select value={kind} onChange={(event) => setKind(event.target.value as (typeof ASSESSMENT_KINDS)[number])}>
            {ASSESSMENT_KINDS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span>Situação da avaliação</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as (typeof ASSESSMENT_STATUSES)[number])}>
            {ASSESSMENT_STATUSES.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <p role="status" aria-live="polite" className={styles.muted}>
        {visible.length} avaliação(ões) demonstrativa(s) encontrada(s)
      </p>
      {visible.length ? (
        <ul className={styles.list}>
          {visible.map((assessment) => (
            <li key={assessment.id} className={styles.card}>
              <div className={styles.heading}>
                <strong>{assessment.title}</strong>
                <span className={styles.pill}>{assessment.status}</span>
              </div>
              <p className={styles.muted}>
                {assessment.kind} · Aula: {assessment.lesson} · Data: {assessment.schedule}
              </p>
              <p>{assessment.objective}</p>
              <details>
                <summary>Ver rubrica e critérios demonstrativos</summary>
                <p className={styles.muted}>Os níveis descrevem progressão, não notas ou pontuações.</p>
                <ul className={styles.criteria}>
                  {assessment.rubric.map((criterion) => (
                    <li key={criterion.name}>
                      <strong>{criterion.name}</strong>
                      <p>{criterion.guidance}</p>
                      <p className={styles.muted}>Níveis ilustrativos: {criterion.levels.join(" · ")}</p>
                    </li>
                  ))}
                </ul>
                <p className={styles.muted}>Entregas e resultados: indisponíveis nesta demonstração.</p>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>Nenhuma avaliação demonstrativa corresponde aos filtros.</p>
      )}
      <p className={styles.warning}>
        Criar, publicar, corrigir, registrar feedback individual, atribuir notas e exportar resultados
        dependem de vínculo docente, autorização por recurso, consentimentos e validação de backend.
        Nenhuma dessas operações está habilitada.
      </p>
    </section>
  );
}
