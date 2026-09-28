import { AuthenticatedRouteLoading } from "@/components/layout/AuthenticatedRouteLoading";

export default function GrimoriosLoading() {
  return (
    <AuthenticatedRouteLoading
      currentPath="/grimorios"
      eyebrow="Biblioteca"
      title="Carregando seus grimórios"
    />
  );
}
