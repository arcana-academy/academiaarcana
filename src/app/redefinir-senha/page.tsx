import { AuthForm } from "@/components/auth/AuthForm";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/redefinir-senha");

export default async function RedefinirSenhaPage() {
  await requireAuthenticatedUser();
  return <AuthForm mode="update-password" />;
}
