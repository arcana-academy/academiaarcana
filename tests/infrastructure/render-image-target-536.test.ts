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
  deployApiKey: string;
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
  deployApiKey: "synthetic-deploy-api-key",
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

  it("refuses the deploy API when a freshly read nested image path changes", async () => {
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


  // The Render Deploy API returns a top-level deployment ID for HTTP 201.
  // It must never infer an identity from a matching concurrent deployment.
  const serviceURL = "https://api.render.com/v1/services/" + id;
  const deployURL = serviceURL + "/deploys";
  const deployId = "dep-synthetic123";
  const approvedAck = () => ({
    id: deployId, trigger: "api", status: "created",
    image: { ref: inputs.imageUrl },
  });
  const reply = (status: number, data: unknown, retryAfter?: string) => ({
    status,
    json: async () => data,
    headers: { get: () => retryAfter ?? null },
  });
  function stub(config: {
    createStatus?: number;
    createData?: unknown;
    createError?: boolean;
    serviceData?: Target;
    poll?: (deployId: string, attempt: number) => ReturnType<typeof reply> | Promise<ReturnType<typeof reply>>;
  } = {}) {
    const calls: Array<{ url: string; options?: RequestInit }> = [];
    let polls = 0;
    const fetchService = async (url: string, options?: RequestInit) => {
      calls.push({ url, options });
      if (url === serviceURL) {
        return reply(200, config.serviceData ?? service);
      }
      if (url === deployURL) {
        if (options?.method !== "POST") throw new Error("Expected authenticated POST");
        if (config.createError) throw new Error("Synthetic network disconnect after POST");
        return reply(config.createStatus ?? 201,
          Object.prototype.hasOwnProperty.call(config, "createData")
            ? config.createData : approvedAck());
      }
      if (url.startsWith(deployURL + "/")) {
        polls += 1;
        const polledId = url.slice((deployURL + "/").length);
        return config.poll
          ? await config.poll(polledId, polls)
          : reply(200, { id: polledId, status: "live", image: { ref: inputs.imageUrl } });
      }
      throw new Error("Unexpected Render endpoint");
    };
    return { calls, fetchService, get polls() { return polls; } };
  }

  it("creates exactly one API deployment, validates HTTP 201 and confirms its own ID", async () => {
    const m = stub();
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs, fetchService: m.fetchService,
    })).resolves.toBe(true);
    expect(m.calls.map(c => c.url)).toEqual([serviceURL, deployURL, deployURL + "/" + deployId]);
    expect(m.calls[0].options?.method).toBe("GET");
    expect(m.calls[0].options?.headers).toMatchObject({
      Authorization: "Bearer synthetic-read-api-key",
    });
    expect(m.calls[1].options?.method).toBe("POST");
    expect(m.calls[1].options?.headers).toMatchObject({
      Authorization: "Bearer synthetic-deploy-api-key",
      Accept: "application/json",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(m.calls[1].options?.body))).toEqual({
      imageUrl: inputs.imageUrl, clearCache: "do_not_clear",
    });
    expect(m.calls[2].options?.headers).toMatchObject({
      Authorization: "Bearer synthetic-read-api-key",
    });
    expect(m.calls.every(c => !c.url.includes("/deploy/" + id))).toBe(true);
  });

  it("refuses any API call when the separately approved write credential is missing", async () => {
    const m = stub();
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs, deployApiKey: "", fetchService: m.fetchService,
    })).rejects.toThrow(/credential is missing/);
    expect(m.calls).toHaveLength(0);
  });

  it("refuses POST when fresh image-backed target validation fails", async () => {
    const m = stub({ serviceData: { ...service, imagePath: "docker.io/unapproved/image" } });
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs, fetchService: m.fetchService,
    })).rejects.toThrow(/approved GHCR/);
    expect(m.calls.map(c => c.url)).toEqual([serviceURL]);
  });

  it("does not confuse concurrent identical-image API deploys with distinct returned IDs", async () => {
    const otherId = "dep-otheractor123";
    const a = stub({
      createData: { id: deployId, trigger: "api", image: { ref: inputs.imageUrl } },
      poll: async polledId => reply(200, {
        id: polledId, status: "live", image: { ref: inputs.imageUrl },
      }),
    });
    const b = stub({
      createData: { id: otherId, trigger: "api", image: { ref: inputs.imageUrl } },
      poll: async polledId => reply(200, {
        id: polledId, status: "live", image: { ref: inputs.imageUrl },
      }),
    });
    await expect(Promise.all([
      requestVerifiedRenderImageDeployment({ ...inputs, fetchService: a.fetchService }),
      requestVerifiedRenderImageDeployment({ ...inputs, fetchService: b.fetchService }),
    ])).resolves.toEqual([true, true]);
    expect(a.calls.map(x => x.url)).toEqual([serviceURL, deployURL, deployURL + "/" + deployId]);
    expect(b.calls.map(x => x.url)).toEqual([serviceURL, deployURL, deployURL + "/" + otherId]);
  });

  it("never adopts a different deploy ID even with identical digest", async () => {
    const m = stub({ poll: async () => reply(200, {
      id: "dep-otheractor123", status: "live", image: { ref: inputs.imageUrl },
    }) });
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs, fetchService: m.fetchService,
    })).rejects.toThrow(/different deployment ID/);
    expect(m.calls.filter(c => c.options?.method === "POST")).toHaveLength(1);
  });

  it("treats HTTP 202 as an indeterminate accepted deployment with no retry or lookup-by-time", async () => {
    const m = stub({ createStatus: 202, createData: null });
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs, fetchService: m.fetchService,
    })).rejects.toThrow(/HTTP 202.*manual reconciliation required. Do not retry/);
    expect(m.calls.map(c => c.url)).toEqual([serviceURL, deployURL]);
  });

  it("does not retry a POST on a network disconnect with possibly accepted deploy", async () => {
    const m = stub({ createError: true });
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs, fetchService: m.fetchService,
    })).rejects.toThrow(/outcome unknown.*manual reconciliation required. Do not retry/);
    expect(m.calls.map(c => c.url)).toEqual([serviceURL, deployURL]);
  });

  it.each([200, 400, 401, 409, 429, 500])(
    "rejects creation HTTP %i and does not retry the write",
    async status => {
      const m = stub({ createStatus: status });
      await expect(requestVerifiedRenderImageDeployment({
        ...inputs, fetchService: m.fetchService,
      })).rejects.toThrow(/did not return HTTP 201/);
      expect(m.calls.map(c => c.url)).toEqual([serviceURL, deployURL]);
    },
  );

  it.each([
    { name: "missing", value: { trigger: "api", image: { ref: inputs.imageUrl } } },
    { name: "malformed", value: { id: "not-a-deploy-id", trigger: "api", image: { ref: inputs.imageUrl } } },
    { name: "wrong trigger", value: { id: deployId, trigger: "deploy_hook", image: { ref: inputs.imageUrl } } },
    { name: "wrong digest", value: { id: deployId, trigger: "api", image: { ref: imageRepo + "@sha256:" + "b".repeat(64) } } },
    { name: "missing image", value: { id: deployId, trigger: "api" } },
  ])("rejects HTTP 201 with $name identity evidence", async ({ value }) => {
    const m = stub({ createData: value });
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs, fetchService: m.fetchService,
    })).rejects.toThrow(/did not prove a unique approved deploy identity/);
    expect(m.calls.map(c => c.url)).toEqual([serviceURL, deployURL]);
  });

  it("rejects malformed JSON after 201, without issuing another write", async () => {
    const urls: string[] = [];
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs,
      fetchService: async (url: string) => {
        urls.push(url);
        if (url === serviceURL) return reply(200, service);
        if (url === deployURL) return { status: 201, json: async () => { throw new Error("bad JSON"); } };
        throw new Error("Unexpected URL");
      },
    })).rejects.toThrow(/invalid deployment identity; do not retry/);
    expect(urls).toEqual([serviceURL, deployURL]);
  });

  it("waits for its exact deploy to become live, ignoring older live image aliases", async () => {
    let count = 0;
    const m = stub({
      poll: async polledId => reply(200, {
        id: polledId, status: ++count === 1 ? "queued" : "live",
        image: { ref: inputs.imageUrl },
      }),
    });
    const waits: number[] = [];
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs, fetchService: m.fetchService,
      waitForNextPoll: async delay => { waits.push(delay); },
    })).resolves.toBe(true);
    expect(m.polls).toBe(2);
    expect(waits).toEqual([10000]);
  });

  it.each(["canceled", "build_failed", "update_failed", "pre_deploy_failed"])(
    "rejects exact deploy with terminal failure %s", async status => {
      const m = stub({ poll: async polledId => reply(200, {
        id: polledId, status, image: { ref: inputs.imageUrl },
      }) });
      await expect(requestVerifiedRenderImageDeployment({
        ...inputs, fetchService: m.fetchService,
      })).rejects.toThrow(/failed or was canceled/);
    },
  );

  it.each([
    { ref: imageRepo + "@sha256:" + "b".repeat(64) },
    { ref: inputs.imageUrl, sha: "b".repeat(64) },
  ])("rejects contradictory or foreign image digest on its exact deploy", async image => {
    const m = stub({ poll: async polledId => reply(200, {
      id: polledId, status: "live", image,
    }) });
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs, fetchService: m.fetchService,
    })).rejects.toThrow(/does not match approved image digest/);
  });

  it("accepts same ref and resolved SHA only for the returned deploy ID", async () => {
    const m = stub({ poll: async polledId => reply(200, {
      id: polledId, status: "live",
      image: { ref: inputs.imageUrl, sha: "sha256:" + "a".repeat(64) },
    }) });
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs, fetchService: m.fetchService,
    })).resolves.toBe(true);
  });

  it("retries transient GET lookup without repeating the deploy POST", async () => {
    const waits: number[] = [];
    const m = stub({ poll: async (polledId, attempt) => attempt === 1
      ? reply(429, {}, "12")
      : reply(200, { id: polledId, status: "live", image: { ref: inputs.imageUrl } }),
    });
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs, fetchService: m.fetchService,
      waitForNextPoll: async delay => { waits.push(delay); },
    })).resolves.toBe(true);
    expect(waits).toEqual([12000]);
    expect(m.polls).toBe(2);
    expect(m.calls.filter(c => c.options?.method === "POST")).toHaveLength(1);
  });

  it("rejects permanent GET errors for the returned ID", async () => {
    const m = stub({ poll: async () => reply(401, {}) });
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs, fetchService: m.fetchService,
    })).rejects.toThrow(/deploy lookup failed/);
    expect(m.calls.filter(c => c.options?.method === "POST")).toHaveLength(1);
  });

  it("keeps polling a legitimate deployment beyond the old four-minute cutoff", async () => {
    const m = stub({ poll: async (polledId, attempt) => reply(200, {
      id: polledId, status: attempt <= 26 ? "update_in_progress" : "live",
      image: { ref: inputs.imageUrl },
    }) });
    let waits = 0;
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs, fetchService: m.fetchService,
      waitForNextPoll: async () => { waits += 1; },
    })).resolves.toBe(true);
    expect(m.polls).toBe(27);
    expect(waits).toBe(26);
  });

  it("fails closed after the bounded polling budget without retrying POST", async () => {
    const m = stub({ poll: async polledId => reply(200, {
      id: polledId, status: "update_in_progress",
      image: { ref: inputs.imageUrl },
    }) });
    let waits = 0;
    await expect(requestVerifiedRenderImageDeployment({
      ...inputs, fetchService: m.fetchService,
      waitForNextPoll: async () => { waits += 1; },
    })).rejects.toThrow(/bounded confirmation window/);
    expect(m.polls).toBe(120);
    expect(waits).toBe(119);
    expect(m.calls.filter(c => c.options?.method === "POST")).toHaveLength(1);
  });

});
