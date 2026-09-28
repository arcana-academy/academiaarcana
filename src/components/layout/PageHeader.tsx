import Link from "next/link";
import { LogOut, Sparkles } from "lucide-react";

import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui";

export function PageHeader() {
  return (
    <header className="aa-app-header">
      <Link
        className="aa-brand-link"
        href="/santuario"
        aria-label="Academia Arcana — ir para o Santuário"
      >
        <span className="aa-brand-mark" aria-hidden="true">
          <Sparkles size={18} strokeWidth={1.8} />
        </span>
        <span className="aa-brand-copy">
          <span className="aa-app-brand">Academia Arcana</span>
          <span className="aa-app-context">Jornada de aprendizagem</span>
        </span>
      </Link>

      <form action={signOut}>
        <Button variant="secondary" size="sm" type="submit">
          <LogOut size={16} aria-hidden="true" />
          Sair
        </Button>
      </form>
    </header>
  );
}
