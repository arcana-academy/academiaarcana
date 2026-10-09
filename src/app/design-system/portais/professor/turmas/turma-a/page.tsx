import type { Metadata } from "next";
import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { TeacherClassTabsDemo } from "@/components/teaching/TeacherClassTabsDemo";

export const metadata: Metadata = {
  title: "Turma A — abas demonstrativas | Academia Arcana",
  description: "Prévia protegida das nove abas internas de uma turma fictícia.",
  robots: { index: false, follow: false },
};
export default async function ClassDetailPreviewPage() {
  await requireAuthenticatedUser();
  return (
    <main style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1rem" }}>
      <p><Link href="/design-system/portais/professor/turmas">← Voltar às Turmas</Link></p>
      <h1>Portal do Professor · Detalhes da Turma</h1>
      <p>Protótipo: não é uma sala de aula operacional e não contém dados reais.</p>
      <TeacherClassTabsDemo />
    </main>
  );
}
