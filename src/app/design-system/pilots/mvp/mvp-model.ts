/** Synthetic-only MVP demonstration state. Never send to a server or use real accounts. */
export const DEMO_VERSION = 1;
export const DEMO_STORAGE_KEY = "academia-arcana:mvp-pilot:v1";
export const DEMO_PAGES = [
  { id: "page-runas", chapter: "Fundamentos", title: "Como organizar seu estudo", body: "Identifique um objetivo pequeno, reserve um momento possível e registre o que aprendeu." },
  { id: "page-revisao", chapter: "Fundamentos", title: "A arte de revisar", body: "Volte ao conteúdo com perguntas próprias. Um passo de cada vez é suficiente." },
  { id: "page-foco", chapter: "Prática", title: "Um ritual de foco", body: "Escolha uma atividade, diminua distrações e faça uma pausa quando precisar." },
] as const;

export type DemoTask = { id: string; title: string; done: boolean };
export type DemoState = {
  version: typeof DEMO_VERSION;
  tasks: DemoTask[];
  completedPageIds: string[];
  notes: Record<string, string>;
};

export const initialDemoState: DemoState = {
  version: DEMO_VERSION,
  tasks: [
    { id: "seed-revisao", title: "Revisar o primeiro capítulo", done: false },
    { id: "seed-resumo", title: "Registrar três ideias importantes", done: false },
  ],
  completedPageIds: [],
  notes: {},
};

export function addDemoTask(state: DemoState, title: string, id: string): DemoState {
  const cleanTitle = title.trim();
  if (!cleanTitle || cleanTitle.length > 120 || !/^[a-zA-Z0-9_-]{1,90}$/.test(id)) return state;
  if (state.tasks.length >= 50 || state.tasks.some((task) => task.id === id)) return state;
  return { ...state, tasks: [...state.tasks, { id, title: cleanTitle, done: false }] };
}

export function completeDemoTask(state: DemoState, id: string): DemoState {
  if (!state.tasks.some((task) => task.id === id && !task.done)) return state;
  return { ...state, tasks: state.tasks.map((task) => task.id === id ? { ...task, done: true } : task) };
}

export function toggleDemoPage(state: DemoState, id: string): DemoState {
  if (!DEMO_PAGES.some((page) => page.id === id)) return state;
  const completedPageIds = state.completedPageIds.includes(id)
    ? state.completedPageIds.filter((pageId) => pageId !== id)
    : [...state.completedPageIds, id];
  return { ...state, completedPageIds };
}

export function saveDemoNote(state: DemoState, id: string, note: string): DemoState {
  if (!DEMO_PAGES.some((page) => page.id === id) || note.length > 500) return state;
  return { ...state, notes: { ...state.notes, [id]: note } };
}

export function demoProgress(state: DemoState) {
  const doneTasks = state.tasks.filter((task) => task.done).length;
  return { doneTasks, totalTasks: state.tasks.length, pages: state.completedPageIds.length, totalPages: DEMO_PAGES.length };
}

/** Strict allow-list for restoring a disposable, local-only sample session. */
export function parseDemoState(raw: string | null): DemoState {
  if (!raw || raw.length > 20000) return initialDemoState;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return initialDemoState;
    const source = value as Partial<DemoState>;
    if (source.version !== DEMO_VERSION || !Array.isArray(source.tasks) || source.tasks.length > 50 ||
      !Array.isArray(source.completedPageIds) || !source.notes || typeof source.notes !== "object" || Array.isArray(source.notes)) {
      return initialDemoState;
    }
    const tasks = source.tasks as unknown[];
    if (!tasks.every((item) => {
      if (!item || typeof item !== "object") return false;
      const task = item as Partial<DemoTask>;
      return typeof task.id === "string" && /^[a-zA-Z0-9_-]{1,90}$/.test(task.id) &&
        typeof task.title === "string" && task.title.trim().length > 0 && task.title.length <= 120 &&
        typeof task.done === "boolean";
    })) return initialDemoState;
    if (new Set(tasks.map((item) => (item as DemoTask).id)).size !== tasks.length) return initialDemoState;
    const knownPageIds = new Set<string>(DEMO_PAGES.map((page) => page.id));
    if (!source.completedPageIds.every((id) => typeof id === "string" && knownPageIds.has(id)) ||
      new Set(source.completedPageIds).size !== source.completedPageIds.length) return initialDemoState;
    const notes = Object.entries(source.notes as Record<string, unknown>);
    if (notes.length > DEMO_PAGES.length || !notes.every(([id, note]) => knownPageIds.has(id) && typeof note === "string" && note.length <= 500)) return initialDemoState;
    return { version: DEMO_VERSION, tasks: tasks as DemoTask[], completedPageIds: [...source.completedPageIds], notes: Object.fromEntries(notes) as Record<string, string> };
  } catch {
    return initialDemoState;
  }
}