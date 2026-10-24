"use client";

import { useMemo, useState } from "react";
import styles from "./TeacherMaterialsDemo.module.css";

/**
 * Teacher → Class → Contents/Materiais — visual preview only.
 * All labels are fictitious. No file URLs, student data, persistence or API calls.
 * Access to real files must be verified by server-side authorization and RLS.
 */
export const MATERIAL_CATEGORIES = ["Todas", "Guias", "Grimórios", "Recursos de aula"] as const;
export const MATERIAL_STATES = ["Todos", "Disponível", "Em preparação"] as const;

type Category = Exclude<(typeof MATERIAL_CATEGORIES)[number], "Todas">;
type Status = Exclude<(typeof MATERIAL_STATES)[number], "Todos">;
type DemoMaterial = Readonly<{
  id: string;
  name: string;
  category: Category;
  kind: "Documento" | "Mapa conceitual" | "Apresentação";
  status: Status;
  lesson: string;
  description: string;
}>;

const MATERIALS: readonly DemoMaterial[] = [
  {
    id: "material-demo-1",
    name: "Guia de Boas-vindas (fictício)",
    category: "Guias",
    kind: "Documento",
    status: "Disponível",
    lesson: "Introdução à Academia",
    description: "Exemplo de orientação inicial; nenhum documento real foi anexado.",
  },
  {
    id: "material-demo-2",
    name: "Mapa dos Grimórios (fictício)",
    category: "Grimórios",
    kind: "Mapa conceitual",
    status: "Disponível",
    lesson: "Grimórios e Conhecimento",
    description: "Exemplo de organização temática, sem conteúdo privado.",
  },
  {
    id: "material-demo-3",
    name: "Slides de Práticas Arcanas (fictício)",
    category: "Recursos de aula",
    kind: "Apresentação",
    status: "Em preparação",
    lesson: "Práticas Arcanas",
    description: "Material ainda não disponível nesta prévia; publicação não habilitada.",
  },
] as const;

export function TeacherMaterialsDemo() {
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState<(typeof MATERIAL_CATEGORIES)[number]>("Todas");
  const [status, setStatus] = useState<(typeof MATERIAL_STATES)[number]>("Todos");

  const filtered = useMemo(() => {
    const query = term.trim().toLocaleLowerCase("pt-BR");
    return MATERIALS.filter((item) =>
      (category === "Todas" || item.category === category) &&
      (status === "Todos" || item.status === status) &&
      (!query || [item.name, item.lesson, item.kind].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(query)
      ))
    );
  }, [term, category, status]);

  return (
    <section className={styles.root} aria-labelledby="aa-teacher-materials-heading">
      <h4 id="aa-teacher-materials-heading">Biblioteca de materiais — demonstração</h4>
      <p className={styles.note}>Itens e estados fictícios. Nenhum arquivo pode ser aberto, baixado, compartilhado ou editado nesta prévia.</p>

      <div className={styles.filters}>
        <label className={styles.field}>
          <span>Buscar material demonstrativo</span>
          <input type="search" value={term} onChange={(event) => setTerm(event.target.value)}
            placeholder="Título, tipo ou aula" />
        </label>
        <label className={styles.field}>
          <span>Categoria de material</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as (typeof MATERIAL_CATEGORIES)[number])}>
            {MATERIAL_CATEGORIES.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span>Situação do material</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as (typeof MATERIAL_STATES)[number])}>
            {MATERIAL_STATES.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <p role="status" aria-live="polite" className={styles.count}>
        {filtered.length} material(is) demonstrativo(s) encontrado(s)
      </p>

      {filtered.length ? (
        <ul className={styles.list}>
          {filtered.map((item) => (
            <li key={item.id} className={styles.card}>
              <div className={styles.cardHeading}>
                <strong>{item.name}</strong>
                <span className={styles.status}>{item.status}</span>
              </div>
              <p className={styles.meta}>{item.category} · {item.kind} · Aula: {item.lesson}</p>
              <details>
                <summary>Ver informações demonstrativas</summary>
                <p>{item.description}</p>
                <p className={styles.note}>Arquivo indisponível — esta prévia não contém anexos nem links reais.</p>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>Nenhum material demonstrativo corresponde aos filtros.</p>
      )}

      <p className={styles.warning}>
        Criar, publicar, mover, compartilhar ou excluir materiais exige vínculo docente, autorização por turma,
        verificação do arquivo no servidor e regras de privacidade; nenhuma dessas ações está habilitada.
      </p>
    </section>
  );
}
