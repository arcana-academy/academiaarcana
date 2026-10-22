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
  fetchService: (url: string, options?: RequestInit) => Promise<{ status: number; json: () => Promise<Target> }>;
};
const { verifyRenderImageTarget, requestVerifiedRenderImageDeployment } = createRequire(import.meta.url)(
  "../../scripts/security/verify-render-image-target-536.cjs",
) as {
  verifyRenderImageTarget: (inputs: VerifyInput) => Promise<boolean>;
  requestVerifiedRenderImageDeployment: (inputs: VerifyInput) => Promise<boolean>;
};

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

  it("requests the exact immutable digest only after a fresh service GET", async () => {
    const requests: Array<{ url: string; options?: RequestInit }> = [];
    const fetchService = async (url: string, options?: RequestInit) => {
      requests.push({ url, options });
      return { status: 200, json: async () => service };
    };

    await expect(requestVerifiedRenderImageDeployment({ ...inputs, fetchService })).resolves.toBe(true);
    expect(requests).toHaveLength(2);
    expect(requests[0].url).toBe(`https://api.render.com/v1/services/${id}`);
    expect(requests[0].options?.method).toBe("GET");
    expect(requests[0].options?.headers).toMatchObject({ Authorization: "Bearer synthetic-read-api-key" });
    const hook = new URL(requests[1].url);
    expect(hook.origin).toBe("https://api.render.com");
    expect(hook.pathname).toBe(`/deploy/${id}`);
    expect(hook.searchParams.get("key")).toBe("synthetic-test-only");
    expect(hook.searchParams.get("imgURL")).toBe(inputs.imageUrl);
    expect(requests[1].options?.method).toBe("GET");
    expect(requests[1].options?.redirect).toBe("error");
    expect(requests[1].options?.headers).toBeUndefined();
  });

  it("rechecks metadata and refuses hook when the live target changes after an earlier read", async () => {
    let current = service;
    const requests: string[] = [];
    const fetchService = async (url: string) => {
      requests.push(url);
      return { status: 200, json: async () => current };
    };
    await expect(verifyRenderImageTarget({ ...inputs, fetchService })).resolves.toBe(true);
    requests.length = 0;
    current = { ...service, imagePath: "docker.io/example/changed-target" };
    await expect(requestVerifiedRenderImageDeployment({ ...inputs, fetchService })).rejects.toThrow(/approved GHCR/);
    expect(requests).toEqual([`https://api.render.com/v1/services/${id}`]);
  });

  it("never calls the hook when the service GET fails or auto-deploy is enabled", async () => {
    const requests: string[] = [];
    const fetchService = async (url: string) => {
      requests.push(url);
      return { status: 503, json: async () => service };
    };
    await expect(requestVerifiedRenderImageDeployment({ ...inputs, fetchService })).rejects.toThrow(/HTTP 200/);
    expect(requests).toHaveLength(1);
    requests.length = 0;
    const changedService = { ...service, autoDeployTrigger: "commit" };
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      fetchService: async (url: string) => {
        requests.push(url);
        return { status: 200, json: async () => changedService };
      },
    })).rejects.toThrow(/automatic deployment disabled/);
    expect(requests).toEqual([`https://api.render.com/v1/services/${id}`]);
  });

  it("fails closed if the hook does not return HTTP 200", async () => {
    const requests: string[] = [];
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      fetchService: async (url: string) => {
        requests.push(url);
        return { status: url.includes("/deploy/") ? 403 : 200, json: async () => service };
      },
    })).rejects.toThrow(/hook did not accept the request/);
    expect(requests).toHaveLength(2);
  });
  it("accepts Render HTTP 202 as a queued deployment request", async () => {
    const urls: string[] = [];
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      fetchService: async (url: string) => {
        urls.push(url);
        return { status: url.includes("/deploy/") ? 202 : 200, json: async () => service };
      },
    })).resolves.toBe(true);
    expect(urls).toHaveLength(2);
  });

});
