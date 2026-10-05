import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const SUBJECT_BOUND_CONNECT_ROUTES = [
  "src/app/api/integrations/todoist/connect/route.ts",
  "src/app/api/integrations/notion/connect/route.ts",
  "src/app/api/integrations/asana/connect/route.ts",
  "src/app/api/integrations/trello/connect/route.ts",
  "src/app/api/integrations/microsoft-sharepoint/connect/route.ts",
] as const;

const SUBJECT_BOUND_CALLBACK_ROUTES = [
  "src/app/api/integrations/todoist/callback/route.ts",
  "src/app/api/integrations/notion/callback/route.ts",
  "src/app/api/integrations/asana/callback/route.ts",
  "src/app/api/integrations/trello/callback/route.ts",
  "src/app/api/integrations/microsoft-sharepoint/callback/route.ts",
] as const;

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("OAuth callback subject binding architecture", () => {
  it.each(SUBJECT_BOUND_CONNECT_ROUTES)(
    "%s creates a subject-bound OAuth state",
    (path) => {
      const file = source(path);
      expect(file).toContain("createSubjectBoundOAuthState");
      expect(file).toContain("claims.sub");
    },
  );

  it.each(SUBJECT_BOUND_CALLBACK_ROUTES)(
    "%s verifies the OAuth state against the current subject",
    (path) => {
      const file = source(path);
      expect(file).toContain("verifySubjectBoundOAuthState");
      expect(file).toMatch(/(?:claims|user)\.sub/);
    },
  );

  it("binds Outlook authorization and redemption to the same authenticated subject", () => {
    const authorize = source(
      "src/app/api/integrations/outlook/authorize/route.ts",
    );
    const oauth = source(
      "src/infrastructure/integrations/outlook-calendar-oauth.ts",
    );

    expect(authorize).toContain("createOutlookAuthorizationUrl(claims.sub)");
    expect(oauth).toContain("createSubjectBoundOAuthState(ownerId, clientSecret)");
    expect(oauth).toContain(
      "verifySubjectBoundOAuthState(state, ownerId, clientSecret)",
    );

    const stateDelete = oauth.indexOf("jar.delete(STATE_COOKIE)");
    const tokenRequest = oauth.indexOf(
      '"https://login.microsoftonline.com/common/oauth2/v2.0/token"',
    );

    expect(stateDelete).toBeGreaterThan(-1);
    expect(tokenRequest).toBeGreaterThan(-1);
    expect(stateDelete).toBeLessThan(tokenRequest);
  });
});
