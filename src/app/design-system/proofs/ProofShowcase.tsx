"use client";

import Image from "next/image";
import { CheckCircle2, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useTheme } from "@/design-system/themes";
import { THEME_IDS, themePresets } from "@/design-system/themes/presets";
import type { ThemeId } from "@/design-system/tokens/types";
import { proofRegistry, type ProofId } from "@/design-system/proofs/proof-registry";

import styles from "./ProofShowcase.module.css";

type Variant = "current" | "target" | "negative";

function isThemeId(value: string | null): value is ThemeId {
  return Boolean(value && THEME_IDS.includes(value as ThemeId));
}

function VariantCard({
  proofId,
  variant,
  title,
  children,
}: {
  proofId: ProofId;
  variant: Variant;
  title: string;
  children: ReactNode;
}) {
  return (
    <article
      className={styles.variant}
      data-proof-id={proofId}
      data-proof-variant={variant}
      data-testid={`proof-${proofId}-${variant}`}
    >
      <header className={styles.variantHeader}>
        <span className={styles.variantCode}>{variant === "current" ? "A" : variant === "target" ? "B" : "C"}</span>
        <div>
          <p className={styles.variantLabel}>
            {variant === "current" ? "CURRENT" : variant === "target" ? "TARGET" : "NEGATIVE CONTROL"}
          </p>
          <h3>{title}</h3>
        </div>
      </header>
      {children}
    </article>
  );
}

function ProofHeader({ id }: { id: ProofId }) {
  const proof = proofRegistry.find((candidate) => candidate.id === id);
  if (!proof) return null;

  return (
    <header className={styles.proofHeader}>
      <div>
        <p className="aa-eyebrow">{proof.id} · {proof.verdict}</p>
        <h2>{proof.title}</h2>
      </div>
      <dl className={styles.contract}>
        <div><dt>Material</dt><dd>{proof.material}</dd></div>
        <div><dt>Textura</dt><dd>{proof.texture}</dd></div>
        <div><dt>Densidade</dt><dd>{proof.density}</dd></div>
        <div><dt>Luz</dt><dd>{proof.light.join(" + ")}</dd></div>
      </dl>
    </header>
  );
}

function FocusProof() {
  return (
    <section className={styles.proofSection} data-proof-section="AA-PROOF-001">
      <ProofHeader id="AA-PROOF-001" />
      <div className={styles.variantGrid}>
        <VariantCard proofId="AA-PROOF-001" variant="current" title="Sessão atual">
          <div className="aa-surface aa-focus-session-card">
            <div className="aa-surface-header">
              <div>
                <p className="aa-eyebrow">Sessão guiada</p>
                <h4>25 minutos de foco</h4>
              </div>
              <span className="aa-badge aa-badge-info">Em andamento</span>
            </div>
            <div className="aa-focus-timer"><span>18:42</span></div>
            <div className="aa-progress-track" role="progressbar" aria-label="Progresso CURRENT 25%" aria-valuemin={0} aria-valuemax={100} aria-valuenow={25}>
              <div className="aa-progress-value" style={{ width: "25%" }} />
            </div>
            <div className="aa-focus-session-actions">
              <button className="aa-button aa-button-primary" type="button"><Pause size={20} aria-hidden="true" />Pausar</button>
              <button className="aa-button aa-button-secondary" type="button"><RotateCcw size={20} aria-hidden="true" />Reiniciar</button>
            </div>
          </div>
        </VariantCard>

        <VariantCard proofId="AA-PROOF-001" variant="target" title="M0 · silêncio operacional">
          <div className={styles.targetFocus}>
            <div className={styles.targetContentPlate} data-proof-content-plate>
              <div className={styles.focusStatusRow}>
                <span className={styles.smallLabel}>Sessão ativa</span>
                <span className={styles.activationMark} aria-hidden="true" />
              </div>
              <p className={styles.focusTime} data-proof-copy>18:42</p>
              <p className={styles.supportCopy} data-proof-copy>Em andamento · sem pressão artificial</p>
              <div className="aa-progress-track" role="progressbar" aria-label="Progresso TARGET 25%" aria-valuemin={0} aria-valuemax={100} aria-valuenow={25}>
                <div className="aa-progress-value" style={{ width: "25%" }} />
              </div>
              <div className={styles.actionRow}>
                <button className="aa-button aa-button-primary" type="button"><Pause size={20} aria-hidden="true" />Pausar</button>
                <button className="aa-button aa-button-secondary" type="button"><Play size={20} aria-hidden="true" />Retomar</button>
              </div>
            </div>
          </div>
        </VariantCard>

        <VariantCard proofId="AA-PROOF-001" variant="negative" title="Rejeitar · magia saturada">
          <div className={styles.negativeFocus}>
            <span className={styles.orbitOne} aria-hidden="true" />
            <span className={styles.orbitTwo} aria-hidden="true" />
            <span className={styles.orbitThree} aria-hidden="true" />
            <div className={styles.negativeContent}>
              <p className={styles.smallLabel}>Excesso deliberado</p>
              <p className={styles.focusTime}>18:42</p>
              <p>O estado depende visualmente de brilho, camadas e densidade incompatíveis com D0.</p>
              <button className="aa-button aa-button-primary" type="button">Pausar</button>
            </div>
          </div>
        </VariantCard>
      </div>
    </section>
  );
}

function GrimoiresProof() {
  return (
    <section className={styles.proofSection} data-proof-section="AA-PROOF-002">
      <ProofHeader id="AA-PROOF-002" />
      <div className={styles.variantGrid}>
        <VariantCard proofId="AA-PROOF-002" variant="current" title="Card atual">
          <article className="aa-surface grimoires-library-card">
            <div className="aa-grimoire-item-visual" aria-hidden="true">
              <Image src="/assets/grimoires/aa-grimoire-cover-base.svg" alt="" width={96} height={132} />
            </div>
            <div className="aa-grimoire-item-copy">
              <p className="aa-eyebrow">Grimório</p>
              <h4>Fundamentos de Biologia</h4>
              <p>Notas, capítulos e páginas reunidos em uma biblioteca pessoal.</p>
            </div>
            <button className="aa-button aa-button-ghost grimoires-library-open" type="button">Abrir grimório</button>
          </article>
        </VariantCard>

        <VariantCard proofId="AA-PROOF-002" variant="target" title="M1 · objeto material, UI funcional">
          <article className={styles.targetGrimoire}>
            <div className={styles.bookObject} aria-hidden="true">
              <Image src="/assets/grimoires/aa-grimoire-cover-base.svg" alt="" width={96} height={132} />
            </div>
            <div className={styles.targetContentPlate} data-proof-content-plate>
              <p className={styles.smallLabel}>Grimório · conhecimento</p>
              <h4 data-proof-copy>Fundamentos de Biologia</h4>
              <p className={styles.supportCopy} data-proof-copy>12 capítulos · atualizado recentemente</p>
              <button className="aa-button aa-button-secondary aa-button-sm" type="button">Abrir grimório</button>
            </div>
          </article>
        </VariantCard>

        <VariantCard proofId="AA-PROOF-002" variant="negative" title="Rejeitar · card inteiro skeuomórfico">
          <article className={styles.negativeGrimoire}>
            <div className={styles.negativePaperEdge} aria-hidden="true" />
            <div className={styles.negativeContent}>
              <p className={styles.smallLabel}>Pergaminho total</p>
              <h4>Fundamentos de Biologia</h4>
              <p>Textura, moldura e ornamentação invadem a superfície funcional inteira.</p>
              <button className="aa-button aa-button-secondary aa-button-sm" type="button">Abrir</button>
            </div>
          </article>
        </VariantCard>
      </div>
    </section>
  );
}

function SanctuaryProof() {
  return (
    <section className={styles.proofSection} data-proof-section="AA-PROOF-003">
      <ProofHeader id="AA-PROOF-003" />
      <div className={styles.variantGrid}>
        <VariantCard proofId="AA-PROOF-003" variant="current" title="Hero atual">
          <div className="aa-sanctuary-hero">
            <div className="aa-sanctuary-hero-copy">
              <p className="aa-eyebrow">Santuário · sua jornada</p>
              <h4>Bom retorno, estudante.</h4>
              <p>Siga o fio da sua jornada com clareza e um próximo passo de cada vez.</p>
              <div className="aa-sanctuary-hero-action">
                <button className="aa-button aa-button-primary" type="button">Continuar jornada</button>
              </div>
            </div>
            <div className="aa-sanctuary-hero-atmosphere" aria-hidden="true">
              <div className="aa-sanctuary-sigil">
                <Image src="/assets/sanctuary/aa-sanctuary-sigil.svg" alt="" width={128} height={128} />
              </div>
            </div>
          </div>
        </VariantCard>

        <VariantCard proofId="AA-PROOF-003" variant="target" title="M2 · arcano habitável">
          <div className={styles.targetSanctuary}>
            <div className={styles.sanctuaryAtmosphere} aria-hidden="true">
              <Image src="/assets/sanctuary/aa-sanctuary-sigil.svg" alt="" width={128} height={128} />
            </div>
            <div className={styles.targetContentPlate} data-proof-content-plate>
              <p className={styles.smallLabel}>Santuário · orientação</p>
              <h4 data-proof-copy>Seu próximo passo está claro.</h4>
              <p className={styles.supportCopy} data-proof-copy>Retome o capítulo atual ou ajuste o ritmo de hoje sem punição.</p>
              <button className="aa-button aa-button-primary" type="button">Continuar jornada</button>
            </div>
          </div>
        </VariantCard>

        <VariantCard proofId="AA-PROOF-003" variant="negative" title="Rejeitar · D3 permanente">
          <div className={styles.negativeSanctuary}>
            <div className={styles.negativeGlyphField} aria-hidden="true">✦ ◌ ✧ ◈ ◌ ✦</div>
            <div className={styles.negativeContent}>
              <p className={styles.smallLabel}>Atmosfera dominante</p>
              <h4>Santuário</h4>
              <p>Glow, símbolos e camadas competem diretamente com a orientação principal.</p>
              <button className="aa-button aa-button-primary" type="button">Continuar jornada</button>
            </div>
          </div>
        </VariantCard>
      </div>
    </section>
  );
}

function AchievementProof() {
  return (
    <section className={styles.proofSection} data-proof-section="AA-PROOF-004">
      <ProofHeader id="AA-PROOF-004" />
      <div className={styles.variantGrid}>
        <VariantCard proofId="AA-PROOF-004" variant="current" title="Representação persistente atual">
          <article className="aa-surface aa-sanctuary-section">
            <div className="aa-achievement-item-copy">
              <Image className="aa-achievement-item-emblem" src="/assets/gamification/aa-achievement-emblem.svg" alt="" width={40} height={40} />
              <div>
                <strong>Primeiro ciclo completo</strong>
                <p>Marco derivado de progresso persistido.</p>
              </div>
              <CheckCircle2 className="aa-achievement-item-status" size={20} aria-label="Desbloqueada" />
            </div>
          </article>
        </VariantCard>

        <VariantCard proofId="AA-PROOF-004" variant="target" title="M3 transitório · reveal → assentamento">
          <div className={styles.targetAchievement}>
            <div className={styles.rewardHalo} aria-hidden="true" />
            <Image className={styles.rewardEmblem} src="/assets/gamification/aa-achievement-emblem.svg" alt="" width={96} height={96} />
            <div className={styles.targetContentPlate} data-proof-content-plate>
              <p className={styles.smallLabel}>Conquista excepcional</p>
              <h4 data-proof-copy>Primeiro ciclo completo</h4>
              <p className={styles.supportCopy} data-proof-copy>Seu progresso real desbloqueou este marco. A celebração é temporária; o registro permanece.</p>
              <button className="aa-button aa-button-primary" type="button"><Sparkles size={20} aria-hidden="true" />Continuar</button>
            </div>
          </div>
        </VariantCard>

        <VariantCard proofId="AA-PROOF-004" variant="negative" title="Rejeitar · M3 persistente">
          <div className={styles.negativeAchievement}>
            {[0, 1, 2].map((item) => (
              <div className={styles.negativeAchievementItem} key={item}>
                <Image src="/assets/gamification/aa-achievement-emblem.svg" alt="" width={48} height={48} />
                <strong>Conquista ritual {item + 1}</strong>
              </div>
            ))}
            <p>Toda a lista recebe a mesma intensidade máxima e destrói a raridade do ritual.</p>
          </div>
        </VariantCard>
      </div>
    </section>
  );
}

export function ProofShowcase() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("theme");
    if (isThemeId(requested)) setTheme(requested);
  }, [setTheme]);

  return (
    <main className={styles.lab} data-testid="proof-showcase" data-proof-status="experimental">
      <header className={styles.labHeader}>
        <div>
          <p className="aa-eyebrow">Fase 2 · Ciclo 4 · protótipo controlado</p>
          <h1>Proof Surfaces</h1>
          <p className="aa-state-copy">
            A/B/C comparável: CURRENT × TARGET × NEGATIVE CONTROL. Nenhum bloco desta rota é asset ou UI canônica.
          </p>
        </div>
        <label className="aa-field">
          Tema de prova
          <select
            className="aa-input"
            value={theme}
            onChange={(event) => setTheme(event.target.value as ThemeId)}
            data-testid="proof-theme-select"
          >
            {THEME_IDS.map((id) => <option key={id} value={id}>{themePresets[id].name}</option>)}
          </select>
        </label>
      </header>

      <div className={styles.experimentalNotice} role="note">
        <strong>EXPERIMENTAL.</strong> A rota valida linguagem visual; não promove geometria, tokens ou assets para final canon.
      </div>

      <FocusProof />
      <GrimoiresProof />
      <SanctuaryProof />
      <AchievementProof />
    </main>
  );
}
