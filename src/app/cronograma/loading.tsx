import { AuthenticatedRouteLoading } from "@/components/layout/AuthenticatedRouteLoading";

export default function CronogramaLoading() {
  return (
    <AuthenticatedRouteLoading
      currentPath="/cronograma"
      eyebrow="Planejamento"
      title="Carregando o cronograma"
    />
  );
}
