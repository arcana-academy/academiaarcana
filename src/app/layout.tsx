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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href={"https://fonts.googleapis.com/css2?family=Cormorant+Upright:wght@400;500;600;700&family=Grenze:ital,wght@0,400;0,600;0,700;1,400&family=Literata:wght@400;600&family=Smythe&display=swap"}
        />
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
