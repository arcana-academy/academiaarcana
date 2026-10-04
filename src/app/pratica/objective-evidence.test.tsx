import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  createObjectiveAssessmentAction: vi.fn(),
  submitObjectiveAssessmentAction: vi.fn(),
}));

import { ObjectiveEvidenceSection } from "./objective-evidence";

const item = {
  id: "item-1",
  ownerId: "user-1",
  pageId: "page-1",
  pageTitle: "Anatomia",
  prompt: "Qual é a resposta?",
  referenceAnswer: "Resposta correta",
  explanation: null,
  difficulty: 3 as const,
  active: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  evidenceMode: "criterion_exact_match" as const,
  criterion:
    "A resposta deve corresponder à resposta de referência após normalização de caixa e espaços.",
  criterionVersion: "1",
  minimumEvidence: 2,
};

describe("ObjectiveEvidenceSection", () => {
  it("does not expose the reference before an objective attempt", () => {
    const html = renderToStaticMarkup(
      <ObjectiveEvidenceSection
        pageId="page-1"
        items={[item]}
        attempts={[]}
        selectedObjectiveItemId={item.id}
        evidence={[
          {
            practiceItemId: item.id,
            pageId: "page-1",
            pageTitle: "Anatomia",
            state: "unknown",
            score: null,
            attemptCount: 0,
            passingAttemptCount: 0,
            confidence: "insufficient",
            source: "criterion-referenced",
            criterion: item.criterion,
            scoringPolicy: "normalized-exact-match",
            minimumEvidence: 2,
            criterionVersion: "1",
            validityScope: "practice-item",
            reason: "Ainda não há evidência objetiva registrada para esta atividade.",
            masteryConfirmed: false,
          },
        ]}
      />,
    );

    expect(html).toContain("Avaliações com critério explícito");
    expect(html).toContain("Não avaliado");
    expect(html).not.toContain(">unknown<");
    expect(html).not.toContain("Resposta correta");
  });

  it("shows scoped confirmation after the declared evidence threshold", () => {
    const attempt = {
      id: "a1",
      ownerId: "user-1",
      practiceItemId: item.id,
      answer: "Resposta correta",
      outcome: "strong" as const,
      evidenceScore: 1,
      confidence: "strong" as const,
      feedback: "A resposta satisfez o critério.",
      createdAt: "2026-10-02T00:00:00.000Z",
      evidenceType: "criterion-referenced" as const,
      criterion: item.criterion,
      criterionVersion: "1",
      criterionResult: "pass" as const,
      criterionScope: "practice-item",
      criterionReference: item.referenceAnswer,
    };

    const html = renderToStaticMarkup(
      <ObjectiveEvidenceSection
        pageId="page-1"
        items={[item]}
        attempts={[attempt, { ...attempt, id: "a2" }]}
        selectedObjectiveItemId={item.id}
        evidence={[
          {
            practiceItemId: item.id,
            pageId: "page-1",
            pageTitle: "Anatomia",
            state: "confirmed",
            score: 1,
            attemptCount: 2,
            passingAttemptCount: 2,
            confidence: "strong",
            source: "criterion-referenced",
            criterion: item.criterion,
            scoringPolicy: "normalized-exact-match",
            minimumEvidence: 2,
            criterionVersion: "1",
            validityScope: "practice-item",
            reason:
              "O critério foi satisfeito em 2 tentativa(s), atingindo o mínimo objetivo de 2 para esta atividade.",
            masteryConfirmed: true,
          },
        ]}
      />,
    );

    expect(html).toContain("Domínio confirmado para esta atividade objetiva.");
    expect(html).toContain("Confirmado");
    expect(html).not.toContain(">confirmed<");
    expect(html).toContain("Resposta correta");
  });

  it("presents conflicting objective evidence without false certainty", () => {
    const html = renderToStaticMarkup(
      <ObjectiveEvidenceSection
        pageId="page-1"
        items={[item]}
        attempts={[]}
        selectedObjectiveItemId={item.id}
        evidence={[
          {
            practiceItemId: item.id,
            pageId: "page-1",
            pageTitle: "Anatomia",
            state: "conflicting",
            score: 0.5,
            attemptCount: 2,
            passingAttemptCount: 1,
            confidence: "strong",
            source: "criterion-referenced",
            criterion: item.criterion,
            scoringPolicy: "normalized-exact-match",
            minimumEvidence: 2,
            criterionVersion: "1",
            validityScope: "practice-item",
            reason: "Há evidências conflitantes que impedem uma confirmação automática.",
            masteryConfirmed: false,
          },
        ]}
      />,
    );

    expect(html).toContain("Conflitante");
    expect(html).not.toContain(">conflicting<");
    expect(html).not.toContain("Domínio confirmado para esta atividade objetiva.");
  });
});
