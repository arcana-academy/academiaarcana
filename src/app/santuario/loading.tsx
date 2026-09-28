import { AuthenticatedRouteLoading } from "@/components/layout/AuthenticatedRouteLoading";

export default function SanctuaryLoading() {
  return (
    <AuthenticatedRouteLoading
      currentPath="/santuario"
      eyebrow="Santuário"
      title="Carregando o Santuário"
    />
  );
}
