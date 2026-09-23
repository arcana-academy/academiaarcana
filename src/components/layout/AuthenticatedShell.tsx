import { signOut } from "@/lib/auth/actions";
import {
  AuthenticatedNavigation,
  type AuthenticatedRouteHref,
} from "@/components/navigation/AuthenticatedNavigation";

type AuthenticatedShellProps = {
  currentPath: AuthenticatedRouteHref;
  children: React.ReactNode;
};

export function AuthenticatedShell({ currentPath, children }: AuthenticatedShellProps) {
  return (
    <div className="aa-app-shell">
      <header className="aa-app-header">
        <div>
          <p className="aa-app-brand">Academia Arcana</p>
          <p className="aa-app-context">Jornada de aprendizagem</p>
        </div>

        <form action={signOut}>
          <button className="aa-button aa-button-secondary aa-button-sm" type="submit">
            Sair
          </button>
        </form>
      </header>

      <AuthenticatedNavigation currentPath={currentPath} />
      {children}
    </div>
  );
}
