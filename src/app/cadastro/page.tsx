import { AuthForm } from "@/components/auth/AuthForm";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/cadastro");

export default function CadastroPage() {
  return <AuthForm mode="signup" />;
}
