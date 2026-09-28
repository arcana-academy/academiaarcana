import { signOut } from "@/lib/auth/actions";
import { AppShell } from "@/components/layout/AppShell";
import type { AuthenticatedRouteHref } from "@/components/navigation/navigation-items";

type AuthenticatedShellProps = {
  currentPath: AuthenticatedRouteHref;
  children: React.ReactNode;
};

function SignOutButton() {
  return (
    <form action={signOut}>
      <button className="aa-button aa-button-secondary aa-button-sm" type="submit">
        Sair
      </button>
    </form>
  );
}

export function AuthenticatedShell({
  currentPath,
  children,
}: AuthenticatedShellProps) {
  return (
    <AppShell currentPath={currentPath} headerActions={<SignOutButton />}>
      {children}
    </AppShell>
  );
}
