import { VersionHistory } from "@/components/learning/VersionHistory";
import type { DocumentVersion } from "@/domains/learning/sync";

const DEMO_VERSIONS: DocumentVersion[] = [
  {
    id: "v1", documentId: "anatomia", version: 1, content: "# Anatomia\n\nOsteologia", createdAt: "2026-08-30T18:00:00Z", createdBy: "demo", changeSummary: "Versão inicial", deleted: false,
  },
  {
    id: "v2", documentId: "anatomia", version: 2, content: "# Anatomia\n\nOsteologia\n\n## Revisão\nArticulações", createdAt: "2026-09-01T09:30:00Z", createdBy: "demo", changeSummary: "Adicionada seção de revisão", deleted: false,
  },
];

export default function HistoryPage() {
  return (
    <main className="aa-page-shell">
      <header className="aa-page-heading">
        <span className="aa-eyebrow">Obsidiana</span>
        <h1>Histórico de versões</h1>
        <p>Recupere uma versão anterior sem destruir o histórico posterior.</p>
      </header>
      <VersionHistory versions={DEMO_VERSIONS} />
    </main>
  );
}
