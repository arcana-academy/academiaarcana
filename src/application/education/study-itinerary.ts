import type { PracticeItem } from "@/domains/education";

export type StudyItineraryPage = {
  id: string;
  title: string;
  practiceCount: number;
  workspaceHref: string;
  practiceHref: string;
};

type SavedPage = { id: string; title: string };
type OwnedPractice = Pick<PracticeItem, "ownerId" | "pageId" | "active">;

export const STUDY_ITINERARY_PAGE_LIMIT = 30;

/**
 * Turn RLS-visible saved pages and owner-filtered practice into a read-only
 * study itinerary catalog. No answers, attempts or progress are exposed.
 */
export function buildStudyItineraryPages(
  ownerId: string,
  pages: readonly SavedPage[],
  items: readonly OwnedPractice[],
): StudyItineraryPage[] {
  const visible = new Map<string, string>();
  for (const page of pages) {
    if (
      typeof page.id !== "string" ||
      !page.id.trim() ||
      typeof page.title !== "string" ||
      !page.title.trim() ||
      visible.has(page.id)
    ) {
      continue;
    }
    visible.set(page.id, page.title.trim());
    if (visible.size === STUDY_ITINERARY_PAGE_LIMIT) break;
  }

  const counts = new Map<string, number>();
  for (const item of items) {
    if (
      item.ownerId !== ownerId ||
      item.active !== true ||
      !visible.has(item.pageId)
    ) {
      continue;
    }
    counts.set(item.pageId, (counts.get(item.pageId) ?? 0) + 1);
  }

  return [...visible.entries()].map(([id, title]) => {
    const encoded = encodeURIComponent(id);
    return {
      id,
      title,
      practiceCount: counts.get(id) ?? 0,
      workspaceHref: `/workspace?page=${encoded}`,
      practiceHref: `/pratica?pagina=${encoded}`,
    };
  });
}
