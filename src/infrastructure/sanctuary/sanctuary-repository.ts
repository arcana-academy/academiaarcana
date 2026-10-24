// Sanctuary's consumer-owned port lives in the application layer.
// Infrastructure must implement that port rather than define a competing contract.
export type {
  SanctuaryGrimoire,
  SanctuaryNotebook,
  SanctuaryChapter,
  SanctuaryPage,
} from "@/domains/sanctuary";
