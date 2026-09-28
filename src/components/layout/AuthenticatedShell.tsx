import type { ReactNode } from "react";

import { AppShell } from "./AppShell";
import type { AuthenticatedRouteHref } from "@/config/navigation";

type AuthenticatedShellProps = {
  currentPath: AuthenticatedRouteHref;
  children: ReactNode;
};

export function AuthenticatedShell({
  currentPath,
  children,
}: AuthenticatedShellProps) {
  return <AppShell currentPath={currentPath}>{children}</AppShell>;
}
