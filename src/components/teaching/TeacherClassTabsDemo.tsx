"use client";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { FlontsPortrait } from "@/components/flonts/FlontsPortrait";
import { TeacherLessonsDemo } from "./TeacherLessonsDemo";
import { TeacherMaterialsDemo } from "./TeacherMaterialsDemo";
import { TeacherActivitiesDemo } from "./TeacherActivitiesDemo";
import { TeacherAssessmentsDemo } from "./TeacherAssessmentsDemo";
import { TeacherForumDemo } from "./TeacherForumDemo";
import styles from "./TeacherClassTabsDemo.module.css";

const CLASS_TABS = [
  { label: "Visão Geral", title: "Resumo da Turma A", summary: "Sem indicadores acadêmicos reais.", items: ["Identificação da turma", "Orientação para aulas", "Acompanhamento"] },
  { label: "Aulas", title: "Aulas da Turma", summary: "Estrutura para aulas programadas, em andamento e concluídas.", items: ["Planejamento", "Materiais", "Sala de Aula (pendente)"] },
  { label: "Alunos", title: "Alunos da Turma", summary: "Nenhum dado pessoal de estudantes é exibido.", items: ["Busca (proposta)", "Acompanhamento individual (restrito)", "Vínculos (pendentes)"] },
  { label: "Conteúdos", title: "Conteúdos e Materiais", summary: "Nenhum arquivo real é carregado.", items: ["Organização", "Compartilhamento (pendente)", "Controle de acesso"] },
  { label: "Atividades", title: "Atividades", summary: "Sem tarefas ou entregas reais.", items: ["Planejamento", "Entregas (pendentes)", "Feedback"] },
  { label: "Avaliações", title: "Avaliações", summary: "Nenhuma nota é consultada.", items: ["Critérios", "Rubricas", "Correção (pendente)"] },
  { label: "Fórum", title: "Fórum", summary: "Sem mensagens ou participantes reais.", items: ["Discussões", "Moderação (pendente)", "Privacidade"] },
  { label: "Relatórios", title: "Relatórios", summary: "Sem métricas acadêmicas fabricadas.", items: ["Participação", "Progresso", "Exportação (pendente)"] },
  { label: "Configurações", title: "Configurações da Turma", summary: "Nenhuma configuração pode ser alterada.", items: ["Dados gerais", "Permissões", "Segurança"] },
] as const;
export const TEACHER_CLASS_TAB_LABELS = CLASS_TABS.map((tab) => tab.label);

export function TeacherClassTabsDemo() {
  const [selected, setSelected] = useState(0);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const uid = useId();
  const active = CLASS_TABS[selected];

  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let destination: number;
    switch (event.key) {
      case "ArrowRight": destination = (index + 1) % CLASS_TABS.length; break;
      case "ArrowLeft": destination = (index - 1 + CLASS_TABS.length) % CLASS_TABS.length; break;
      case "Home": destination = 0; break;
      case "End": destination = CLASS_TABS.length - 1; break;
      default: return;
    }
    event.preventDefault();
    setSelected(destination);
    refs.current[destination]?.focus();
  };
  return (
    <section className={styles.shell} aria-labelledby={uid + "-heading"}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Professor · Turmas · Prévia sem acesso operacional</p>
          <h2 id={uid + "-heading"}>Fundamentos da Magia — Turma A</h2>
          <p>Dados fictícios para validar navegação e acessibilidade.</p>
        </div>
        <div className={styles.flonts}><FlontsPortrait /><span>Flonts está com você</span></div>
      </header>
      <div role="tablist" aria-label="Abas demonstrativas da Turma A" className={styles.tabs}>
        {CLASS_TABS.map((tab, index) => (
          <button key={tab.label} type="button" role="tab"
            id={uid + "-tab-" + index} aria-controls={uid + "-panel"}
            aria-selected={selected === index} tabIndex={selected === index ? 0 : -1}
            className={[styles.tab, selected === index ? styles.selected : ""].join(" ")}
            ref={(node) => { refs.current[index] = node; }}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => handleTabKey(event, index)}
          >{tab.label}</button>
        ))}
      </div>
      <div id={uid + "-panel"} role="tabpanel" aria-labelledby={uid + "-tab-" + selected}
        tabIndex={0} className={styles.panel}>
        <p className={styles.eyebrow}>Aba selecionada: {active.label}</p>
        <h3>{active.title}</h3><p>{active.summary}</p>
        <ul>{active.items.map((item) => <li key={item}>{item}</li>)}</ul>
        {active.label === "Aulas" ? <TeacherLessonsDemo /> : null}
        {active.label === "Conteúdos" ? <TeacherMaterialsDemo /> : null}
        {active.label === "Atividades" ? <TeacherActivitiesDemo /> : null}
        {active.label === "Avaliações" ? <TeacherAssessmentsDemo /> : null}
        {active.label === "Fórum" ? <TeacherForumDemo /> : null}
        <p className={styles.notice}>Prévia demonstrativa: leitura, criação, edição, compartilhamento
          e exportação reais permanecem bloqueados até aprovação das políticas de acesso.</p>
      </div>
    </section>
  );
}
