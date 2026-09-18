import { describe, it, expect } from "vitest";
import { resolveContinueLearning } from "../continue-learning-policy";
import type { SanctuaryGrimoire } from "../contracts";

describe("resolveContinueLearning Policy", () => {
  it("deve retornar null se a hierarquia estiver vazia", () => {
    expect(resolveContinueLearning([])).toBeNull();
  });

  it("deve retornar apenas contexto de grimório se não houver cadernos", () => {
    const mock: SanctuaryGrimoire[] = [{
      id: "g-1",
      ownerId: "u-1",
      title: "Grimório Alfa",
      notebooks: []
    }];

    const result = resolveContinueLearning(mock);
    expect(result?.grimoireId).toBe("g-1");
    expect(result?.notebookId).toBeUndefined();
    expect(result).not.toHaveProperty("href");
  });

  it("deve retornar contexto de caderno se houver caderno mas nenhum capítulo", () => {
    const mock: SanctuaryGrimoire[] = [{
      id: "g-1",
      ownerId: "u-1",
      title: "Grimório Alfa",
      notebooks: [{
        id: "n-1",
        grimoireId: "g-1",
        title: "Caderno 1",
        position: 1,
        chapters: []
      }]
    }];

    const result = resolveContinueLearning(mock);
    expect(result?.grimoireId).toBe("g-1");
    expect(result?.notebookId).toBe("n-1");
    expect(result?.chapterId).toBeUndefined();
  });

  it("deve retornar contexto de capítulo se houver capítulo mas nenhuma página", () => {
    const mock: SanctuaryGrimoire[] = [{
      id: "g-1",
      ownerId: "u-1",
      title: "Grimório Alfa",
      notebooks: [{
        id: "n-1",
        grimoireId: "g-1",
        title: "Caderno 1",
        position: 1,
        chapters: [{
          id: "c-1",
          notebookId: "n-1",
          title: "Capítulo 1",
          position: 1,
          pages: []
        }]
      }]
    }];

    const result = resolveContinueLearning(mock);
    expect(result?.chapterId).toBe("c-1");
    expect(result?.pageId).toBeUndefined();
  });

  it("deve retornar contexto completo (página) se a hierarquia estiver completa", () => {
    const mock: SanctuaryGrimoire[] = [{
      id: "g-1",
      ownerId: "u-1",
      title: "Grimório Alfa",
      notebooks: [{
        id: "n-1",
        grimoireId: "g-1",
        title: "Caderno 1",
        position: 1,
        chapters: [{
          id: "c-1",
          notebookId: "n-1",
          title: "Capítulo 1",
          position: 1,
          pages: [{
            id: "p-1",
            chapterId: "c-1",
            title: "Página 1",
            position: 1
          }]
        }]
      }]
    }];

    const result = resolveContinueLearning(mock);
    expect(result?.grimoireId).toBe("g-1");
    expect(result?.pageId).toBe("p-1");
    expect(result?.pageTitle).toBe("Página 1");
    expect(result).not.toHaveProperty("href");
  });

  it("deve ser determinístico baseado no ID independente da ordem de entrada dos grimórios", () => {
    const mock: SanctuaryGrimoire[] = [
      {
        id: "g-1",
        ownerId: "u-1",
        title: "Primeiro Grimório",
        notebooks: []
      },
      {
        id: "g-2",
        ownerId: "u-1",
        title: "Segundo Grimório",
        notebooks: []
      }
    ];

    const result = resolveContinueLearning(mock);
    const resultInverse = resolveContinueLearning([...mock].reverse());

    expect(result?.grimoireId).toBe("g-1");
    expect(resultInverse?.grimoireId).toBe("g-1");
  });

  it("deve ser determinístico baseado no position para notebooks", () => {
    const mock: SanctuaryGrimoire[] = [{
      id: "g-1",
      ownerId: "u-1",
      title: "G1",
      notebooks: [
        { id: "n-2", grimoireId: "g-1", title: "N2", position: 2, chapters: [] },
        { id: "n-1", grimoireId: "g-1", title: "N1", position: 1, chapters: [] }
      ]
    }];

    const result = resolveContinueLearning(mock);
    const resultInverse = resolveContinueLearning([{
      ...mock[0],
      notebooks: [...mock[0].notebooks].reverse()
    }]);

    expect(result?.notebookId).toBe("n-1");
    expect(resultInverse?.notebookId).toBe("n-1");
  });

  it("deve ser determinístico baseado no position para chapters", () => {
    const mock: SanctuaryGrimoire[] = [{
      id: "g-1",
      ownerId: "u-1",
      title: "G1",
      notebooks: [{
        id: "n-1", grimoireId: "g-1", title: "N1", position: 1,
        chapters: [
          { id: "c-2", notebookId: "n-1", title: "C2", position: 2, pages: [] },
          { id: "c-1", notebookId: "n-1", title: "C1", position: 1, pages: [] }
        ]
      }]
    }];

    const result = resolveContinueLearning(mock);
    const resultInverse = resolveContinueLearning([{
      ...mock[0],
      notebooks: [{ ...mock[0].notebooks[0], chapters: [...mock[0].notebooks[0].chapters].reverse() }]
    }]);

    expect(result?.chapterId).toBe("c-1");
    expect(resultInverse?.chapterId).toBe("c-1");
  });

  it("deve ser determinístico baseado no position para pages", () => {
    const mock: SanctuaryGrimoire[] = [{
      id: "g-1",
      ownerId: "u-1",
      title: "G1",
      notebooks: [{
        id: "n-1", grimoireId: "g-1", title: "N1", position: 1,
        chapters: [{
          id: "c-1", notebookId: "n-1", title: "C1", position: 1,
          pages: [
            { id: "p-2", chapterId: "c-1", title: "P2", position: 2 },
            { id: "p-1", chapterId: "c-1", title: "P1", position: 1 }
          ]
        }]
      }]
    }];

    const result = resolveContinueLearning(mock);
    const resultInverse = resolveContinueLearning([{
      ...mock[0],
      notebooks: [{ ...mock[0].notebooks[0], chapters: [{ ...mock[0].notebooks[0].chapters[0], pages: [...mock[0].notebooks[0].chapters[0].pages].reverse() }] }]
    }]);

    expect(result?.pageId).toBe("p-1");
    expect(resultInverse?.pageId).toBe("p-1");
  });

  it("deve ser determinístico baseado no ID quando houver empate de position para notebooks", () => {
    const mock: SanctuaryGrimoire[] = [{
      id: "g-1",
      ownerId: "u-1",
      title: "G1",
      notebooks: [
        { id: "n-b", grimoireId: "g-1", title: "NB", position: 1, chapters: [] },
        { id: "n-a", grimoireId: "g-1", title: "NA", position: 1, chapters: [] }
      ]
    }];

    const result = resolveContinueLearning(mock);
    const resultInverse = resolveContinueLearning([{
      ...mock[0],
      notebooks: [...mock[0].notebooks].reverse()
    }]);

    expect(result?.notebookId).toBe("n-a");
    expect(resultInverse?.notebookId).toBe("n-a");
  });

  it("deve ser determinístico baseado no ID quando houver empate de position para chapters", () => {
    const mock: SanctuaryGrimoire[] = [{
      id: "g-1",
      ownerId: "u-1",
      title: "G1",
      notebooks: [{
        id: "n-1", grimoireId: "g-1", title: "N1", position: 1,
        chapters: [
          { id: "c-b", notebookId: "n-1", title: "CB", position: 1, pages: [] },
          { id: "c-a", notebookId: "n-1", title: "CA", position: 1, pages: [] }
        ]
      }]
    }];

    const result = resolveContinueLearning(mock);
    const resultInverse = resolveContinueLearning([{
      ...mock[0],
      notebooks: [{ ...mock[0].notebooks[0], chapters: [...mock[0].notebooks[0].chapters].reverse() }]
    }]);

    expect(result?.chapterId).toBe("c-a");
    expect(resultInverse?.chapterId).toBe("c-a");
  });

  it("deve ser determinístico baseado no ID quando houver empate de position para pages", () => {
    const mock: SanctuaryGrimoire[] = [{
      id: "g-1",
      ownerId: "u-1",
      title: "G1",
      notebooks: [{
        id: "n-1", grimoireId: "g-1", title: "N1", position: 1,
        chapters: [{
          id: "c-1", notebookId: "n-1", title: "C1", position: 1,
          pages: [
            { id: "p-b", chapterId: "c-1", title: "PB", position: 1 },
            { id: "p-a", chapterId: "c-1", title: "PA", position: 1 }
          ]
        }]
      }]
    }];

    const result = resolveContinueLearning(mock);
    const resultInverse = resolveContinueLearning([{
      ...mock[0],
      notebooks: [{ ...mock[0].notebooks[0], chapters: [{ ...mock[0].notebooks[0].chapters[0], pages: [...mock[0].notebooks[0].chapters[0].pages].reverse() }] }]
    }]);

    expect(result?.pageId).toBe("p-a");
    expect(resultInverse?.pageId).toBe("p-a");
  });
});
