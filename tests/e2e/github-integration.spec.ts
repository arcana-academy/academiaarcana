import { expect, test } from "@playwright/test";

test.describe("GitHub integration", () => {
  test("verifies or fails closed for the external GitHub provider", async ({
    request,
  }) => {
    const response = await request.get("/api/integrations/github/verify");
    expect([200, 500, 502]).toContain(response.status());

    const body = await response.json();

    if (response.status() === 200) {
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
      return;
    }

    expect(body).toMatchObject({
      providerId: "github",
      pluginName: "GitHub",
      status: "error",
    });
    expect(body.message).toBe("GitHub connection verification failed.");
    expect(JSON.stringify(body)).not.toContain("secret");
  });
});
