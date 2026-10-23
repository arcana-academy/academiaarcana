import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  FALLBACK_SITE_URL,
  NON_CRAWLABLE_PREFIXES,
  ROUTE_METADATA,
  listIndexableRoutes,
  listNonIndexableRoutes,
  pageMetadata,
  resolveSiteUrl,
  type RoutePath,
} from "@/lib/seo/site-metadata";

const PRODUCTION_ENVIRONMENT = {
  NEXT_PUBLIC_APP_URL: "https://academia.example.org",
};

const allRoutes = Object.keys(ROUTE_METADATA) as RoutePath[];

describe("resolveSiteUrl", () => {
  it("prefers the public application URL", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_APP_URL: "https://academia.example.org",
        RENDER_EXTERNAL_URL: "https://render.example.org",
      }).origin,
    ).toBe("https://academia.example.org");
  });

  it("falls back to the Render runtime host when no public URL is configured", () => {
    expect(
      resolveSiteUrl({ RENDER_EXTERNAL_URL: "https://arcana.onrender.com" })
        .origin,
    ).toBe("https://arcana.onrender.com");
  });

  it("normalises a configured URL to its origin, dropping paths and queries", () => {
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_APP_URL: "https://academia.example.org/app?x=1" })
        .origin,
    ).toBe("https://academia.example.org");
  });

  it("ignores non-HTTP and malformed values instead of producing broken canonicals", () => {
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_APP_URL: "javascript:alert(1)" }).origin,
    ).toBe(FALLBACK_SITE_URL);
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_APP_URL: "not a url", RENDER_EXTERNAL_URL: "" })
        .origin,
    ).toBe(FALLBACK_SITE_URL);
    expect(resolveSiteUrl({}).origin).toBe(FALLBACK_SITE_URL);
  });
});

describe("pageMetadata", () => {
  it("gives every route a distinct, descriptive title (WCAG 2.4.2)", () => {
    const titles = allRoutes.map((route) => {
      const metadata = pageMetadata(route, PRODUCTION_ENVIRONMENT);
      const title = metadata.title;
      return typeof title === "string" ? title : JSON.stringify(title);
    });

    expect(new Set(titles).size).toBe(titles.length);
  });

  it("gives every route a non-empty description", () => {
    for (const route of allRoutes) {
      const metadata = pageMetadata(route, PRODUCTION_ENVIRONMENT);

      expect(metadata.description, route).toBe(ROUTE_METADATA[route].description);
      expect(metadata.description?.length, route).toBeGreaterThan(20);
    }
  });

  it("keeps the home page on an absolute default title", () => {
    const metadata = pageMetadata("/", PRODUCTION_ENVIRONMENT);

    expect(metadata.title).toEqual({ absolute: DEFAULT_SITE_TITLE });
    expect(metadata.description).toBe(DEFAULT_SITE_DESCRIPTION);
  });

  it("uses the short title for nested routes so the root template applies", () => {
    expect(pageMetadata("/santuario", PRODUCTION_ENVIRONMENT).title).toBe(
      "Santuário",
    );
    expect(pageMetadata("/integracoes", PRODUCTION_ENVIRONMENT).title).toBe(
      "Integrações",
    );
  });

  it("resolves absolute canonical and Open Graph URLs against the configured origin", () => {
    const metadata = pageMetadata("/login", PRODUCTION_ENVIRONMENT);

    expect(String(metadata.metadataBase)).toBe("https://academia.example.org/");
    expect(metadata.alternates?.canonical).toBe("/login");
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: "Academia Arcana",
      locale: "pt_BR",
      url: "/login",
      title: "Entrar",
    });
  });

  it("marks only public routes as indexable", () => {
    expect(pageMetadata("/", PRODUCTION_ENVIRONMENT).robots).toEqual({
      index: true,
      follow: true,
    });
    expect(pageMetadata("/login", PRODUCTION_ENVIRONMENT).robots).toEqual({
      index: true,
      follow: true,
    });

    for (const route of [
      "/santuario",
      "/workspace",
      "/perfil",
      "/design-system",
      "/integracoes/notion",
    ] as RoutePath[]) {
      expect(pageMetadata(route, PRODUCTION_ENVIRONMENT).robots, route).toEqual({
        index: false,
        follow: false,
      });
    }
  });
});

describe("route visibility lists", () => {
  it("partitions every route into exactly one of the two lists", () => {
    const indexable = listIndexableRoutes();
    const nonIndexable = listNonIndexableRoutes();

    expect(indexable.length + nonIndexable.length).toBe(allRoutes.length);
    expect(indexable.filter((route) => nonIndexable.includes(route))).toEqual([]);
  });

  it("advertises only the public entry points", () => {
    expect(listIndexableRoutes()).toEqual([
      "/",
      "/login",
      "/cadastro",
      "/recuperar-senha",
      "/feedback",
      "/integracoes",
    ]);
  });

  it("never advertises an authenticated surface", () => {
    expect(listIndexableRoutes()).not.toContain("/redefinir-senha");
    expect(listIndexableRoutes()).not.toContain("/santuario");
    expect(listIndexableRoutes()).not.toContain("/workspace");
    expect(listIndexableRoutes()).not.toContain("/api/health");
  });
});

describe("sitemap", () => {
  it("lists only indexable routes as absolute URLs", () => {
    const entries = sitemap();

    expect(entries.map((entry) => entry.url)).toEqual(
      listIndexableRoutes().map(
        (route) => `${FALLBACK_SITE_URL}${route === "/" ? "/" : route}`,
      ),
    );
    expect(entries[0].priority).toBe(1);
    expect(entries.every((entry) => entry.url.startsWith("http"))).toBe(true);
  });

  it("does not advertise session-gated routes", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls.some((url) => url.endsWith("/santuario"))).toBe(false);
    expect(urls.some((url) => url.endsWith("/workspace"))).toBe(false);
    expect(urls.some((url) => url.endsWith("/design-system"))).toBe(false);
  });
});

describe("robots", () => {
  it("disallows authenticated routes and non-crawlable prefixes", () => {
    const rules = robots().rules;
    const rule = Array.isArray(rules) ? rules[0] : rules;

    expect(rule.userAgent).toBe("*");
    expect(rule.allow).toBe("/");

    const disallow = rule.disallow as string[];

    for (const route of listNonIndexableRoutes()) {
      expect(disallow, route).toContain(route);
    }

    for (const prefix of NON_CRAWLABLE_PREFIXES) {
      expect(disallow).toContain(prefix);
    }

    expect(disallow).not.toContain("/");
    expect(disallow).not.toContain("/login");
  });

  it("publishes an absolute sitemap URL and host", () => {
    const result = robots();

    expect(result.sitemap).toBe(`${FALLBACK_SITE_URL}/sitemap.xml`);
    expect(result.host).toBe(new URL(FALLBACK_SITE_URL).origin);
  });
});
