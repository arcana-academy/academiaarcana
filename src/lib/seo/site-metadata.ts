import type { Metadata } from "next";

export const SITE_NAME = "Academia Arcana";

export const DEFAULT_SITE_TITLE =
  "Academia Arcana — aprendizagem adaptativa, acessível e segura";

export const DEFAULT_SITE_DESCRIPTION =
  "Uma academia de aprendizagem adaptativa, acessível e segura: grimórios, missões, prática e acompanhamento educacional.";

/**
 * Origin used when neither the public application URL nor the Render runtime
 * host is configured (local development and unit tests).
 */
export const FALLBACK_SITE_URL = "http://localhost:3000";

export type SiteEnvironment = Record<string, string | undefined>;

type RouteMetadata = {
  /** Page-specific title; the root layout applies the "%s · Academia Arcana" template. */
  readonly title: string;
  readonly description: string;
  /** Private routes are excluded from the sitemap and marked `noindex`. */
  readonly indexable: boolean;
};

/**
 * Canonical metadata for every route in the application.
 *
 * `indexable: false` marks authenticated surfaces: they never render without a
 * session, so they must not be advertised to crawlers.
 */
export const ROUTE_METADATA = {
  "/": {
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION,
    indexable: true,
  },
  "/login": {
    title: "Entrar",
    description:
      "Entre na Academia Arcana para retomar seus grimórios, missões e sessões de prática.",
    indexable: true,
  },
  "/cadastro": {
    title: "Criar conta",
    description:
      "Crie sua conta na Academia Arcana e comece sua jornada de aprendizagem.",
    indexable: true,
  },
  "/recuperar-senha": {
    title: "Recuperar acesso",
    description:
      "Receba instruções para recuperar o acesso à sua conta da Academia Arcana.",
    indexable: true,
  },
  "/redefinir-senha": {
    title: "Definir nova senha",
    description: "Defina uma nova senha para sua conta da Academia Arcana.",
    // The route requires an active recovery session, so it is never public.
    indexable: false,
  },
  "/feedback": {
    title: "Enviar feedback",
    description:
      "Envie sugestões, relatos de problemas e elogios sobre a Academia Arcana.",
    indexable: true,
  },
  "/integracoes": {
    title: "Integrações",
    description:
      "Estado das integrações externas da Academia Arcana, como Notion, Todoist, Trello, Asana e Microsoft.",
    indexable: true,
  },
  "/design-system": {
    title: "Design System",
    description:
      "Catálogo interno de tokens, componentes e provas visuais do Design System da Academia Arcana.",
    indexable: false,
  },
  "/design-system/pilots/cronograma": {
    title: "Piloto do Cronograma",
    description:
      "Piloto interno do Design System para a experiência de planejamento de estudos.",
    indexable: false,
  },
  "/design-system/pilots/focus": {
    title: "Piloto de Foco",
    description:
      "Piloto interno do Design System para a experiência de sessões de foco.",
    indexable: false,
  },
  "/design-system/pilots/statistics": {
    title: "Piloto de Estatísticas",
    description:
      "Piloto interno do Design System para a experiência de estatísticas educacionais.",
    indexable: false,
  },
  "/design-system/proofs": {
    title: "Provas do Design System",
    description:
      "Registro interno das provas visuais aprovadas do Design System da Academia Arcana.",
    indexable: false,
  },
  "/santuario": {
    title: "Santuário",
    description:
      "Ponto de partida da sua aprendizagem: prioridades, continuidade de estudo e acesso aos ambientes da Academia Arcana.",
    indexable: false,
  },
  "/academia": {
    title: "Academia",
    description:
      "Organize o conhecimento, planeje o estudo e retome a aprendizagem pelos ambientes da Academia Arcana.",
    indexable: false,
  },
  "/grimorios": {
    title: "Grimórios",
    description: "Crie e organize grimórios, capítulos e páginas de estudo.",
    indexable: false,
  },
  "/workspace": {
    title: "Workspace de leitura",
    description:
      "Leia e edite o conteúdo do grimório selecionado com hierarquia de capítulos e páginas.",
    indexable: false,
  },
  "/missoes": {
    title: "Missões",
    description:
      "Missões e objetivos de estudo que dão sentido à progressão na Academia Arcana.",
    indexable: false,
  },
  "/cronograma": {
    title: "Cronograma",
    description: "Planeje tarefas de estudo, prazos e revisões.",
    indexable: false,
  },
  "/foco": {
    title: "Sessão de foco",
    description: "Sessões de foco com ritmo e conforto cognitivo.",
    indexable: false,
  },
  "/pratica": {
    title: "Prática e recuperação",
    description:
      "Pratique e recupere o que foi estudado com evidência objetiva de aprendizagem.",
    indexable: false,
  },
  "/estatisticas": {
    title: "Estatísticas",
    description:
      "Estatísticas educacionais separadas do tempo de tela e do uso da plataforma.",
    indexable: false,
  },
  "/conquistas": {
    title: "Conquistas",
    description: "Conquistas e marcos da sua jornada de aprendizagem.",
    indexable: false,
  },
  "/streak": {
    title: "Sequência de estudo",
    description:
      "Sua sequência de estudo, apresentada sem punição por interrupções.",
    indexable: false,
  },
  "/perfil": {
    title: "Perfil",
    description:
      "Identidade, jornada de aprendizagem e privacidade do estudante.",
    indexable: false,
  },
  "/configuracoes": {
    title: "Configurações",
    description: "Acessibilidade, aparência, segurança e integrações da conta.",
    indexable: false,
  },
  "/personalizar": {
    title: "Personalização",
    description:
      "Personalize a aparência e a experiência de leitura da Academia Arcana.",
    indexable: false,
  },
  "/amigos": {
    title: "Amigos",
    description: "Sua rede de estudo e as solicitações de amizade.",
    indexable: false,
  },
  "/integracoes/asana": {
    title: "Asana",
    description:
      "Conecte o Asana para acompanhar projetos e tarefas de estudo na Academia Arcana.",
    indexable: false,
  },
  "/integracoes/todoist": {
    title: "Todoist",
    description:
      "Conecte o Todoist para trazer tarefas de estudo para a Academia Arcana.",
    indexable: false,
  },
  "/integracoes/trello": {
    title: "Trello",
    description:
      "Conecte o Trello para consultar quadros, listas e cartões de estudo.",
    indexable: false,
  },
  "/integracoes/notion": {
    title: "Notion",
    description:
      "Conecte o Notion para trazer páginas de estudo para a Academia Arcana.",
    indexable: false,
  },
  "/integracoes/microsoft-sharepoint": {
    title: "Microsoft SharePoint",
    description:
      "Conecte o Microsoft SharePoint para consultar sites, unidades e documentos de estudo.",
    indexable: false,
  },
  "/integracoes/ia-aberta": {
    title: "Laboratório de IA aberta",
    description:
      "Laboratório de IA aberta da Academia Arcana, restrito a endpoints configurados pelo operador.",
    indexable: false,
  },
} as const satisfies Record<string, RouteMetadata>;

export type RoutePath = keyof typeof ROUTE_METADATA;

/** Prefixes that must never be crawled: authenticated app, API and auth callbacks. */
export const NON_CRAWLABLE_PREFIXES = ["/api/", "/auth/"] as const;

/**
 * Resolves the canonical site origin.
 *
 * Order of precedence: the public application URL baked for OAuth redirects,
 * the Render-provided runtime host, then the local development origin. Invalid
 * values never leak into metadata: the fallback keeps canonical URLs absolute.
 */
export function resolveSiteUrl(environment: SiteEnvironment = process.env): URL {
  const candidate =
    environment.NEXT_PUBLIC_APP_URL?.trim() ||
    environment.RENDER_EXTERNAL_URL?.trim();

  if (candidate) {
    try {
      const parsed = new URL(candidate);

      if (
        (parsed.protocol === "https:" || parsed.protocol === "http:") &&
        parsed.hostname
      ) {
        return new URL(parsed.origin);
      }
    } catch {
      // Invalid configuration falls back to the development origin below.
    }
  }

  return new URL(FALLBACK_SITE_URL);
}

/** Routes that may be listed in the sitemap, in navigational order. */
export function listIndexableRoutes(): RoutePath[] {
  return (Object.keys(ROUTE_METADATA) as RoutePath[]).filter(
    (route) => ROUTE_METADATA[route].indexable,
  );
}

/** Routes excluded from crawling: authenticated surfaces and non-crawlable prefixes. */
export function listNonIndexableRoutes(): RoutePath[] {
  return (Object.keys(ROUTE_METADATA) as RoutePath[]).filter(
    (route) => !ROUTE_METADATA[route].indexable,
  );
}

/**
 * Builds the metadata for a single route.
 *
 * Every route gets a distinct, descriptive title (WCAG 2.4.2) plus canonical,
 * Open Graph and robots directives consistent with its visibility.
 */
export function pageMetadata(
  route: RoutePath,
  environment: SiteEnvironment = process.env,
): Metadata {
  const entry: RouteMetadata = ROUTE_METADATA[route];
  const isHome = route === "/";

  return {
    metadataBase: resolveSiteUrl(environment),
    title: isHome ? { absolute: entry.title } : entry.title,
    description: entry.description,
    alternates: { canonical: route },
    robots: entry.indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "pt_BR",
      url: route,
      title: entry.title,
      description: entry.description,
    },
    twitter: {
      card: "summary",
      title: entry.title,
      description: entry.description,
    },
  };
}
