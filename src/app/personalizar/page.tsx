import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { PersonalizationPanel } from "@/components/personalization/PersonalizationPanel";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export default async function PersonalizarPage() {
  await requireAuthenticatedUser();

  return (
    <AuthenticatedShell currentPath="/personalizar">
      <PersonalizationPanel />
    </AuthenticatedShell>
  );
}
