/** Render the explicit empty state when no learning context is available. */
export function SanctuaryEmptyState() {
  return (
    <div className="aa-empty-state sanctuary-empty-state">
      <h3>Nenhum contexto para continuar</h3>
      <p>
        Você ainda não tem um contexto de aprendizagem para continuar. Explore o
        Workspace para começar.
      </p>
    </div>
  );
}
