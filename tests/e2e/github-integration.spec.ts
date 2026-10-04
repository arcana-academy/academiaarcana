import { expect, test } from "@playwright/test";

test.describe("GitHub integration", () => {
  test("verifies the external GitHub provider through the site runtime", async ({
    request,
  }) => {
    const response = await request.get("/api/integrations/github/verify");

    expect([200, 502]).toContain(response.status());

    const body = await response.json();

    if (response.status() === 502) {
      expect(body).toMatchObject({
        providerId: "github",
        pluginName: "GitHub",
        status: "error",
      });
      expect(body.message).not.toMatch(/token|secret|authorization/i);
      return;
    }

    expect(body).toMatchObject({
      providerId: "github",
      pluginName: "GitHub",
      status: "connected",
      repository: {
        fullName: "arcana-academy/academiaarcana",
        defaultBranch: "main",
        visibility: "public",
        private: false,
      },
    });

    expect(body.verifiedAt).toEqual(expect.any(String));
  });
});
