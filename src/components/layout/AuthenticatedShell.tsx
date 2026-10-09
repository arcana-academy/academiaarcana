import Image from "next/image";
import { LogoutForm } from "@/components/layout/LogoutForm";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { navigationItems, type AuthenticatedRouteHref } from "@/config/navigation";

type AuthenticatedShellProps = {
  currentPath: AuthenticatedRouteHref;
  children: React.ReactNode;
};

export function AuthenticatedShell({ currentPath, children }: AuthenticatedShellProps) {
  const currentNavigationItem = navigationItems.find((item) => item.href === currentPath);

  return (
    <div className="aa-shell">
      <Sidebar currentPath={currentPath} />

      <div className="aa-shell-main">
        <header className="aa-topbar">
          <div className="aa-topbar-mobile">
            <MobileNavigation currentPath={currentPath} />
            <div className="aa-topbar-mobile-brand">
              <span className="aa-brand-mark" aria-hidden="true"><Image src="/assets/brand/aa-institutional-seal.svg" alt="" width={40} height={40} priority /></span>
              <span>Arcana</span>
            </div>
          </div>

          <div className="aa-topbar-context">
            <span className="aa-topbar-eyebrow">Academia Arcana</span>
            <span className="aa-topbar-divider" aria-hidden="true">/</span>
            <span>{currentNavigationItem?.label ?? "Jornada de aprendizagem"}</span>
          </div>

          <LogoutForm />
        </header>

        <div className="aa-main-content">{children}</div>
      </div>
    </div>
  );
}
