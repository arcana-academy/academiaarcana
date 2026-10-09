import { clearAuthCookiesAtScopes } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicRuntimeConfig } from "@/core/config";
import { getSupabaseAuthStorageKey } from "@/infrastructure/supabase/auth-storage";

/**
 * Local-only cookie expiration. It never contacts Supabase Auth, so it can
 * complete even after global refresh tokens have been revoked.
 *
 * A successful return proves that all expected expiration writes were issued.
 * Browser application of Set-Cookie must additionally be verified by E2E tests.
 */
export async function clearLocalAuthSession(): Promise<void> {
  const cookieStore = await cookies();
  const storageKey = getSupabaseAuthStorageKey(
    getPublicRuntimeConfig().supabaseUrl,
  );
  const isAuthChunk = (name: string) =>
    name === storageKey ||
    (name.startsWith(storageKey + ".") &&
      /^(0|[1-9]\d*)$/.test(name.slice(storageKey.length + 1)));

  const names = cookieStore
    .getAll()
    .map(({ name }) => name)
    .filter(isAuthChunk);
  const written = new Set<string>();

  if (names.length === 0) {
    return;
  }

  await clearAuthCookiesAtScopes({
    storageKey,
    scopes: [{ path: "/" }],
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToExpire) => {
      for (const { name, value, options } of cookiesToExpire) {
        cookieStore.set(name, value, options);
        if (options?.maxAge === 0) {
          written.add(name);
        }
      }
    },
  });

  if (names.some((name) => !written.has(name))) {
    throw new Error("Supabase auth cookie expiration was not fully emitted");
  }
}
