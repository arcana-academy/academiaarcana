import type { MetadataRoute } from "next";

/**
 * Crawl guidance for public pages. Authorization still belongs to the
 * application's server-side guards; robots.txt is not an access control.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/login",
          "/cadastro",
          "/design-system/",
          "/santuario",
          "/academia",
          "/grimorios",
          "/workspace",
          "/pratica",
          "/cronograma",
          "/missoes",
          "/foco",
          "/streak",
          "/estatisticas",
          "/conquistas",
          "/amigos",
          "/perfil",
          "/personalizar",
          "/configuracoes",
        ],
      },
    ],
  };
}
