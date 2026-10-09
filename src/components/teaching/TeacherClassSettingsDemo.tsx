"use client";

import { useMemo, useState } from "react";
import styles from "./TeacherClassSettingsDemo.module.css";

/**
 * Read-only teacher/class settings reference. All displayed settings are
 * proposed labels, not values from a real class, identity or backend.
 */
export const SETTINGS_AREAS = ["Todas as áreas", "Dados gerais", "Permissões", "Segurança"] as const;
export const SETTINGS_STATES = ["Todas as situações", "Ilustrativo", "Aguardando política"] as const;

type Area = Exclude<(typeof SETTINGS_AREAS)[number], "Todas as áreas">;
type State = Exclude<(typeof SETTINGS_STATES)[number], "Todas as situações">;
type SettingSection = Readonly<{
  id: string;
  area: Area;
  title: string;
  state: State;
  description: string;
  entries: readonly Readonly<{ label: string; information: string }>[];
  required: string;
}>;

const SECTIONS: readonly SettingSection[] = [
  {
    id: "demo-dados",
    area: "Dados gerais",
    title: "Identificação e apresentação",
    state: "Ilustrativo",
    description: "A organização destas informações é uma proposta de interface, sem dados de escola real.",
    entries: [
      { label: "Nome ilustrativo", information: "Fundamentos da Magia — Turma A (fictícia)" },
      { label: "Descrição", information: "Ambiente demonstrativo de estudo arcano" },
      { label: "Período", information: "Não conectado a calendário real" },
    ],
    required: "Edição de identidade da turma exige vínculo confirmado e política de alteração.",
  },
  {
    id: "demo-permissoes",
    area: "Permissões",
    title: "Acesso à turma",
    state: "Aguardando política",
    description: "Nenhum vínculo docente, papel administrativo ou permissão é concedido por esta prévia.",
    entries: [
      { label: "Papel do Professor", information: "Não verificado — contrato canônico pendente" },
      { label: "Participantes", information: "Nenhuma conta de estudante consultada" },
      { label: "Compartilhamento", information: "Bloqueado até política explícita por recurso" },
    ],
    required: "Autorização por turma, revogação, RLS e testes entre contas são pré-requisitos.",
  },
  {
    id: "demo-seguranca",
    area: "Segurança",
    title: "Privacidade e proteção",
    state: "Aguardando política",
    description: "Esta seção documenta controles necessários, não certifica controles reais.",
    entries: [
      { label: "Visibilidade", information: "Privado por padrão — requisito proposto" },
      { label: "Trilha de auditoria", information: "Definição de retenção e acesso pendente" },
      { label: "Exportações", information: "Indisponíveis nesta prévia" },
    ],
    required: "Verificar minimização de dados, auditoria, retenção e tratamento de incidentes.",
  },
];

export function TeacherClassSettingsDemo() {
  const [search, setSearch] = useState("");
  const [area, setArea] = useState<(typeof SETTINGS_AREAS)[number]>("Todas as áreas");
  const [state, setState] = useState<(typeof SETTINGS_STATES)[number]>("Todas as situações");
  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return SECTIONS.filter((section) =>
      (area === "Todas as áreas" || section.area === area) &&
      (state === "Todas as situações" || section.state === state) &&
      (!query || [section.area, section.title, section.description,
        ...section.entries.map((entry) => entry.label)].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(query)
      ))
    );
  }, [search, area, state]);

  return (
    <section className={styles.root} aria-labelledby="aa-class-settings-title">
      <h4 id="aa-class-settings-title">Configurações da Turma A — prévia somente leitura</h4>
      <p className={styles.muted}>
        Referência visual: nenhum dado real foi carregado e nenhuma configuração pode ser salva ou alterada.
      </p>
      <div className={styles.filters}>
        <label className={styles.field}>
          <span>Buscar configuração demonstrativa</span>
          <input type="search" value={search} placeholder="Nome ou campo"
            onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Área de configuração</span>
          <select value={area} onChange={(event) => setArea(event.target.value as (typeof SETTINGS_AREAS)[number])}>
            {SETTINGS_AREAS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span>Estado demonstrativo</span>
          <select value={state} onChange={(event) => setState(event.target.value as (typeof SETTINGS_STATES)[number])}>
            {SETTINGS_STATES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>

      <p role="status" aria-live="polite" className={styles.muted}>
        {visible.length} área(s) de configuração demonstrativa(s) encontrada(s)
      </p>
      {visible.length > 0 ? (
        <ul className={styles.list}>
          {visible.map((section) => (
            <li key={section.id} className={styles.card}>
              <div className={styles.heading}>
                <strong>{section.title}</strong>
                <span className={styles.state}>{section.state}</span>
              </div>
              <p className={styles.muted}>{section.area} · {section.description}</p>
              <dl className={styles.fields}>
                {section.entries.map((entry) => (
                  <div key={entry.label}>
                    <dt>{entry.label}</dt>
                    <dd>{entry.information}</dd>
                  </div>
                ))}
              </dl>
              <details>
                <summary>Requisitos antes de permitir alterações</summary>
                <p>{section.required}</p>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>Nenhuma configuração demonstrativa corresponde aos filtros.</p>
      )}
      <p className={styles.notice}>
        <strong>Sem salvamento:</strong> alterar nome de turma, matrículas, papéis,
        permissões, visibilidade, auditoria ou exportação permanece bloqueado.
        A prévia não possui campos editáveis de configuração nem serviços conectados.
      </p>
    </section>
  );
}
