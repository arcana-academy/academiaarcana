import type { ReactNode } from "react";
import Link from "next/link";
import { LogOut, Sparkles } from "lucide-react";

import { signOut } from "@/lib/auth/actions";
import {
  AuthenticatedNavigation,
  type AuthenticatedRouteHref,
} from "@/components/navigation/AuthenticatedNavigation";

type AuthenticatedShellProps = {
  currentPath: AuthenticatedRouteHref;
  children: ReactNode;
};

export function AuthenticatedShell({
  currentPath,
  children,
}: AuthenticatedShellProps) {
  return (
    <div className="aa-app-shell">
      <a className="aa-skip-link" href="#aa-main-content">
        Pular para o conteúdo
      </a>

      <header className="aa-app-header">
        <div className="aa-app-brand-group">
          <Link className="aa-app-brand" href="/santuario">
            <Sparkles aria-hidden="true" size={20} strokeWidth={1.8} />
            <span>Academia Arcana</span>
          </Link>
          <p className="aa-app-context">Jornada de aprendizagem</p>
        </div>

        <form action={signOut}>
          <button
            className="aa-button aa-button-ghost aa-button-sm aa-sign-out"
            type="submit"
          >
            <LogOut aria-hidden="true" size={16} strokeWidth={1.8} />
            <span>Sair</span>
          </button>
        </form>
      </header>

      <div className="aa-app-body">
        <AuthenticatedNavigation currentPath={currentPath} />
        <div className="aa-app-content" id="aa-main-content">
          {children}
        </div>
      </div>
    </div>
  );
}
