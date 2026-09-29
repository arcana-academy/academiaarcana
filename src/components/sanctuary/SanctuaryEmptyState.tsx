import Link from "next/link";

export function SanctuaryEmptyState() {
  return (
    <div className="aa-state-card">
      <p>
        Você ainda não tem um contexto de aprendizagem para continuar.
      </p>
      <Link className="aa-link" href="/workspace">
        Explorar o Workspace para começar.
      </Link>
    </div>
  );
}
