import { ArrowUpRight, Inbox, Users } from "lucide-react";

import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";
import { SupabaseSocialRepository } from "@/infrastructure/supabase/social/social-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function ConnectionActionUnavailable() {
  return (
    <p className="aa-state-copy" role="status">
      Ações indisponíveis até que esta conexão possa ser identificada com segurança.
    </p>
  );
}

export default async function AmigosPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const connections = await new SupabaseSocialRepository(
    supabase,
  ).listConnections(claims.sub);

  const accepted = connections.filter(
    (connection) => connection.status === "accepted",
  );
  const incomingPending = connections.filter(
    (connection) =>
      connection.status === "pending" &&
      connection.recipientId === claims.sub,
  );
  const outgoingPending = connections.filter(
    (connection) =>
      connection.status === "pending" &&
      connection.requesterId === claims.sub,
  );

  return (
    <AuthenticatedShell currentPath="/amigos">
      <ArcanaPage
        eyebrow="Social"
        title="Amigos"
        description="Conecte-se com outras pessoas de forma consciente, contextual e permissionada."
      >
        <ArcanaFeatureGrid>
          <FeatureCard
            title="Sua rede"
            description="Conexões aceitas e visíveis somente aos participantes."
            icon={<Users size={20} />}
          >
            <p className="aa-state-copy">
              {accepted.length === 0
                ? "Nenhuma amizade aceita ainda."
                : countLabel(
                    accepted.length,
                    "amizade aceita",
                    "amizades aceitas",
                  )}
            </p>
            {accepted.length > 0 && <ConnectionActionUnavailable />}
          </FeatureCard>

          <FeatureCard
            title="Solicitações recebidas"
            description="Pedidos pendentes que aguardam uma decisão sua."
            icon={<Inbox size={20} />}
          >
            <p className="aa-state-copy">
              {incomingPending.length === 0
                ? "Nenhuma solicitação recebida pendente."
                : countLabel(
                    incomingPending.length,
                    "solicitação pendente",
                    "solicitações pendentes",
                  )}
            </p>
            {incomingPending.length > 0 && <ConnectionActionUnavailable />}
          </FeatureCard>

          <FeatureCard
            title="Solicitações enviadas"
            description="Pedidos enviados por você que ainda aguardam resposta."
            icon={<ArrowUpRight size={20} />}
          >
            <p className="aa-state-copy">
              {outgoingPending.length === 0
                ? "Nenhuma solicitação enviada pendente."
                : countLabel(
                    outgoingPending.length,
                    "solicitação aguardando resposta",
                    "solicitações aguardando resposta",
                  )}
            </p>
            {outgoingPending.length > 0 && <ConnectionActionUnavailable />}
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
