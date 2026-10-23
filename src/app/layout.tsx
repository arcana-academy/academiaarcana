import type { Metadata } from "next";

import "./globals.css";
import "./accessibility.css";

import { arcanaGrenze, arcanaLiterata, arcanaCormorant, arcanaSmythe } from "./fonts";
import { ApplicationProviders } from "@/application/providers/ApplicationProviders";
import { createIdentityResolver } from "@/application/identity/IdentityResolver";
import type { ApplicationIdentityState } from "@/application/identity/contracts";
import { createResolveSubjectIdServer } from "@/lib/identity/resolve-subject-id-server";
import { getAdobeFontsStylesheetUrl } from "@/infrastructure/integrations/adobe";
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  SITE_NAME,
  resolveSiteUrl,
} from "@/lib/seo/site-metadata";

/**
 * Document-level defaults. Each route adds its own title, description and
 * canonical through `pageMetadata`, so no two pages share the same title
 * (WCAG 2.4.2) and crawlers receive absolute canonical URLs.
 */
export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  applicationName: SITE_NAME,
  title: {
    default: DEFAULT_SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "pt_BR",
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION,
  },
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
    <html lang="pt-BR" className={[
      arcanaGrenze.variable,
      arcanaLiterata.variable,
      arcanaCormorant.variable,
      arcanaSmythe.variable,
    ].join(" ")}>
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
