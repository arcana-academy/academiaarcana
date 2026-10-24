/**
 * Routes that require an authenticated session before the server is allowed to
 * stream any part of the document.
 *
 * Next.js flushes the streamed shell (including `loading.tsx`) before a page's
 * `redirect()` can run, so an unauthenticated request to a route with a loading
 * boundary used to answer `200 OK` plus a client-side meta refresh. Declaring
 * the gated prefixes here lets the request proxy answer with a real `307` before
 * the render starts. The pages keep their own guard as defence in depth.
 */
export const PRIVATE_ROUTE_PREFIXES = [
  "/santuario",
  "/academia",
  "/grimorios",
  "/workspace",
  "/missoes",
  "/cronograma",
  "/foco",
  "/pratica",
  "/estatisticas",
  "/conquistas",
  "/streak",
  "/perfil",
  "/configuracoes",
  "/personalizar",
  "/amigos",
  // Feedback is persisted against an authenticated owner (supabase migration
  // 20260929210000) and anonymous access to the table was revoked, so the form
  // can only succeed for a signed-in user. Gating the page keeps the public
  // surface from offering an action that always fails.
  "/feedback",
  "/redefinir-senha",
  "/integracoes/asana",
  "/integracoes/todoist",
  "/integracoes/trello",
  "/integracoes/notion",
  "/integracoes/microsoft-sharepoint",
] as const;

/** Where unauthenticated requests to a private route are sent. */
export const LOGIN_PATH = "/login";

/**
 * True when `pathname` is a gated route or a descendant of one.
 *
 * Matching is segment-based, so look-alike paths such as `/santuarios` or
 * `/praticar` stay public instead of silently borrowing a private route's
 * policy. Query strings and fragments are not part of the comparison.
 */
export function isPrivateRoutePath(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}
