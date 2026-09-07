import type { Metadata } from "next";

import "./globals.css";

import { ApplicationProviders } from "@/application/providers/ApplicationProviders";
import type { ApplicationIdentityState } from "@/application/identity/contracts";

export const metadata: Metadata = {
  title: "Academia Arcana",
  description: "Uma academia de aprendizagem adaptativa, acessível e segura.",
};

const anonymousIdentity: ApplicationIdentityState = {
  status: "anonymous",
  identity: null,
  error: null,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <ApplicationProviders identity={anonymousIdentity}>
          {children}
        </ApplicationProviders>
      </body>
    </html>
  );
}