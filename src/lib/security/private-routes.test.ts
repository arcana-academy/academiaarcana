import { describe, expect, it } from "vitest";

import {
  LOGIN_PATH,
  PRIVATE_ROUTE_PREFIXES,
  isPrivateRoutePath,
} from "@/lib/security/private-routes";

describe("isPrivateRoutePath", () => {
  it("gates every declared private route", () => {
    for (const route of PRIVATE_ROUTE_PREFIXES) {
      expect(isPrivateRoutePath(route), route).toBe(true);
    }
  });

  it("gates descendants of a private route", () => {
    expect(isPrivateRoutePath("/integracoes/asana/callback")).toBe(true);
    expect(isPrivateRoutePath("/santuario/hoje")).toBe(true);
    expect(isPrivateRoutePath("/workspace/grimoire-1/page-2")).toBe(true);
  });

  it("does not gate look-alike public paths", () => {
    for (const path of [
      "/santuarios",
      "/praticar",
      "/perfil-publico",
      "/integracoes/asana-preview",
      "/integracoes",
      "/",
      "/login",
      "/cadastro",
      "/recuperar-senha",
      "/design-system",
    ]) {
      expect(isPrivateRoutePath(path), path).toBe(false);
    }
  });

  it("ignores a trailing slash", () => {
    expect(isPrivateRoutePath("/santuario/")).toBe(true);
    expect(isPrivateRoutePath("/integracoes/asana/")).toBe(true);
  });

  it("gates feedback because responses require an authenticated owner", () => {
    expect(isPrivateRoutePath("/feedback")).toBe(true);
    expect(
      PRIVATE_ROUTE_PREFIXES.some((route) => route === "/feedback"),
    ).toBe(true);
  });

  it("leaves the login redirect target reachable", () => {
    expect(isPrivateRoutePath(LOGIN_PATH)).toBe(false);
    expect(LOGIN_PATH).toBe("/login");
  });

  it("never gates infrastructure endpoints", () => {
    for (const path of ["/api/health", "/api/ready", "/api/v1/status", "/auth/callback"]) {
      expect(isPrivateRoutePath(path), path).toBe(false);
    }
  });
});
