import { AuthForm } from "@/components/auth/AuthForm";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/recuperar-senha");

export default function RecuperarSenhaPage() {
  return <AuthForm mode="recover" />;
}
