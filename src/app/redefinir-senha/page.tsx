import { AuthForm } from "@/components/auth/AuthForm";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export default async function RedefinirSenhaPage() {
  await requireAuthenticatedUser();
  return <AuthForm mode="update-password" />;
}
