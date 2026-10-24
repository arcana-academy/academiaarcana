"use client";

import { useMemo, useState } from "react";
import styles from "./TeacherReportsDemo.module.css";

/**
 * Visual prototype without data connectivity: zero synthetic measurements.
 * Metrics, identifiable data and exporting require explicit teacher-to-class
 * authorization, RLS, minimization, and backend verification.
 */
export const REPORT_CATEGORIES = ["Todas as áreas", "Participação", "Aprendizagem", "Atividades", "Avaliações"] as const;
export const REPORT_PERIODS = ["Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias"] as const;

type Category = Exclude<(typeof REPORT_CATEGORIES)[number], "Todas as áreas">;
type Report = Readonly<{
  id: string;
  category: Category;
  title: string;
  description: string;
  pending: string;
}>;

const REPORT_PLACEHOLDERS: readonly Report[] = [
  {
    id: "demo-participacao",
    category: "Participação",
    title: "Participação da turma",
    description: "Área reservada para análise contextualizada de participação, sem exposição individual.",
    pending: "Nenhuma informação de participação foi consultada.",
  },
  {
    id: "demo-aprendizagem",
    category: "Aprendizagem",
    title: "Evolução da aprendizagem",
    description: "Área reservada para observar progressos e retomadas, sem comparações punitivas.",
    pending: "Nenhum indicador de evolução foi calculado.",
  },
  {
    id: "demo-atividades",
    category: "Atividades",
    title: "Acompanhamento de atividades",
    description: "Estrutura proposta para entregas, prazos e devolutivas formativas.",
    pending: "Nenhuma entrega ou prazo real foi carregado.",
  },
  {
    id: "demo-avaliacoes",
    category: "Avaliações",
    title: "Visão pedagógica de avaliações",
    description: "Estrutura de análise qualitativa baseada em critérios e rubricas.",
    pending: "Nenhuma nota, rubrica aplicada ou avaliação real foi consultada.",
  },
];

export function TeacherReportsDemo() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof REPORT_CATEGORIES)[number]>("Todas as áreas");
  const [period, setPeriod] = useState<(typeof REPORT_PERIODS)[number]>("Últimos 30 dias");
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return REPORT_PLACEHOLDERS.filter((report) =>
      (category === "Todas as áreas" || report.category === category) &&
      (!term || [report.title, report.description, report.category].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(term)
      ))
    );
  }, [query, category]);

  return (
    <section className={styles.root} aria-labelledby="aa-reports-title">
      <h4 id="aa-reports-title">Relatórios da Turma A — prévia sem dados</h4>
      <p className={styles.muted}>
        Estruturas de relatório demonstrativas. Não há percentuais, notas, presença, nomes ou resultados reais.
      </p>
      <div className={styles.filters}>
        <label className={styles.field}>
          <span>Buscar área de relatório</span>
          <input type="search" value={query} placeholder="Título ou finalidade"
            onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Área do relatório</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as (typeof REPORT_CATEGORIES)[number])}>
            {REPORT_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span>Período de referência (demonstrativo)</span>
          <select value={period} onChange={(event) => setPeriod(event.target.value as (typeof REPORT_PERIODS)[number])}>
            {REPORT_PERIODS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <p role="status" aria-live="polite" className={styles.muted}>
        {visible.length} área(s) de relatório demonstrativa(s) encontrada(s).
        Período ilustrativo selecionado: {period}.
      </p>
      {visible.length ? (
        <ul className={styles.list}>
          {visible.map((report) => (
            <li key={report.id} className={styles.card}>
              <div className={styles.heading}>
                <strong>{report.title}</strong>
                <span className={styles.pill}>{report.category}</span>
              </div>
              <p>{report.description}</p>
              <div className={styles.empty} aria-label={report.title + ": dados indisponíveis"}>
                <strong>Dados indisponíveis</strong>
                <p>{report.pending}</p>
              </div>
              <details>
                <summary>Ver requisitos antes da integração</summary>
                <p>
                  Vínculo professor–turma, políticas por recurso, escopo temporal no servidor,
                  RLS, testes intercontas e minimização de dados são obrigatórios.
                </p>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>Nenhuma área de relatório corresponde aos filtros.</p>
      )}
      <p className={styles.warning}>
        Exportação, comparação de estudantes, visualização de registros pessoais e processamento
        de indicadores não estão disponíveis. Este seletor de período não consulta o servidor.
      </p>
    </section>
  );
}
