import type { Metadata } from "next";

import "./globals.css";

import { ApplicationProviders } from "@/application/providers/ApplicationProviders";
import { createIdentityResolver } from "@/application/identity/IdentityResolver";
import type { ApplicationIdentityState } from "@/application/identity/contracts";
import { createResolveSubjectIdServer } from "@/lib/identity/resolve-subject-id-server";
import { getAdobeFontsStylesheetUrl } from "@/infrastructure/integrations/adobe";

export const metadata: Metadata = {
  title: "Academia Arcana",
  description: "Uma academia de aprendizagem adaptativa, acessível e segura.",
};

async function resolveApplicationIdentity(): Promise<ApplicationIdentityState> {
  const resolver = createIdentityResolver({
    resolveSubjectId: createResolveSubjectIdServer(),
  });

  return resolver.resolve();
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const identity = await resolveApplicationIdentity();
  const adobeFontsStylesheetUrl = getAdobeFontsStylesheetUrl();

  return (
    <html lang="pt-BR">
      <head>
        {adobeFontsStylesheetUrl ? (
          <link rel="stylesheet" href={adobeFontsStylesheetUrl} />
        ) : null}
      </head>
      <body>
        <ApplicationProviders identity={identity}>
          {children}
        </ApplicationProviders>
      </body>
    </html>
  );
}
