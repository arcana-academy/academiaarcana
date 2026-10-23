import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const guard = require("../../scripts/security/verify-render-image-target-536.cjs") as {
  checkedHookServiceId: (hook: string) => string;
  registeredImageRepo: (value: unknown) => boolean;
  verifyRenderImageTarget: (args: {
    hookUrl: string;
    approvedServiceId: string;
    apiKey: string;
    imageUrl: string;
    fetchService?: (...args: unknown[]) => Promise<unknown>;
  }) => Promise<boolean>;
};

const serviceId = "srv-syntheticimagestaging1";
const hookUrl = "https://api.render.com/deploy/" + serviceId + "?key=synthetic-never-print-hook-key";
const imageUrl = "ghcr.io/arcana-academy/academiaarcana@sha256:" + "a".repeat(64);
const imageService = {
  id: serviceId,
  type: "web_service",
  imagePath: "ghcr.io/arcana-academy/academiaarcana:approved",
  autoDeployTrigger: "off",
  serviceDetails: { runtime: "image" },
};
const inputs = (service = imageService) => {
  const fetchService = vi.fn(async () => ({ status: 200, json: async () => service }));
  return {
    fetchService,
    opts: {
      hookUrl,
      approvedServiceId: serviceId,
      imageUrl,
      apiKey: "synthetic-never-print-read-api-key",
      fetchService,
    },
  };
};

describe("Render image-backed deploy preflight (read-only, synthetic)", () => {
  it("requires authenticated exact service and image repository before a deploy hook", async () => {
    const { opts, fetchService } = inputs();
    await expect(guard.verifyRenderImageTarget(opts)).resolves.toBe(true);
    expect(fetchService).toHaveBeenCalledTimes(1);
    const [url, request] = fetchService.mock.calls[0] as unknown as [string, {
      method: string;
      redirect: string;
      headers: Record<string, string>;
    }];
    expect(url).toBe("https://api.render.com/v1/services/" + serviceId);
    expect(request.method).toBe("GET");
    expect(request.redirect).toBe("error");
    expect(request.headers.Authorization).toContain("Bearer ");
  });

  it.each(["node", "docker", "go", "python", "ruby", "elixir", "unknown"])(
    "rejects non-image runtime %s even when service id matches", async runtime => {
      const { opts } = inputs({ ...imageService, serviceDetails: { runtime } });
      await expect(guard.verifyRenderImageTarget(opts)).rejects.toThrow("not a verified image-backed");
    },
  );

  it("blocks the Git-backed Render runtime used by Academia Arcana", async () => {
    const { opts } = inputs({ ...imageService, serviceDetails: { runtime: "node" } });
    await expect(guard.verifyRenderImageTarget(opts)).rejects.toThrow("not a verified image-backed");
  });

  it.each([
    { ...imageService, id: "srv-different" },
    { ...imageService, imagePath: "ghcr.io/untrusted/example:tag" },
    { ...imageService, imagePath: "" },
    { ...imageService, autoDeployTrigger: "commit" },
    { ...imageService, autoDeployTrigger: "checksPass" },
    { ...imageService, serviceDetails: { runtime: "" } },
  ])("fails closed for incompatible service metadata", async service => {
    const { opts } = inputs(service);
    await expect(guard.verifyRenderImageTarget(opts)).rejects.toThrow();
  });

  it.each([
    "http://api.render.com/deploy/srv-syntheticimagestaging1?key=fake",
    "https://evil.example/deploy/srv-syntheticimagestaging1?key=fake",
    "https://api.render.com/deploy/srv-other?key=fake",
    "https://api.render.com/deploy/srv-syntheticimagestaging1?key=fake&ref=main",
    "https://api.render.com/deploy/srv-syntheticimagestaging1?key=fake&imgURL=other",
    "https://api.render.com/deploy/srv-syntheticimagestaging1?key=fake&key=second",
    "https://api.render.com/deploy/srv-syntheticimagestaging1",
  ])("rejects unsafe or mismatched deploy hooks before API access", async hook => {
    const { opts, fetchService } = inputs();
    await expect(guard.verifyRenderImageTarget({ ...opts, hookUrl: hook })).rejects.toThrow();
    expect(fetchService).not.toHaveBeenCalled();
  });

  it("rejects missing credentials, approval ID or immutable image before API access", async () => {
    for (const difference of [
      { apiKey: "" },
      { approvedServiceId: "srv-different" },
      { approvedServiceId: "" },
      { imageUrl: "ghcr.io/arcana-academy/academiaarcana:latest" },
      { imageUrl: "ghcr.io/other/image@sha256:" + "a".repeat(64) },
    ]) {
      const { opts, fetchService } = inputs();
      await expect(guard.verifyRenderImageTarget({ ...opts, ...difference })).rejects.toThrow();
      expect(fetchService).not.toHaveBeenCalled();
    }
  });

  it("rejects transport errors, missing metadata and denied HTTP status", async () => {
    for (const fetchService of [
      vi.fn(async () => { throw new Error("synthetic secret in backend error"); }),
      vi.fn(async () => ({ status: 403, json: async () => imageService })),
      vi.fn(async () => ({ status: 200, json: async () => { throw new Error("invalid JSON"); } })),
    ]) {
      const { opts } = inputs();
      await expect(guard.verifyRenderImageTarget({ ...opts, fetchService })).rejects.toThrow();
    }
  });

  it("never includes fake API keys or deploy hook secrets in refusal messages", async () => {
    const { opts } = inputs({ ...imageService, serviceDetails: { runtime: "node" } });
    try {
      await guard.verifyRenderImageTarget(opts);
      throw new Error("Expected refusal");
    } catch (error) {
      const output = String(error);
      expect(output).not.toContain("synthetic-never-print");
      expect(output).not.toContain(hookUrl);
      expect(output).not.toContain(imageUrl);
    }
  });

  it("puts the independent live-kind check BEFORE the imgURL webhook", () => {
    const workflow = readFileSync(resolve(
      process.cwd(), ".github/workflows/image-release.yml",
    ), "utf8");
    const deploy = workflow.split("\n  deploy:\n")[1];
    expect(deploy).toBeTruthy();
    const fetchGuard = deploy.indexOf("Fetch immutable public preflight from approved main SHA");
    const preflight = deploy.indexOf("Verify live Render image-backed service and approved target");
    const webhook = deploy.indexOf("Request deployment of the immutable image");
    expect(fetchGuard).toBeGreaterThan(0);
    expect(preflight).toBeGreaterThan(fetchGuard);
    expect(webhook).toBeGreaterThan(preflight);
    expect(deploy).toContain("secrets.RENDER_SERVICE_READ_API_KEY");
    expect(deploy).toContain("vars.RENDER_IMAGE_SERVICE_ID");
    expect(deploy).toContain("verify-render-image-target-536.cjs");
    expect(deploy).toContain("permissions: {}");
    expect(deploy).toContain("raw.githubusercontent.com");
    expect(deploy).toContain("needs.preflight.outputs.release_sha");
    expect(deploy).toContain("--data-urlencode \"imgURL=$IMAGE_URL\"");
  });
});
