"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, CalendarDays, CheckCircle2, Compass, GraduationCap, LibraryBig, ListChecks, ScrollText, UserRound, RotateCcw } from "lucide-react";

import { addDemoTask, completeDemoTask, DEMO_PAGES, demoProgress, initialDemoState, saveDemoNote, toggleDemoPage, type DemoState } from "./mvp-model";
import styles from "./MvpPilot.module.css";

type Section = "santuario" | "academia" | "grimorios" | "capitulos" | "paginas" | "missoes" | "cronograma" | "perfil";
const SECTIONS: Array<{ id: Section; label: string; realHref: string; icon: typeof Compass }> = [
  { id: "santuario", label: "Santuário", realHref: "/santuario", icon: Compass },
  { id: "academia", label: "Academia", realHref: "/academia", icon: GraduationCap },
  { id: "grimorios", label: "Grimórios", realHref: "/grimorios", icon: LibraryBig },
  { id: "capitulos", label: "Capítulos", realHref: "/workspace", icon: BookOpen },
  { id: "paginas", label: "Páginas", realHref: "/workspace", icon: ScrollText },
  { id: "missoes", label: "Missões", realHref: "/missoes", icon: ListChecks },
  { id: "cronograma", label: "Cronograma", realHref: "/cronograma", icon: CalendarDays },
  { id: "perfil", label: "Perfil", realHref: "/perfil", icon: UserRound },
];

export function MvpPilot() {
  const [section, setSection] = useState<Section>("santuario");
  const [state, setState] = useState<DemoState>(initialDemoState);
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedPageId, setSelectedPageId] = useState<string>(DEMO_PAGES[0].id);

  const progress = demoProgress(state);
  const active = SECTIONS.find((item) => item.id === section) ?? SECTIONS[0];
  const selectedPage = DEMO_PAGES.find((page) => page.id === selectedPageId) ?? DEMO_PAGES[0];
  const pending = state.tasks.filter((task) => !task.done);
  const taskAction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    setState((previous) => addDemoTask(previous, taskTitle, `demo-${crypto.randomUUID()}`));
    setTaskTitle("");
  };
  const go = (next: Section) => setSection(next);
  const openPage = (id: string) => { setSelectedPageId(id); go("paginas"); };

  return (
    <div className={styles.root} data-testid="mvp-pilot" data-demo="synthetic-only">
      <a className={styles.skip} href="#mvp-content">Ir para conteúdo</a>
      <aside className={styles.sidebar} aria-label="Navegação da demonstração">
        <div className={styles.brand}>
          <span className={styles.seal} aria-hidden="true">✧</span>
          <div><strong>Academia Arcana</strong><span>Jornada de aprendizagem</span></div>
        </div>
        <p className={styles.menuLabel}>EXPLORAR A ACADEMIA</p>
        <nav aria-label="Módulos do MVP">
          <ul className={styles.menu}>
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button type="button" className={section === id ? styles.menuActive : styles.menuButton}
                  aria-current={section === id ? "page" : undefined} onClick={() => go(id)}>
                  <Icon size={20} aria-hidden="true" />{label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.sideNote}>
          <span className="aa-badge aa-badge-info">Piloto local</span>
          <p>Ambiente de demonstração. Sem contas, pagamentos ou integrações reais.</p>
        </div>
      </aside>
      <main id="mvp-content" className={styles.main}>
        <header className={styles.topbar}>
          <div><p className="aa-eyebrow">Academia Arcana · MVP</p><span className={styles.crumb}>Sua jornada / {active.label}</span></div>
          <span className="aa-badge aa-badge-warning">Dados sintéticos</span>
        </header>
        <div className={styles.content}>
          <section className={styles.hero} aria-labelledby="mvp-title">
            <div>
              <p className="aa-eyebrow">✧ Caminhos do conhecimento</p>
              <h1 id="mvp-title">{section === "santuario" ? "Seu Santuário de estudos" : active.label}</h1>
              <p>Uma jornada no seu ritmo. Progresso sem pressão, conhecimento com propósito.</p>
            </div>
            <div className={styles.heroMark} aria-hidden="true">✦</div>
          </section>
          <div className={styles.status} role="status">Este é um piloto interativo com dados fictícios em memória; ao atualizar a página, a demonstração reinicia. <Link href={active.realHref}>Acessar o módulo real (requer login)</Link>.</div>

          {section === "santuario" && <>
            <div className={styles.metrics}>
              <article className={styles.metric}><span>Tarefas concluídas</span><strong>{progress.doneTasks} / {progress.totalTasks}</strong></article>
              <article className={styles.metric}><span>Páginas estudadas</span><strong>{progress.pages} / {progress.totalPages}</strong></article>
              <article className={styles.metric}><span>Próximo passo</span><strong>{pending.length ? "Retomar" : "Explorar"}</strong></article>
            </div>
            <div className={styles.twoColumns}>
              <section className={styles.panel} aria-labelledby="continue-title"><p className="aa-eyebrow">Continue aprendendo</p><h2 id="continue-title">Volte de onde parou</h2><p>Abra uma página do seu grimório e registre seu avanço, sem perder o contexto.</p><button className="aa-button aa-button-primary" onClick={() => openPage(DEMO_PAGES.find((p) => !state.completedPageIds.includes(p.id))?.id ?? DEMO_PAGES[0].id)}>Continuar estudo</button></section>
              <section className={styles.panel} aria-labelledby="next-title"><p className="aa-eyebrow">Missão do momento</p><h2 id="next-title">Um passo possível</h2><p>{pending[0]?.title ?? "Você concluiu as tarefas desta sessão de demonstração."}</p><button className="aa-button aa-button-secondary" onClick={() => go("cronograma")}>Abrir cronograma</button></section>
            </div>
          </>}

          {section === "academia" && <section className={styles.panel} aria-labelledby="academy-title"><p className="aa-eyebrow">Caminhos de aprendizagem</p><h2 id="academy-title">Por onde você quer começar?</h2><div className={styles.cards}>
            {[{ label: "Biblioteca de Grimórios", desc: "Explore o conhecimento", next: "grimorios" as Section },{ label: "Estudar uma página", desc: "Registre seu aprendizado", next: "paginas" as Section },{ label: "Organizar o tempo", desc: "Planeje seu próximo passo", next: "cronograma" as Section }].map((item) => <button className={styles.actionCard} key={item.label} onClick={() => go(item.next)}><strong>{item.label}</strong><span>{item.desc}</span><span aria-hidden="true">↗</span></button>)}
          </div></section>}

          {section === "grimorios" && <section className={styles.panel} aria-labelledby="grimoire-title"><p className="aa-eyebrow">Biblioteca</p><h2 id="grimoire-title">Seus grimórios</h2><div className={styles.grimoire}><div className={styles.bookArt} aria-hidden="true">✦<span>ARCANA</span></div><div><span className="aa-badge aa-badge-neutral">Amostra fictícia</span><h3>Fundamentos da Aprendizagem</h3><p>Uma coleção para experimentar capítulos, páginas e exercícios no ritmo que preferir.</p><button className="aa-button aa-button-primary" onClick={() => go("capitulos")}>Explorar capítulos</button></div></div></section>}

          {section === "capitulos" && <section className={styles.panel} aria-labelledby="chapters-title"><p className="aa-eyebrow">Grimório · Fundamentos da Aprendizagem</p><h2 id="chapters-title">Capítulos</h2>{["Fundamentos", "Prática"].map((chapter) => <section key={chapter} className={styles.chapter} aria-label={`Capítulo ${chapter}`}><h3>{chapter}</h3><ul className={styles.cleanList}>{DEMO_PAGES.filter((page) => page.chapter === chapter).map((page) => <li key={page.id}><button className={styles.listButton} onClick={() => openPage(page.id)}><span>{page.title}</span><span>{state.completedPageIds.includes(page.id) ? "Estudada ✓" : "Abrir →"}</span></button></li>)}</ul></section>)}</section>}

          {section === "paginas" && <div className={styles.twoColumns}><section className={styles.panel} aria-labelledby="pages-title"><p className="aa-eyebrow">Grimório · leitura</p><h2 id="pages-title">Páginas</h2><ul className={styles.cleanList}>{DEMO_PAGES.map((page) => <li key={page.id}><button aria-current={selectedPageId === page.id ? "page" : undefined} className={styles.listButton} onClick={() => setSelectedPageId(page.id)}>{page.title}</button></li>)}</ul></section><article className={styles.panel} aria-labelledby="reading-title"><p className="aa-eyebrow">{selectedPage.chapter}</p><h2 id="reading-title">{selectedPage.title}</h2><p>{selectedPage.body}</p><label className={styles.field} htmlFor="mvp-note">Suas anotações (amostra local)<textarea id="mvp-note" className="aa-input" rows={4} maxLength={500} value={state.notes[selectedPage.id] ?? ""} onChange={(event) => setState((previous) => saveDemoNote(previous, selectedPage.id, event.target.value))} placeholder="Registre uma descoberta..." /></label><button className="aa-button aa-button-primary" onClick={() => setState((previous) => toggleDemoPage(previous, selectedPage.id))}>{state.completedPageIds.includes(selectedPage.id) ? "Marcar como não estudada" : "Marcar como estudada"}</button></article></div>}

          {section === "missoes" && <section className={styles.panel} aria-labelledby="missions-title"><p className="aa-eyebrow">Gamificação respeitosa</p><h2 id="missions-title">Missões da jornada</h2><p>As missões abaixo refletem somente suas ações nesta sessão fictícia, sem XP ou recompensas simuladas como conquistas reais.</p><ul className={styles.cleanList}>{state.tasks.map((task) => <li key={task.id} className={styles.mission}><CheckCircle2 size={20} color={task.done ? "var(--aa-status-success)" : "var(--aa-text-muted)"} aria-hidden="true"/><span>{task.title}</span><span className="aa-badge aa-badge-neutral">{task.done ? "Concluída" : "Pendente"}</span></li>)}</ul><button className="aa-button aa-button-secondary" onClick={() => go("cronograma")}>Gerenciar tarefas</button></section>}

          {section === "cronograma" && <section className={styles.panel} aria-labelledby="schedule-title"><p className="aa-eyebrow">Planejamento · ritmo</p><h2 id="schedule-title">Cronograma</h2><p>Crie e conclua tarefas nesta demonstração. Nada é enviado ao Supabase ou a integrações externas.</p><form className={styles.taskForm} onSubmit={taskAction}><label htmlFor="mvp-task">Nova tarefa</label><input className="aa-input" id="mvp-task" maxLength={120} required placeholder="Ex.: Revisar uma página" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)}/><button type="submit" className="aa-button aa-button-primary" disabled={!taskTitle.trim()}>Adicionar tarefa</button></form><ul className={styles.cleanList}>{state.tasks.map((task) => <li className={styles.taskRow} key={task.id}><span className={task.done ? styles.taskDone : undefined}>{task.title}</span>{task.done ? <span className="aa-badge aa-badge-success">Concluída</span> : <button className="aa-button aa-button-secondary aa-button-sm" onClick={() => setState((previous) => completeDemoTask(previous, task.id))}>Concluir</button>}</li>)}</ul></section>}

          {section === "perfil" && <section className={styles.panel} aria-labelledby="profile-title"><p className="aa-eyebrow">Identidade de demonstração</p><h2 id="profile-title">Perfil</h2><div className={styles.profile}><div className={styles.avatar} aria-hidden="true">✧</div><div><h3>Aprendiz Arcano</h3><p>Perfil fictício · nenhuma conta criada</p><p>{progress.pages} páginas estudadas · {progress.doneTasks} tarefas concluídas</p></div></div><button className="aa-button aa-button-secondary" onClick={() => { setState(initialDemoState); setTaskTitle(""); }}> <RotateCcw size={16} aria-hidden="true" /> Reiniciar demonstração</button></section>}
        </div>
        <footer className={styles.footer}>Academia Arcana · piloto de desenvolvimento com dados sintéticos · sem integração produtiva.</footer>
      </main>
    </div>
  );
}