"use client";

import { useState } from "react";

const features = [
  { icon: "✦", title: "Santuário", text: "Seu ponto de retorno: contexto, progresso e próximo passo em um só lugar." },
  { icon: "◇", title: "Grimórios", text: "Organize livros, capítulos e páginas para construir seu próprio acervo." },
  { icon: "◈", title: "Missões", text: "Transforme objetivos de estudo em jornadas claras e acompanháveis." },
  { icon: "✧", title: "Foco", text: "Crie um espaço de concentração que respeita seu ritmo." },
];

export default function ArcanaLanding() {
  const [voiceOpen, setVoiceOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#09080f] text-[#f6f1ff] selection:bg-fuchsia-300/20">
      <section className="relative isolate min-h-[760px] border-b border-white/10">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_72%_35%,rgba(164,102,255,.22),transparent_30%),radial-gradient(circle_at_18%_15%,rgba(85,61,180,.16),transparent_28%),linear-gradient(135deg,#0a0812_0%,#100b1c_48%,#08070d_100%)]" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:64px_64px]" aria-hidden="true" />
        <div className="mx-auto flex min-h-[760px] max-w-7xl flex-col px-6 py-7 lg:px-10">
          <nav className="flex items-center justify-between" aria-label="Navegação principal">
            <a href="#topo" className="flex items-center gap-3 font-semibold tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-300">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-fuchsia-200/30 bg-fuchsia-300/10 text-lg shadow-[0_0_30px_rgba(190,120,255,.16)]" aria-hidden="true">✦</span>
              <span>Academia Arcana</span>
            </a>
            <div className="hidden items-center gap-7 text-sm text-white/65 md:flex">
              <a href="#recursos" className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-fuchsia-300">Recursos</a>
              <a href="#experiencia" className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-fuchsia-300">Experiência</a>
              <button type="button" onClick={() => setVoiceOpen(true)} className="rounded-full border border-white/15 px-4 py-2 text-white transition hover:border-fuchsia-200/50 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fuchsia-300">Falar com o Mestre</button>
            </div>
          </nav>

          <div id="topo" className="grid flex-1 items-center gap-14 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-12">
            <div className="max-w-3xl">
              <p className="mb-6 text-xs font-semibold uppercase tracking-[.32em] text-fuchsia-200/75">Um novo ritual para aprender</p>
              <h1 className="text-5xl font-semibold leading-[.98] tracking-[-.04em] sm:text-6xl lg:text-7xl">
                Transforme estudo em <span className="bg-gradient-to-r from-fuchsia-200 via-violet-200 to-amber-100 bg-clip-text text-transparent">uma jornada.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/62 sm:text-xl">
                Um espaço educacional gamificado para organizar conhecimento, encontrar seu ritmo e continuar de onde você parou.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="/cadastro" className="rounded-full bg-gradient-to-r from-fuchsia-300 to-violet-300 px-7 py-3.5 text-center font-semibold text-[#170d24] shadow-[0_12px_50px_rgba(189,112,255,.2)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200">Começar minha jornada</a>
                <a href="/login" className="rounded-full border border-white/15 bg-white/[.035] px-7 py-3.5 text-center font-semibold text-white transition hover:bg-white/[.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200">Já tenho uma conta</a>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[.2em] text-white/38" aria-label="Princípios da Academia Arcana">
                <span>Contexto</span><span aria-hidden="true">✦</span><span>Ritmo</span><span aria-hidden="true">✦</span><span>Continuidade</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[520px]" aria-hidden="true">
              <div className="absolute inset-10 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="relative aspect-square rounded-[2.5rem] border border-white/10 bg-white/[.025] p-7 shadow-[0_30px_100px_rgba(0,0,0,.45)] backdrop-blur">
                <div className="absolute inset-7 rounded-[2rem] border border-fuchsia-200/10" />
                <div className="grid h-full place-items-center">
                  <div className="relative grid h-52 w-52 place-items-center rounded-full border border-fuchsia-200/20 bg-[radial-gradient(circle,rgba(215,166,255,.18),rgba(70,40,120,.05)_55%,transparent_70%)] shadow-[0_0_90px_rgba(182,106,255,.16)]">
                    <div className="absolute inset-6 rounded-full border border-amber-100/10" />
                    <div className="text-7xl text-fuchsia-100/80">✦</div>
                  </div>
                </div>
                <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-[.25em] text-fuchsia-200/60">Mestre Arcano</p>
                  <p className="mt-1 text-sm text-white/70">Uma inteligência para acompanhar sua jornada.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="border-b border-white/10 bg-[#0b0912] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[.3em] text-fuchsia-200/60">A experiência</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Tudo começa pelo seu contexto.</h2>
            <p className="mt-5 leading-7 text-white/55">A interface foi pensada para reduzir ruído, tornar o progresso visível e dar significado ao próximo passo.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-white/10 bg-white/[.025] p-6 transition hover:-translate-y-1 hover:border-fuchsia-200/20 hover:bg-white/[.045]">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-fuchsia-200/15 bg-fuchsia-300/[.06] text-fuchsia-100" aria-hidden="true">{feature.icon}</div>
                <h3 className="mt-6 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/50">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="experiencia" className="relative border-b border-white/10 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(147,87,255,.13),transparent_38%)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.3em] text-fuchsia-200/60">Uma jornada contínua</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Estude. Organize. Continue.</h2>
            <p className="mt-5 max-w-xl leading-7 text-white/55">A Academia Arcana conecta planejamento, conhecimento e gamificação sem exigir que você recomece a cada sessão.</p>
            <button type="button" onClick={() => setVoiceOpen(true)} className="mt-8 rounded-full border border-fuchsia-200/20 bg-fuchsia-200/[.07] px-6 py-3 font-semibold text-fuchsia-100 transition hover:bg-fuchsia-200/[.12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-fuchsia-200">Conversar com o Mestre Arcano</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Seu espaço", "Seu progresso", "Seu próximo passo"].map((label, index) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-white/[.025] p-6">
                <span className="text-xs text-fuchsia-200/50">0{index + 1}</span>
                <h3 className="mt-12 text-lg font-semibold">{label}</h3>
                <p className="mt-3 text-sm leading-6 text-white/45">{["Um ambiente que mantém o essencial perto.", "Sinais claros para acompanhar sua evolução.", "Uma direção concreta para voltar ao estudo."][index]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-10 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <p>Academia Arcana · Aprender é construir uma jornada.</p>
        <div className="flex gap-5"><a href="#recursos" className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-fuchsia-300">Recursos</a><button type="button" onClick={() => setVoiceOpen(true)} className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-fuchsia-300">Mestre Arcano</button></div>
      </footer>

      {voiceOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="voice-title">
          <div className="w-full max-w-lg rounded-3xl border border-fuchsia-200/15 bg-[#110d19] p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs uppercase tracking-[.25em] text-fuchsia-200/55">Experiência de voz</p><h2 id="voice-title" className="mt-2 text-2xl font-semibold">Mestre Arcano</h2></div>
              <button type="button" onClick={() => setVoiceOpen(false)} aria-label="Fechar" className="rounded-full border border-white/10 px-3 py-1 text-white/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-fuchsia-300">×</button>
            </div>
            <p className="mt-5 leading-7 text-white/55">A experiência de voz está preparada no Pathors. A chamada pode ser conectada aqui assim que o endpoint de produção do agente for disponibilizado ao front-end.</p>
            <button type="button" onClick={() => setVoiceOpen(false)} className="mt-7 rounded-full bg-fuchsia-200 px-5 py-3 font-semibold text-[#170d24]">Fechar</button>
          </div>
        </div>
      )}
    </main>
  );
}
