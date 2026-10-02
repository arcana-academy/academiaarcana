import type {
  ObjectiveAssessment,
  ObjectiveAttempt,
} from "@/domains/education";
import type { ObjectiveEvidenceProjection } from "@/domains/learning";
import { createObjectiveAssessmentAction, submitObjectiveAssessmentAction } from "./actions";

function percent(value: number | null): string {
  return value === null ? "Sem dados" : Math.round(value * 100) + "%";
}

function attemptsFor(
  attempts: ObjectiveAttempt[],
  assessmentId: string,
): ObjectiveAttempt[] {
  return attempts
    .filter((attempt) => attempt.assessmentId === assessmentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function ObjectiveAssessmentCreationForm({ pageId }: { pageId: string }) {
  return (
    <form action={createObjectiveAssessmentAction} className="aa-form">
      <h3>Adicionar avaliação objetiva</h3>
      <p className="aa-state-copy">
        V1 usa correspondência exata normalizada: maiúsculas e espaços repetidos não alteram o resultado.
      </p>
      <input type="hidden" name="pageId" value={pageId} />
      <label htmlFor="objective-prompt">Pergunta ou desafio</label>
      <textarea
        id="objective-prompt"
        name="prompt"
        rows={3}
        required
        minLength={1}
        maxLength={1000}
        placeholder="Ex.: Qual é o nome da estrutura estudada?"
      />
      <label htmlFor="objective-reference">Resposta que satisfaz o critério</label>
      <textarea
        id="objective-reference"
        name="referenceAnswer"
        rows={3}
        required
        minLength={1}
        maxLength={5000}
        placeholder="Use este campo como resposta exata esperada."
      />
      <label htmlFor="objective-criterion">Critério explícito</label>
      <textarea
        id="objective-criterion"
        name="criterion"
        rows={3}
        required
        minLength={1}
        maxLength={2000}
        defaultValue="A resposta deve corresponder à resposta de referência após normalização de caixa e espaços."
      />
      <label htmlFor="objective-minimum">Evidência mínima para confirmação</label>
      <select id="objective-minimum" name="minimumEvidence" defaultValue="2">
        {[1, 2, 3, 4, 5].map((value) => (
          <option key={value} value={value}>
            {value} tentativa(s) aprovada(s)
          </option>
        ))}
      </select>
      <button className="aa-button aa-button-primary" type="submit">
        Criar avaliação objetiva
      </button>
    </form>
  );
}

function ObjectiveAssessmentSession({
  assessment,
  attempts,
  evidence,
}: {
  assessment: ObjectiveAssessment;
  attempts: ObjectiveAttempt[];
  evidence: ObjectiveEvidenceProjection | null;
}) {
  const latest = attempts[0] ?? null;

  return (
    <section className="aa-card aa-card-elevated" aria-labelledby="objective-session-title">
      <p className="aa-eyebrow">Evidência criterion-referenced · V1</p>
      <h2 id="objective-session-title">{assessment.prompt}</h2>
      <p className="aa-state-copy">
        Critério: {assessment.criterion}
      </p>
      <p className="aa-state-copy">
        Confirmação limitada ao conteúdo desta página e ao critério desta avaliação.
      </p>

      <form action={submitObjectiveAssessmentAction} className="aa-form">
        <input type="hidden" name="assessmentId" value={assessment.id} />
        <label htmlFor="objective-answer">Sua resposta</label>
        <textarea
          id="objective-answer"
          name="answer"
          rows={6}
          required
          minLength={1}
          maxLength={5000}
          placeholder="Responda de acordo com o que você consegue recuperar."
        />
        <button className="aa-button aa-button-primary" type="submit">
          Verificar resposta pelo critério
        </button>
      </form>

      {latest ? (
        <div className="aa-card aa-card-default" aria-live="polite">
          <h3>Resultado objetivo da tentativa</h3>
          <p>{latest.feedback}</p>
          <p>
            Resultado: <strong>{latest.outcome === "pass" ? "aprovada" : "não aprovada"}</strong>
            {" · "}
            evidência <strong>{percent(latest.evidenceScore)}</strong>
            {" · "}
            confiança <strong>{latest.confidence}</strong>.
          </p>
          <details>
            <summary>Ver sua resposta e a referência</summary>
            <div className="aa-stack">
              <div>
                <h4>Sua resposta</h4>
                <p>{latest.answer}</p>
              </div>
              <div>
                <h4>Referência da avaliação</h4>
                <p>{assessment.referenceAnswer}</p>
              </div>
            </div>
          </details>
        </div>
      ) : null}

      {evidence ? (
        <div className="aa-card aa-card-default" aria-labelledby="objective-evidence-title">
          <h3 id="objective-evidence-title">Estado da evidência objetiva</h3>
          <p>
            Estado: <strong>{evidence.state}</strong>
            {" · "}
            {evidence.passingAttemptCount}/{evidence.minimumEvidence} aprovações mínimas
            {" · "}
            {evidence.attemptCount} tentativa(s).
          </p>
          <p className="aa-state-copy">{evidence.reason}</p>
          <p className="aa-state-copy">
            Fonte: critério explícito · escopo: {evidence.validityScope} · versão do critério: {evidence.criterionVersion}.
          </p>
          {evidence.masteryConfirmed ? (
            <p>
              <strong>Domínio confirmado para o escopo desta avaliação.</strong>
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function ObjectiveEvidenceSection({
  pageId,
  assessments,
  attempts,
  selectedAssessmentId,
  evidence,
}: {
  pageId: string;
  assessments: ObjectiveAssessment[];
  attempts: ObjectiveAttempt[];
  selectedAssessmentId?: string;
  evidence: ObjectiveEvidenceProjection[];
}) {
  const pageAssessments = assessments.filter(
    (assessment) => assessment.pageId === pageId,
  );
  const selected =
    pageAssessments.find(
      (assessment) => assessment.id === selectedAssessmentId,
    ) ?? pageAssessments[0] ?? null;

  return (
    <section className="aa-card aa-card-default" aria-labelledby="objective-title">
      <p className="aa-eyebrow">Evidência objetiva</p>
      <h2 id="objective-title">Avaliações com critério explícito</h2>
      <p className="aa-state-copy">
        Esta V1 oferece uma única política determinística: correspondência exata normalizada.
        Ela não avalia significado, qualidade de explicação ou competência ampla.
      </p>

      {pageAssessments.length ? (
        <div role="list" className="aa-list" aria-label="Avaliações objetivas deste conteúdo">
          {pageAssessments.map((assessment) => {
            const entry = evidence.find(
              (candidate) => candidate.assessmentId === assessment.id,
            );
            return (
              <a
                key={assessment.id}
                className="aa-list-item aa-surface"
                href={"/pratica?pagina=" + encodeURIComponent(pageId) + "&avaliacao=" + encodeURIComponent(assessment.id)}
                aria-current={selected?.id === assessment.id ? "page" : undefined}
              >
                <span>
                  <strong>{assessment.prompt}</strong>
                  <span className="aa-state-copy">
                    {entry?.state ?? "unknown"} · mínimo {assessment.minimumEvidence} aprovações
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      ) : (
        <p className="aa-state-copy">Este conteúdo ainda não tem uma avaliação objetiva.</p>
      )}

      <ObjectiveAssessmentCreationForm pageId={pageId} />

      {selected ? (
        <ObjectiveAssessmentSession
          assessment={selected}
          attempts={attemptsFor(attempts, selected.id)}
          evidence={
            evidence.find((entry) => entry.assessmentId === selected.id) ?? null
          }
        />
      ) : null}
    </section>
  );
}
