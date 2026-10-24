export type DemoMission = {
  id: string;
  title: string;
  done: boolean;
};

export type DemoSnapshot = {
  missions: DemoMission[];
  focusSessions: number;
};

export const DEMO_STORAGE_KEY = "academia-arcana-experiencia-v1";

export const INITIAL_MISSIONS: DemoMission[] = [
  { id: "explorar", title: "Explorar um Grimório", done: false },
  { id: "estudar", title: "Estudar um conceito por 5 minutos", done: false },
  { id: "revisar", title: "Registrar o que aprendi", done: false },
];

export function cleanMissionTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

export function addDemoMission(
  missions: DemoMission[],
  title: string,
  id: string,
): DemoMission[] {
  const cleaned = cleanMissionTitle(title);
  if (!cleaned || !id.trim() || missions.length >= 8 || missions.some((mission) => mission.id === id)) {
    return missions;
  }
  return [...missions, { id, title: cleaned, done: false }];
}

export function toggleDemoMission(missions: DemoMission[], id: string): DemoMission[] {
  return missions.map((mission) =>
    mission.id === id ? { ...mission, done: !mission.done } : mission,
  );
}

export function getDemoProgress(missions: DemoMission[], focusSessions: number) {
  const completed = missions.filter((mission) => mission.done).length;
  const total = missions.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const xp = completed * 35 + Math.max(0, focusSessions) * 20;
  return { completed, total, percent, xp };
}

/** Accept only small, well-formed local data; never trust the browser store. */
export function readDemoSnapshot(raw: string | null): DemoSnapshot {
  const fallback = { missions: INITIAL_MISSIONS.map((m) => ({ ...m })), focusSessions: 0 };
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fallback;
    const obj = parsed as { missions?: unknown; focusSessions?: unknown };
    if (!Array.isArray(obj.missions) || obj.missions.length > 8) return fallback;

    const seen = new Set<string>();
    const missions: DemoMission[] = [];
    for (const value of obj.missions) {
      if (!value || typeof value !== "object") return fallback;
      const item = value as Partial<DemoMission>;
      if (typeof item.id !== "string" || item.id.length > 90 || !item.id ||
          typeof item.title !== "string" || item.title.length > 160 ||
          typeof item.done !== "boolean" || seen.has(item.id)) return fallback;
      const title = cleanMissionTitle(item.title);
      if (!title) return fallback;
      seen.add(item.id);
      missions.push({ id: item.id, title, done: item.done });
    }
    const sessions = typeof obj.focusSessions === "number" &&
      Number.isSafeInteger(obj.focusSessions) && obj.focusSessions >= 0 && obj.focusSessions <= 10000
      ? obj.focusSessions : 0;
    return { missions, focusSessions: sessions };
  } catch {
    return fallback;
  }
}
