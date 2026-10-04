import { describe, expect, it } from "vitest";

import {
  evidenceConfidenceLabel,
  objectiveEvidenceScopeLabel,
  objectiveEvidenceStateLabel,
  practiceOutcomeLabel,
  selfAssessmentEvidenceStateLabel,
} from "./evidence-state-copy";

describe("education evidence state copy", () => {
  it("maps objective internal states to canonical learner-facing labels", () => {
    expect(objectiveEvidenceStateLabel("unknown")).toBe("Não avaliado");
    expect(objectiveEvidenceStateLabel("insufficient")).toBe("Não confirmado");
    expect(objectiveEvidenceStateLabel("developing")).toBe("Não confirmado");
    expect(objectiveEvidenceStateLabel("confirmed")).toBe("Confirmado");
    expect(objectiveEvidenceStateLabel("conflicting")).toBe("Conflitante");
  });

  it("keeps self-assessment labels distinct from mastery confirmation", () => {
    expect(selfAssessmentEvidenceStateLabel("unknown")).toBe("Não avaliado");
    expect(selfAssessmentEvidenceStateLabel("developing")).toBe(
      "Autoavaliação em desenvolvimento",
    );
    expect(selfAssessmentEvidenceStateLabel("consolidating")).toBe(
      "Autoavaliação em consolidação",
    );
    expect(selfAssessmentEvidenceStateLabel("strong-evidence")).toBe(
      "Autoavaliação forte",
    );
  });

  it("localizes objective evidence scope", () => {
    expect(objectiveEvidenceScopeLabel("practice-item")).toBe(
      "atividade objetiva",
    );
  });

  it("localizes retrieval outcomes and confidence levels", () => {
    expect(practiceOutcomeLabel("strong")).toBe("Forte");
    expect(practiceOutcomeLabel("partial")).toBe("Parcial");
    expect(practiceOutcomeLabel("insufficient")).toBe("Insuficiente");

    expect(evidenceConfidenceLabel("strong")).toBe("Alta");
    expect(evidenceConfidenceLabel("partial")).toBe("Parcial");
    expect(evidenceConfidenceLabel("insufficient")).toBe("Insuficiente");
  });
});
