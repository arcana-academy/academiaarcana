import { describe, expect, it } from "vitest";
import { addDemoTask, completeDemoTask, DEMO_PAGES, demoProgress, initialDemoState, parseDemoState, saveDemoNote, toggleDemoPage } from "./mvp-model";

describe("MVP pilot synthetic state", () => {
  it("creates a bounded task without mutating the original state", () => {
    const next = addDemoTask(initialDemoState, "  Ler capítulo  ", "new-task");
    expect(next.tasks).toHaveLength(3);
    expect(next.tasks[2].title).toBe("Ler capítulo");
    expect(initialDemoState.tasks).toHaveLength(2);
  });
  it("rejects empty, oversized and duplicate tasks", () => {
    expect(addDemoTask(initialDemoState, "  ", "empty")).toBe(initialDemoState);
    expect(addDemoTask(initialDemoState, "x".repeat(121), "long")).toBe(initialDemoState);
    expect(addDemoTask(initialDemoState, "Outra", "seed-revisao")).toBe(initialDemoState);
  });
  it("completes each task once without fabricating XP", () => {
    const completed = completeDemoTask(initialDemoState, "seed-revisao");
    expect(demoProgress(completed)).toMatchObject({ doneTasks: 1, totalTasks: 2 });
    expect(completeDemoTask(completed, "seed-revisao")).toBe(completed);
  });
  it("supports page completion and undo", () => {
    const completed = toggleDemoPage(initialDemoState, DEMO_PAGES[0].id);
    expect(demoProgress(completed).pages).toBe(1);
    expect(toggleDemoPage(completed, DEMO_PAGES[0].id).completedPageIds).toEqual([]);
  });
  it("allows only synthetic page ids for notes and completion", () => {
    expect(saveDemoNote(initialDemoState, "unknown", "Texto")).toBe(initialDemoState);
    expect(toggleDemoPage(initialDemoState, "unknown")).toBe(initialDemoState);
    expect(saveDemoNote(initialDemoState, DEMO_PAGES[0].id, "x".repeat(501))).toBe(initialDemoState);
  });
  it("roundtrips the saved local-only sample", () => {
    const next = saveDemoNote(completeDemoTask(initialDemoState, "seed-revisao"), DEMO_PAGES[0].id, "Anotações sintéticas");
    expect(parseDemoState(JSON.stringify(next))).toEqual(next);
  });
  it("rejects invalid payloads and prototype-sensitive keys", () => {
    expect(parseDemoState("not-json")).toBe(initialDemoState);
    expect(parseDemoState(JSON.stringify({ ...initialDemoState, notes: { __proto__: "x", secret: "x" } }))).toBe(initialDemoState);
    expect(parseDemoState(JSON.stringify({ ...initialDemoState, tasks: [{ id: "../bad", title: "Bad", done: false }] }))).toBe(initialDemoState);
  });
  it("rejects unbounded samples and malformed versions", () => {
    expect(parseDemoState(" ".repeat(20001))).toBe(initialDemoState);
    expect(parseDemoState(JSON.stringify({ ...initialDemoState, version: 2 }))).toBe(initialDemoState);
  });
});