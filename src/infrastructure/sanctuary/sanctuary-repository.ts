import type {
  SanctuaryGrimoire,
  SanctuaryNotebook,
  SanctuaryChapter,
  SanctuaryPage
} from "@/domains/sanctuary";

export interface SanctuaryRepository {
  getLearningHierarchy(): Promise<SanctuaryGrimoire[]>;
}

export type { SanctuaryGrimoire, SanctuaryNotebook, SanctuaryChapter, SanctuaryPage };