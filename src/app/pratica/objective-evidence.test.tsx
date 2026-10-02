import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  createObjectiveAssessmentAction: vi.fn(),
  submitObjectiveAssessmentAction: vi.fn(),
}));

import { ObjectiveEvidenceSection } from "./objective-evidence";

const assessment = {
  id: "assessment-1",
  ownerId: "user-1",
  pageId: "page-1",
  pageTitle: "Anatomia",
  prompt: "Qual é a resposta?",
  referenceAnswer: "Resposta correta",
  criterion: "A resposta deve corresponder à referência após normalização de caixa e espaços.",
  scoringPolicy: "normalized-exact-match" as const,
  minimumEvidence: 2,
  validityScope: "page" as const,
  criterionVersion: 1,
  active: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

describe("ObjectiveEvidenceSection", () => {
  it("does not expose the reference before an objective attempt", () => {
    const html = renderToStaticMarkup(
      <ObjectiveEvidenceSection
        pageId="page-1"
        assessments={[assessment]}
        attempts={[]}
        selectedAssessmentId={assessment.id}
        evidence={[
          {
            assessmentId: assessment.id,
            pageId: "page-1",
            pageTitle: "Anatomia",
            state: "unknown",
            score: null,
            attemptCount: 0,
            passingAttemptCount: 0,
            confidence: "insufficient",
            source: "criterion-referenced",
            criterion: assessment.criterion,
            scoringPolicy: "normalized-exact-match",
            minimumEvidence: 2,
            criterionVersion: 1,
            validityScope: "page",
            reason: "Ainda não há evidência objetiva registrada para esta tarefa.",
            masteryConfirmed: false,
          },
        ]}
      />,
    );
    expect(html).toContain("Avaliações com critério explícito");
    expect(html).not.toContain("Resposta correta");
  });

  it("shows scoped confirmation after the declared evidence threshold", () => {
    const html = renderToStaticMarkup(
      <ObjectiveEvidenceSection
        pageId="page-1"
        assessments={[assessment]}
        attempts={[
          {
            id: "a1",
            ownerId: "user-1",
            assessmentId: assessment.id,
            answer: "Resposta correta",
            outcome: "pass",
            evidenceScore: 1,
            confidence: "strong",
            feedback: "A resposta satisfez o critério.",
            criterionVersion: 1,
            createdAt: "2026-10-02T00:00:00.000Z",
          },
          {
            id: "a2",
            ownerId: "user-1",
            assessmentId: assessment.id,
            answer: "Resposta correta",
            outcome: "pass",
            evidenceScore: 1,
            confidence: "strong",
            feedback: "A resposta satisfez o critério.",
            criterionVersion: 1,
            createdAt: "2026-10-02T00:05:00.000Z",
          },
        ]}
        selectedAssessmentId={assessment.id}
        evidence={[
          {
            assessmentId: assessment.id,
            pageId: "page-1",
            pageTitle: "Anatomia",
            state: "confirmed",
            score: 1,
            attemptCount: 2,
            passingAttemptCount: 2,
            confidence: "strong",
            source: "criterion-referenced",
            criterion: assessment.criterion,
            scoringPolicy: "normalized-exact-match",
            minimumEvidence: 2,
            criterionVersion: 1,
            validityScope: "page",
            reason: "O critério foi satisfeito em 2 tentativa(s), atingindo o mínimo objetivo de 2.",
            masteryConfirmed: true,
          },
        ]}
      />,
    );
    expect(html).toContain("Domínio confirmado para o escopo desta avaliação.");
    expect(html).toContain("Resposta correta");
  });
});
