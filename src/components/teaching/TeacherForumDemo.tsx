"use client";

import { useMemo, useState } from "react";
import styles from "./TeacherForumDemo.module.css";

/**
 * Exemplary topics only. No posts, authors, user profiles, moderation operations,
 * persistence, network calls or elevated role permissions are exposed here.
 */
export const FORUM_CATEGORIES = ["Todas as categorias", "Dúvidas", "Estudo em grupo", "Materiais"] as const;
export const FORUM_STATES = ["Todas as situações", "Aberto", "Arquivado", "Aguardando moderação"] as const;

type Category = Exclude<(typeof FORUM_CATEGORIES)[number], "Todas as categorias">;
type State = Exclude<(typeof FORUM_STATES)[number], "Todas as situações">;
type Topic = Readonly<{
  id: string;
  title: string;
  category: Category;
  state: State;
  description: string;
  guidance: string;
}>;

const EXAMPLE_TOPICS: readonly Topic[] = [
  {
    id: "forum-exemplo-01",
    title: "Como organizar um grimório? (fictício)",
    category: "Dúvidas",
    state: "Aberto",
    description: "Exemplo de tópico de orientação sobre organização de estudos.",
    guidance: "Dar respostas respeitosas e priorizar referências didáticas verificáveis.",
  },
  {
    id: "forum-exemplo-02",
    title: "Roteiro coletivo de revisão (fictício)",
    category: "Estudo em grupo",
    state: "Aberto",
    description: "Exemplo de planejamento colaborativo, sem participantes reais.",
    guidance: "Evitar exposição de dados pessoais e oferecer caminhos de aprendizagem.",
  },
  {
    id: "forum-exemplo-03",
    title: "Referências para a Aula 01 (fictício)",
    category: "Materiais",
    state: "Arquivado",
    description: "Tópico demonstrativo de referências, sem links ou anexos.",
    guidance: "Arquivamento não significa exclusão de registros ou retenção configurada.",
  },
  {
    id: "forum-exemplo-04",
    title: "Pergunta em revisão (fictícia)",
    category: "Dúvidas",
    state: "Aguardando moderação",
    description: "Exemplo de estado pendente, sem mensagem ou autor associado.",
    guidance: "A indicação de moderação é apenas visual; nenhuma fila real é consultada.",
  },
];

export function TeacherForumDemo() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof FORUM_CATEGORIES)[number]>("Todas as categorias");
  const [state, setState] = useState<(typeof FORUM_STATES)[number]>("Todas as situações");

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return EXAMPLE_TOPICS.filter((topic) =>
      (category === "Todas as categorias" || topic.category === category) &&
      (state === "Todas as situações" || topic.state === state) &&
      (!term || [topic.title, topic.description].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(term)
      ))
    );
  }, [query, category, state]);

  return (
    <section className={styles.root} aria-labelledby="aa-forum-title">
      <h4 id="aa-forum-title">Fórum da Turma A — prévia demonstrativa</h4>
      <p className={styles.muted}>
        Todos os tópicos são fictícios. Não existem participantes, mensagens nem notificações reais nesta interface.
      </p>

      <div className={styles.filters}>
        <label className={styles.field}>
          <span>Buscar tópico demonstrativo</span>
          <input type="search" value={query} placeholder="Assunto ou descrição"
            onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Categoria do fórum</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as (typeof FORUM_CATEGORIES)[number])}>
            {FORUM_CATEGORIES.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span>Situação do tópico</span>
          <select value={state} onChange={(event) => setState(event.target.value as (typeof FORUM_STATES)[number])}>
            {FORUM_STATES.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <p role="status" aria-live="polite" className={styles.muted}>
        {visible.length} tópico(s) demonstrativo(s) encontrado(s)
      </p>
      {visible.length > 0 ? (
        <ul className={styles.list}>
          {visible.map((topic) => (
            <li key={topic.id} className={styles.card}>
              <div className={styles.heading}>
                <strong>{topic.title}</strong>
                <span className={styles.pill}>{topic.state}</span>
              </div>
              <p className={styles.muted}>Categoria: {topic.category}</p>
              <p>{topic.description}</p>
              <details>
                <summary>Ver orientação demonstrativa</summary>
                <p>{topic.guidance}</p>
                <p className={styles.muted}>Respostas e histórico: indisponíveis nesta prévia.</p>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>Nenhum tópico demonstrativo corresponde aos filtros.</p>
      )}

      <div className={styles.notice}>
        <strong>Moderação e privacidade — proposta visual</strong>
        <p>
          Publicações precisam de regras de convivência, denúncia, moderação, visibilidade por turma,
          retenção, proteção de dados e mecanismo de bloqueio de conteúdo inadequado.
          Nada disso está operacional nesta prévia.
        </p>
      </div>
      <p className={styles.warning}>
        Criar, responder, moderar, denunciar, arquivar ou excluir tópicos exige vínculo e
        autorização por turma, políticas canônicas e validação de backend. Nenhuma operação está habilitada.
      </p>
    </section>
  );
}
