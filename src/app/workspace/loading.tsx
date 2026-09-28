import { AuthenticatedRouteLoading } from "@/components/layout/AuthenticatedRouteLoading";

export default function WorkspaceLoading() {
  return (
    <AuthenticatedRouteLoading
      currentPath="/workspace"
      eyebrow="Workspace"
      title="Carregando seu Workspace"
    />
  );
}
