/**
 * Learning progress contracts.
 *
 * Progress is intentionally separate from page content. A page can exist
 * without progress, and deleting a page deletes only its progress record.
 */

export type PageProgressStatus = "not-started" | "in-progress" | "completed";

export type PageProgress = {
  id: string;
  ownerId: string;
  pageId: string;
  status: PageProgressStatus;
  completedAt: string | null;
  updatedAt: string;
};

export interface PageProgressRepository {
  listByPages(ownerId: string, pageIds: string[]): Promise<PageProgress[]>;
  setStatus(
    ownerId: string,
    pageId: string,
    status: PageProgressStatus,
    completedAt: string | null,
  ): Promise<PageProgress>;
}
