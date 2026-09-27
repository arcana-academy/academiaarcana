import { expect, test } from "@playwright/test";

test.describe("GitHub integration", () => {
  test("verifies the external GitHub provider through the site runtime", async ({
    request,
  }) => {
    const response = await request.get("/api/integrations/github/verify");

    expect(response.status()).toBe(200);

    const body = await response.json();

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
