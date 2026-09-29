"use client";

import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  Sparkles,
  Star,
  Wand2,
  X,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Grimórios vivos",
    text: "Organize conteúdos, anotações e capítulos em um espaço de estudo que parece seu.",
  },
  {
    icon: CalendarDays,
    title: "Missões & cronograma",
    text: "Transforme objetivos em passos claros, sessões de foco e progresso visível.",
  },
  {
    icon: Brain,
    title: "Aprendizagem adaptativa",
    text: "A experiência se ajusta ao seu ritmo, contexto e forma de aprender.",
  },
];

export const AcademiaArcanaLanding = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#08070d] text-[#f7f2e8] selection:bg-violet-300/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_75%_12%,rgba(116,86,220,.24),transparent_32%),radial-gradient(circle_at_10%_80%,rgba(31,132,123,.12),transparent_28%)]" />
      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="#" className="flex items-center gap-3" aria-label="Academia Arcana">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet-300/25 bg-violet-300/10 shadow-[0_0_30px_rgba(139,92,246,.18)]">
            <Sparkles size={19} />
          </span>
          <span className="font-serif text-lg tracking-wide">Academia Arcana</span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#recursos" className="rounded text-sm text-white/65 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-300/60">Recursos</a>
          <a href="#como-funciona" className="rounded text-sm text-white/65 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-300/60">Como funciona</a>
          <button onClick={() => setShowDetails(true)} className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-300/60">
            Entrar na Academia
          </button>
        </div>
        <button className="rounded-lg border border-white/10 p-2 md:hidden" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <ChevronDown size={20} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="relative z-20 mx-5 rounded-2xl border border-white/10 bg-[#11101a]/95 p-4 backdrop-blur md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            <a href="#recursos" onClick={() => setMenuOpen(false)}>Recursos</a>
            <a href="#como-funciona" onClick={() => setMenuOpen(false)}>Como funciona</a>
            <button onClick={() => setShowDetails(true)} className="text-left">Entrar na Academia</button>
          </div>
        </div>
      )}

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:pb-32 lg:pt-28">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[.07] px-3.5 py-2 text-xs font-semibold uppercase tracking-[.18em] text-violet-200">
            <Wand2 size={14} /> Um novo jeito de estudar
          </div>
          <h1 className="max-w-4xl font-serif text-5xl leading-[.98] tracking-[-.035em] sm:text-6xl lg:text-7xl">
            Transforme seu estudo em uma{" "}
            <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-amber-100 bg-clip-text text-transparent">jornada.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
            A Academia Arcana une planejamento, foco, conhecimento e gamificação em uma experiência feita para você aprender com mais clareza — e continuar avançando.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => setShowDetails(true)} className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#e8ddc7] px-6 py-3.5 font-semibold text-[#15121b] shadow-[0_12px_40px_rgba(232,221,199,.12)] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-300/70">
              Descobrir a Academia <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </button>
            <a href="#recursos" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[.03] px-6 py-3.5 font-semibold text-white/85 transition hover:bg-white/[.07] focus:outline-none focus:ring-2 focus:ring-violet-300/60">
              Explorar recursos
            </a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/45">
            <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-300" /> Acessível</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-300" /> Personalizável</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-300" /> Feito para aprender</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:ml-auto">
          <div className="absolute -inset-8 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative rounded-[2rem] border border-white/10 bg-white/[.035] p-5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[1.5rem] border border-violet-200/10 bg-[#0f0d16] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[.2em] text-violet-200/60">Seu santuário</p>
                  <h2 className="mt-1 font-serif text-2xl">Boa noite, Arcanista.</h2>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-full bg-violet-300/10 text-violet-200"><Star size={18} /></div>
              </div>
              <div className="mt-7 rounded-2xl border border-white/8 bg-white/[.025] p-4">
                <div className="flex items-center justify-between text-xs text-white/45"><span>Missão de hoje</span><span>3 / 5</span></div>
                <div className="mt-3 h-2 rounded-full bg-white/7"><div className="h-2 w-3/5 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-300" /></div>
                <p className="mt-4 font-medium">Revisar Fundamentos de Neuroaprendizagem</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/[.025] p-4"><p className="text-xs text-white/40">Foco</p><p className="mt-1 text-xl font-semibold">42 min</p></div>
                <div className="rounded-2xl border border-white/8 bg-white/[.025] p-4"><p className="text-xs text-white/40">Sequência</p><p className="mt-1 text-xl font-semibold">7 dias</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="relative border-y border-white/[.06] bg-white/[.015] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-200/60">Seu arsenal</p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Tudo o que você precisa para continuar aprendendo.</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="group rounded-3xl border border-white/8 bg-[#0d0c13]/80 p-7 transition hover:-translate-y-1 hover:border-violet-200/20">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-300/10 text-violet-200"><Icon size={20} /></div>
                <h3 className="mt-6 font-serif text-xl">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/50">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="relative px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-100/55">Seu ritmo, seu caminho</p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Menos fricção. Mais intenção.</h2>
            <p className="mt-5 max-w-xl leading-7 text-white/55">Comece pelo que importa, transforme grandes objetivos em pequenas missões e acompanhe sua evolução sem transformar produtividade em cobrança.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) setSubmitted(true); }} className="rounded-3xl border border-white/8 bg-white/[.025] p-6 sm:p-8">
            <p className="font-serif text-2xl">Entre para a lista de acesso</p>
            <p className="mt-2 text-sm text-white/45">Receba novidades sobre a construção da Academia Arcana.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="email">Seu e-mail</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm outline-none placeholder:text-white/25 focus:border-violet-300/50 focus:ring-2 focus:ring-violet-300/20" />
              <button className="rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-300/70">{submitted ? "Recebido ✓" : "Quero acompanhar"}</button>
            </div>
          </form>
        </div>
      </section>

      <footer className="border-t border-white/[.06] px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>© Academia Arcana</span>
          <span>Aprender também pode parecer magia.</span>
        </div>
      </footer>

      {showDetails && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(e) => e.currentTarget === e.target && setShowDetails(false)}>
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#12101a] p-7 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[.2em] text-violet-200/60">Portal Arcano</p>
                <h2 id="modal-title" className="mt-2 font-serif text-2xl">A jornada começa aqui.</h2>
              </div>
              <button onClick={() => setShowDetails(false)} aria-label="Fechar" className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-300/60"><X size={18} /></button>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/55">Este portal visual já está pronto para evoluir com autenticação, dados e experiências do produto real.</p>
            <button onClick={() => setShowDetails(false)} className="mt-7 w-full rounded-xl bg-[#e8ddc7] py-3.5 font-semibold text-[#15121b]">Continuar explorando</button>
          </div>
        </div>
      )}
    </main>
  );
};
