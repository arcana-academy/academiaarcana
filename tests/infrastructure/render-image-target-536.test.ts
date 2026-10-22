import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

type Target = {
  id: string;
  type: string;
  serviceDetails: { runtime: string };
  imagePath: string;
  autoDeployTrigger: string;
};

type VerifyInput = {
  hookUrl: string;
  approvedServiceId: string;
  apiKey: string;
  imageUrl: string;
  fetchService: () => Promise<{ status: number; json: () => Promise<Target> }>;
};
const { verifyRenderImageTarget } = createRequire(import.meta.url)(
  "../../scripts/security/verify-render-image-target-536.cjs",
) as { verifyRenderImageTarget: (inputs: VerifyInput) => Promise<boolean> };

const imageRepo = "ghcr.io/arcana-academy/academiaarcana";
const id = "srv-synthetic123";
const inputs = {
  hookUrl: `https://api.render.com/deploy/${id}?key=synthetic-test-only`,
  approvedServiceId: id,
  apiKey: "synthetic-read-api-key",
  imageUrl: `${imageRepo}@sha256:${"a".repeat(64)}`,
};
const service: Target = {
  id,
  type: "web_service",
  serviceDetails: { runtime: "image" },
  imagePath: `${imageRepo}:reviewed-tag`,
  autoDeployTrigger: "off",
};
const verify = (target: Target, extra: Partial<typeof inputs> = {}) =>
  verifyRenderImageTarget({
    ...inputs,
    ...extra,
    fetchService: async () => ({ status: 200, json: async () => target }),
  });

describe("Render image-release target preflight", () => {
  it("accepts a matching image-backed web service with auto deploy disabled", async () => {
    await expect(verify(service)).resolves.toBe(true);
  });

  it("rejects an unrelated background worker using the same image", async () => {
    await expect(verify({ ...service, type: "background_worker" })).rejects.toThrow(/image-backed service/);
  });

  it("rejects the current Git-backed Render runtime", async () => {
    await expect(verify({ ...service, serviceDetails: { runtime: "node" } })).rejects.toThrow(/image-backed service/);
  });

  it("rejects another image repository and enabled auto-deploy", async () => {
    await expect(verify({ ...service, imagePath: "docker.io/example/unreviewed" })).rejects.toThrow(/approved GHCR/);
    await expect(verify({ ...service, autoDeployTrigger: "commit" })).rejects.toThrow(/automatic deployment disabled/);
  });

  it("rejects a different service ID and malformed image digest", async () => {
    await expect(verify({ ...service, id: "srv-another" })).rejects.toThrow(/image-backed service/);
    await expect(verify(service, { imageUrl: `${imageRepo}:mutable` })).rejects.toThrow(/immutable GHCR image/);
  });
});
