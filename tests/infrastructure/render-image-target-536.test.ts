import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

type Target = {
  id: string;
  type: string;
  serviceDetails: { runtime: string; imagePath?: string };
  imagePath?: string;
  autoDeployTrigger?: string;
  autoDeploy?: "yes" | "no";
};

type VerifyInput = {
  hookUrl: string;
  approvedServiceId: string;
  apiKey: string;
  imageUrl: string;
  fetchService: (url: string, options?: RequestInit) => Promise<{ status: number; json: () => Promise<unknown> }>;
  waitForNextPoll?: (delayMs: number) => Promise<void>;
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

  it("accepts legacy-only Render autoDeploy=no metadata", async () => {
    const legacy: Target = { ...service };
    delete legacy.autoDeployTrigger;
    await expect(verify({ ...legacy, autoDeploy: "no" })).resolves.toBe(true);
    await expect(verify({ ...service, autoDeploy: "no" })).resolves.toBe(true);
  });

  it("rejects enabled, conflicting, or missing Render auto-deploy metadata", async () => {
    const legacy: Target = { ...service };
    delete legacy.autoDeployTrigger;
    await expect(verify({ ...legacy, autoDeploy: "yes" })).rejects.toThrow(/automatic deployment disabled/);
    await expect(verify({ ...service, autoDeploy: "yes" })).rejects.toThrow(/automatic deployment disabled/);
    await expect(verify({ ...legacy })).rejects.toThrow(/automatic deployment disabled/);
    await expect(verify({ ...service, autoDeployTrigger: "commit", autoDeploy: "no" }))
      .rejects.toThrow(/automatic deployment disabled/);
  });

  it("accepts serviceDetails.imagePath when the API response has no top-level imagePath", async () => {
    // Explicitly exercise the nested-only API response reported by the integration.
    const nestedOnly: Target = {
      id,
      type: "web_service",
      serviceDetails: { runtime: "image", imagePath: `${imageRepo}:reviewed-tag` },
      autoDeployTrigger: "off",
    };
    await expect(verify(nestedOnly)).resolves.toBe(true);
    await expect(verify({ ...nestedOnly, imagePath: nestedOnly.serviceDetails.imagePath })).resolves.toBe(true);
  });

  it("fails closed for unapproved or inconsistent nested image paths", async () => {
    const nestedOnly: Target = {
      id,
      type: "web_service",
      serviceDetails: { runtime: "image", imagePath: `${imageRepo}:reviewed-tag` },
      autoDeployTrigger: "off",
    };
    await expect(verify({
      ...nestedOnly,
      serviceDetails: { runtime: "image", imagePath: "docker.io/example/unreviewed" },
    })).rejects.toThrow(/approved GHCR/);
    await expect(verify({ ...nestedOnly, imagePath: "docker.io/example/unreviewed" }))
      .rejects.toThrow(/conflicting image repositories/);
    await expect(verify({
      ...nestedOnly,
      serviceDetails: { runtime: "image" },
    })).rejects.toThrow(/approved GHCR/);
  });

  it("refuses the deployment hook when a freshly read nested image path changes", async () => {
    const urls: string[] = [];
    const changed: Target = {
      id,
      type: "web_service",
      serviceDetails: { runtime: "image", imagePath: "docker.io/example/changed" },
      autoDeployTrigger: "off",
    };
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      fetchService: async (url: string) => {
        urls.push(url);
        return { status: 200, json: async () => changed };
      },
    })).rejects.toThrow(/approved GHCR/);
    expect(urls).toEqual([`https://api.render.com/v1/services/${id}`]);
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

  it("confirms the exact requested digest and new deployment ID before success", async () => {
    const requests: Array<{ url: string; options?: RequestInit }> = [];
    const deployId = "dep-synthetic123";
    const fetchService = async (url: string, options?: RequestInit) => {
      requests.push({ url, options });
      if (url.includes("/deploys/")) {
        return { status: 200, json: async () => ({
          id: deployId, status: "live", image: { ref: inputs.imageUrl },
        }) };
      }
      if (url.includes("/deploy/")) {
        return { status: 200, json: async () => ({ deploy: { id: deployId } }) };
      }
      return { status: 200, json: async () => service };
    };

    await expect(requestVerifiedRenderImageDeployment({ ...inputs, fetchService })).resolves.toBe(true);
    expect(requests).toHaveLength(3);
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
    expect(requests[2].url).toBe(`https://api.render.com/v1/services/${id}/deploys/${deployId}`);
    expect(requests[2].options?.headers).toMatchObject({ Authorization: "Bearer synthetic-read-api-key" });
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
  it("recovers the unique accepted HTTP 202 deploy ID and confirms that exact image live", async () => {
    const deployId = "dep-queuedsynthetic123";
    const createdAt = new Date(Date.now() + 1000).toISOString();
    const urls: string[] = [];
    let polls = 0;
    let waits = 0;
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      waitForNextPoll: async () => { waits += 1; },
      fetchService: async (url: string, options?: RequestInit) => {
        urls.push(url);
        if (url.includes("/deploys?")) {
          expect(options?.headers).toMatchObject({ Authorization: "Bearer synthetic-read-api-key" });
          return { status: 200, json: async () => [{
            deploy: {
              id: deployId, trigger: "deploy_hook", createdAt,
              status: "queued", image: { ref: inputs.imageUrl },
            },
          }] };
        }
        if (url.includes("/deploys/")) {
          polls += 1;
          return { status: 200, json: async () => ({
            id: deployId, status: polls === 1 ? "queued" : "live",
            image: { ref: inputs.imageUrl },
          }) };
        }
        if (url.includes("/deploy/")) {
          expect(options?.headers).toBeUndefined();
          return { status: 202, json: async () => ({}) };
        }
        return { status: 200, json: async () => service };
      },
    })).resolves.toBe(true);
    expect(polls).toBe(2);
    expect(waits).toBe(1);
    expect(urls).toHaveLength(5);
    expect(urls[2]).toContain("/deploys?createdAfter=");
    expect(urls[3]).toBe(`https://api.render.com/v1/services/${id}/deploys/${deployId}`);
  });

  it("fails closed if a queued HTTP 202 deploy cannot be reconciled", async () => {
    const urls: string[] = [];
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      fetchService: async (url: string) => {
        urls.push(url);
        if (url.includes("/deploys?")) return { status: 503, json: async () => [] };
        return { status: url.includes("/deploy/") ? 202 : 200, json: async () => service };
      },
    })).rejects.toThrow(/Queued Render deployment lookup failed/);
    expect(urls).toHaveLength(3);
  });

  it("rejects ambiguous queued HTTP 202 deploys rather than claiming an unrelated rollout", async () => {
    const createdAt = new Date(Date.now() + 1000).toISOString();
    const calls: string[] = [];
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      fetchService: async (url: string) => {
        calls.push(url);
        if (url.includes("/deploys?")) {
          return { status: 200, json: async () =>
            ["dep-queuedone", "dep-queuedtwo"].map(deployId => ({
              deploy: {
                id: deployId, trigger: "deploy_hook", createdAt,
                image: { ref: inputs.imageUrl }, status: "queued",
              },
            })) };
        }
        return { status: url.includes("/deploy/") ? 202 : 200, json: async () => service };
      },
    })).rejects.toThrow(/identity is ambiguous/);
    expect(calls).toHaveLength(3);
  });

  it("rejects a uniquely listed queued HTTP 202 deploy of another image", async () => {
    const createdAt = new Date(Date.now() + 1000).toISOString();
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      fetchService: async (url: string) => {
        if (url.includes("/deploys?")) {
          return { status: 200, json: async () => [{
            deploy: {
              id: "dep-queuedwrong", trigger: "deploy_hook", createdAt,
              image: { ref: `${imageRepo}@sha256:${"b".repeat(64)}` },
            },
          }] };
        }
        return { status: url.includes("/deploy/") ? 202 : 200, json: async () => service };
      },
    })).rejects.toThrow(/not the uniquely approved image/);
  });

  it("waits for the specific new deploy to become live, not an old matching SHA", async () => {
    const deployId = "dep-synthetic123";
    const urls: string[] = [];
    let polls = 0;
    let waits = 0;
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      waitForNextPoll: async () => { waits += 1; },
      fetchService: async (url: string) => {
        urls.push(url);
        if (url.includes("/deploys/")) {
          polls += 1;
          return { status: 200, json: async () => ({
            id: deployId, status: polls === 1 ? "update_in_progress" : "live",
            image: { ref: inputs.imageUrl },
          }) };
        }
        if (url.includes("/deploy/")) {
          return { status: 200, json: async () => ({ deploy: { id: deployId } }) };
        }
        return { status: 200, json: async () => service };
      },
    })).resolves.toBe(true);
    expect(polls).toBe(2);
    expect(waits).toBe(1);
    expect(urls).toHaveLength(4);
  });

  it("rejects a hook HTTP 200 without a verifiable deploy ID", async () => {
    const urls: string[] = [];
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      fetchService: async (url: string) => {
        urls.push(url);
        return { status: 200, json: async () => url.includes("/deploy/")
          ? { deploy: {} } : service };
      },
    })).rejects.toThrow(/no valid deployment ID/);
    expect(urls).toHaveLength(2);
  });

  it.each(["canceled", "build_failed", "update_failed", "pre_deploy_failed"])(
    "rejects a specific deploy ending in %s",
    async (status) => {
      const deployId = "dep-synthetic123";
      const requests: string[] = [];
      await expect(requestVerifiedRenderImageDeployment({
        ...inputs,
        fetchService: async (url: string) => {
          requests.push(url);
          if (url.includes("/deploys/")) {
            return { status: 200, json: async () => ({
              id: deployId, status, image: { ref: inputs.imageUrl },
            }) };
          }
          if (url.includes("/deploy/")) {
            return { status: 200, json: async () => ({ deploy: { id: deployId } }) };
          }
          return { status: 200, json: async () => service };
        },
      })).rejects.toThrow(/failed or was canceled/);
      expect(requests).toHaveLength(3);
    },
  );

  it("rejects a live deploy of a different image digest, even for the same source SHA", async () => {
    const deployId = "dep-synthetic123";
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      fetchService: async (url: string) => {
        if (url.includes("/deploys/")) {
          return { status: 200, json: async () => ({
            id: deployId, status: "live",
            image: { ref: `${imageRepo}@sha256:${"b".repeat(64)}` },
          }) };
        }
        if (url.includes("/deploy/")) {
          return { status: 200, json: async () => ({ deploy: { id: deployId } }) };
        }
        return { status: 200, json: async () => service };
      },
    })).rejects.toThrow(/does not match approved image digest/);
  });

  it("rejects an incorrect deployment ID or a permanent HTTP error", async () => {
    const deployId = "dep-synthetic123";
    for (const scenario of ["wrong_id", "http_401"]) {
      let checks = 0;
      await expect(requestVerifiedRenderImageDeployment({
        ...inputs,
        fetchService: async (url: string) => {
          if (url.includes("/deploys/")) {
            checks += 1;
            return { status: scenario === "http_401" ? 401 : 200, json: async () => ({
              id: scenario === "wrong_id" ? "dep-other123" : deployId,
              status: "live", image: { ref: inputs.imageUrl },
            }) };
          }
          if (url.includes("/deploy/")) {
            return { status: 200, json: async () => ({ deploy: { id: deployId } }) };
          }
          return { status: 200, json: async () => service };
        },
      })).rejects.toThrow(scenario === "http_401"
        ? /deploy lookup failed/ : /different deployment ID/);
      expect(checks).toBe(1);
    }
  });

  it("keeps tracking a legitimate rollout beyond the previous 24-poll cutoff", async () => {
    const deployId = "dep-synthetic123";
    let polls = 0;
    let waits = 0;
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      waitForNextPoll: async () => { waits += 1; },
      fetchService: async (url: string) => {
        if (url.includes("/deploys/")) {
          polls += 1;
          return { status: 200, json: async () => ({
            id: deployId,
            status: polls <= 26 ? "update_in_progress" : "live",
            image: { ref: inputs.imageUrl },
          }) };
        }
        if (url.includes("/deploy/")) {
          return { status: 200, json: async () => ({ deploy: { id: deployId } }) };
        }
        return { status: 200, json: async () => service };
      },
    })).resolves.toBe(true);
    expect(polls).toBe(27);
    expect(waits).toBe(26);
  });

  it("fails closed after the bounded 20-minute polling budget", async () => {
    const deployId = "dep-synthetic123";
    let polls = 0;
    let waits = 0;
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      waitForNextPoll: async () => { waits += 1; },
      fetchService: async (url: string) => {
        if (url.includes("/deploys/")) {
          polls += 1;
          return { status: 200, json: async () => ({
            id: deployId, status: "update_in_progress", image: { ref: inputs.imageUrl },
          }) };
        }
        if (url.includes("/deploy/")) {
          return { status: 200, json: async () => ({ deploy: { id: deployId } }) };
        }
        return { status: 200, json: async () => service };
      },
    })).rejects.toThrow(/bounded confirmation window/);
    expect(polls).toBe(120);
    expect(waits).toBe(119);
  });

  it.each([
    { firstStatus: 429, retryAfter: "12", delay: 12000 },
    { firstStatus: 503, retryAfter: null, delay: 10000 },
  ])("retries HTTP $firstStatus and verifies the same deploy ID", async ({ firstStatus, retryAfter, delay }) => {
    const deployId = "dep-synthetic123";
    let polls = 0;
    const waits: number[] = [];
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      waitForNextPoll: async (ms) => { waits.push(ms); },
      fetchService: async (url: string) => {
        if (url.includes("/deploys/")) {
          polls += 1;
          if (polls === 1) {
            return {
              status: firstStatus,
              headers: { get: () => retryAfter },
              json: async () => ({}),
            };
          }
          return { status: 200, json: async () => ({
            id: deployId, status: "live", image: { ref: inputs.imageUrl },
          }) };
        }
        if (url.includes("/deploy/")) {
          return { status: 200, json: async () => ({ deploy: { id: deployId } }) };
        }
        return { status: 200, json: async () => service };
      },
    })).resolves.toBe(true);
    expect(polls).toBe(2);
    expect(waits).toEqual([delay]);
  });

  it("retries a transient deploy-lookup connection error without retriggering the hook", async () => {
    const deployId = "dep-synthetic123";
    let calls = 0;
    let hookCalls = 0;
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      waitForNextPoll: async () => {},
      fetchService: async (url: string) => {
        if (url.includes("/deploys/")) {
          calls += 1;
          if (calls === 1) throw new Error("synthetic temporary disconnect");
          return { status: 200, json: async () => ({
            id: deployId, status: "live", image: { ref: inputs.imageUrl },
          }) };
        }
        if (url.includes("/deploy/")) {
          hookCalls += 1;
          return { status: 200, json: async () => ({ deploy: { id: deployId } }) };
        }
        return { status: 200, json: async () => service };
      },
    })).resolves.toBe(true);
    expect(calls).toBe(2);
    expect(hookCalls).toBe(1);
  });

  it.each([
    { ref: inputs.imageUrl, sha: "b".repeat(64) },
    { ref: `${imageRepo}@sha256:${"b".repeat(64)}`, sha: "a".repeat(64) },
  ])("rejects contradictory image.ref and image.sha metadata", async ({ ref, sha }) => {
    const deployId = "dep-synthetic123";
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      fetchService: async (url: string) => {
        if (url.includes("/deploys/")) {
          return { status: 200, json: async () => ({
            id: deployId, status: "live", image: { ref, sha },
          }) };
        }
        if (url.includes("/deploy/")) {
          return { status: 200, json: async () => ({ deploy: { id: deployId } }) };
        }
        return { status: 200, json: async () => service };
      },
    })).rejects.toThrow(/does not match approved image digest/);
  });

  it("accepts consistent image.ref and resolved SHA metadata", async () => {
    const deployId = "dep-synthetic123";
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      fetchService: async (url: string) => {
        if (url.includes("/deploys/")) {
          return { status: 200, json: async () => ({
            id: deployId, status: "live", image: {
              ref: inputs.imageUrl, sha: `sha256:${"a".repeat(64)}`,
            },
          }) };
        }
        if (url.includes("/deploy/")) {
          return { status: 200, json: async () => ({ deploy: { id: deployId } }) };
        }
        return { status: 200, json: async () => service };
      },
    })).resolves.toBe(true);
  });

});
