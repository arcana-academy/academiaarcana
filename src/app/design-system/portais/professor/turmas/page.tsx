import type { Metadata } from "next";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { TeacherClassesDemo } from "@/components/teaching/TeacherClassesDemo";

export const metadata: Metadata = {
  title: "Turmas — protótipo do Professor | Academia Arcana",
  description: "Prévia interna com dados demonstrativos, sem acesso a turmas reais.",
  robots: { index: false, follow: false },
};

export default async function TeacherClassroomPreviewPage() {
  await requireAuthenticatedUser();
  return (
    <main style={{ maxWidth: "80rem", padding: "2rem 1rem", margin: "0 auto" }}>
      <h1>Professor → Turmas · prévia</h1>
      <p>Esta página de referência não concede papel docente nem acesso a dados escolares.</p>
      <TeacherClassesDemo />
    </main>
  );
}
