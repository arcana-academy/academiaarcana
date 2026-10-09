import styles from "./TeacherClassOverviewDemo.module.css";

/** Pure presentation. These areas do not represent live classroom data. */
export const CLASS_OVERVIEW_AREAS = [
  {
    label: "Identificação",
    heading: "Turma demonstrativa",
    description: "Fundamentos da Magia — Turma A é um exemplo de navegação, não um registro institucional.",
    requirement: "Confirmar contexto institucional e vínculo docente antes de consultar uma turma real.",
  },
  {
    label: "Planejamento",
    heading: "Organização pedagógica",
    description: "Aulas, conteúdos e atividades são exemplos locais; não há calendário, entregas ou progresso carregados.",
    requirement: "Homologar fontes, escopo temporal, autorização por recurso e estados de recuperação.",
  },
  {
    label: "Acesso",
    heading: "Proteção da turma",
    description: "A autenticação nesta prévia não concede permissão de professor nem acesso a estudantes.",
    requirement: "Exigir autorização no servidor, RLS por turma, revogação e testes entre contas.",
  },
] as const;

export const STUDENT_ACCESS_REQUIREMENTS = [
  {
    title: "Relação de estudantes",
    reason: "Matrículas e identificadores pessoais não são consultados.",
    required: "Vínculo docente–turma válido, autorização de leitura por recurso, RLS e minimização.",
  },
  {
    title: "Acompanhamento individual",
    reason: "Presença, notas, participação e evolução pessoal não são exibidas.",
    required: "Finalidade legítima, escopo de acesso explícito, auditoria e testes intercontas.",
  },
  {
    title: "Gestão de vínculos",
    reason: "Convites, inclusões, exclusões e mudanças de papel estão indisponíveis.",
    required: "Contrato de escrita no servidor, revogação, trilha de auditoria e validação institucional.",
  },
] as const;

export function TeacherClassOverviewDemo() {
  return (
    <section className={styles.root} aria-labelledby="aa-teacher-overview-heading">
      <h4 id="aa-teacher-overview-heading">Visão Geral — mapa demonstrativo da turma</h4>
      <p className={styles.muted}>Esta prévia não contém indicadores acadêmicos reais, horários, alunos ou permissões verificadas.</p>
      <ul className={styles.grid}>
        {CLASS_OVERVIEW_AREAS.map((area) => (
          <li key={area.label} className={styles.card}>
            <div className={styles.cardHeading}><strong>{area.heading}</strong><span className={styles.state}>Ilustrativo</span></div>
            <p>{area.description}</p>
            <details>
              <summary>Ver requisito para integração</summary>
              <p>{area.requirement}</p>
            </details>
          </li>
        ))}
      </ul>
      <p className={styles.notice}>Nenhum dado foi consultado. Use as demais abas apenas para avaliar organização, estados e acessibilidade.</p>
    </section>
  );
}

export function TeacherStudentsDemo() {
  return (
    <section className={styles.root} aria-labelledby="aa-teacher-students-heading">
      <h4 id="aa-teacher-students-heading">Alunos — estrutura protegida, sem registros pessoais</h4>
      <p className={styles.muted}>A aba mostra requisitos de proteção, não uma lista de estudantes nem informações de matrícula.</p>
      <p role="status" className={styles.notice}>Dados de estudantes não carregados. Quantidade e participação não verificadas.</p>
      <ul className={styles.grid}>
        {STUDENT_ACCESS_REQUIREMENTS.map((gate) => (
          <li key={gate.title} className={styles.card}>
            <div className={styles.cardHeading}><strong>{gate.title}</strong><span className={styles.state}>Indisponível</span></div>
            <p>{gate.reason}</p>
            <details>
              <summary>Ver condições de acesso</summary>
              <p>{gate.required}</p>
            </details>
          </li>
        ))}
      </ul>
      <p className={styles.notice}>Consultar, convidar, editar ou remover estudantes está bloqueado nesta prévia. Nenhuma permissão é inferida do nome da aba.</p>
    </section>
  );
}
