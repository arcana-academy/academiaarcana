import { LearningWorkspace } from "@/components/learning/LearningWorkspace";
import type { LearningDocument } from "@/domains/learning/workspace/types";

const DEMO_DOCUMENTS: LearningDocument[] = [
  {
    id: "anatomia",
    title: "Anatomia",
    type: "note",
    excerpt: "Conceitos, revisões e materiais centrais da disciplina.",
    updatedAt: "2026-09-01T10:00:00Z",
    properties: [
      { id: "a1", key: "area", label: "Área", type: "text", value: "Saúde" },
      { id: "a2", key: "status", label: "Status", type: "select", value: "Em estudo" },
    ],
    links: [{ targetId: "fisiologia", label: "Fisiologia", kind: "internal" }],
    tasks: [
      { id: "a-task-1", title: "Revisar osteologia", status: "todo", priority: "high" },
      { id: "a-task-2", title: "Resolver questões", status: "in_progress", priority: "normal" },
    ],
  },
  {
    id: "fisiologia",
    title: "Fisiologia",
    type: "chapter",
    excerpt: "Capítulo de estudo com referências e tarefas vinculadas.",
    updatedAt: "2026-09-01T11:00:00Z",
    properties: [
      { id: "f1", key: "area", label: "Área", type: "text", value: "Saúde" },
      { id: "f2", key: "revisao", label: "Revisão", type: "date", value: "2026-09-05" },
    ],
    links: [{ targetId: "anatomia", label: "Anatomia", kind: "backlink" }],
    tasks: [{ id: "f-task-1", title: "Ler capítulo 3", status: "scheduled", priority: "urgent" }],
  },
  {
    id: "referencias",
    title: "Referências importantes",
    type: "reference",
    excerpt: "Fontes externas e materiais para consulta futura.",
    updatedAt: "2026-08-30T18:00:00Z",
    properties: [{ id: "r1", key: "favorito", label: "Favorito", type: "checkbox", value: true }],
    links: [],
    tasks: [],
  },
];

export default function ObsidianaPage() {
  return (
    <main className="aa-page-shell">
      <header className="aa-page-heading">
        <div>
          <span className="aa-eyebrow">Laboratório de ideias</span>
          <h1>Obsidiana</h1>
          <p>Um espaço de estudo inspirado em ferramentas de conhecimento, tarefas e organização visual.</p>
        </div>
      </header>
      <LearningWorkspace documents={DEMO_DOCUMENTS} />
    </main>
  );
}
