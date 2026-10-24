import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const guard = require("../../scripts/security/verify-render-image-convergence-536.cjs") as {
  DEFAULT_INTERVAL_MS: number;
  DEFAULT_TIMEOUT_MS: number;
  MAX_ATTEMPTS: number;
  assertRenderImageConvergence: (args: ConvergenceArgs) => Promise<{
    status: string;
    attempts: number;
  }>;
  renderImageConvergenceState: (
    service: unknown,
    request: { approvedServiceId: string; imageUrl: string },
  ) => "converged" | "diverged" | "pending" | "unsafe";
  renderImageServiceIsApproved: (
    service: unknown,
    request: { approvedServiceId: string },
  ) => boolean;
  waitForRenderImageConvergence: (args: ConvergenceArgs) => Promise<{
    status: string;
    attempts: number;
  }>;
};

type ConvergenceArgs = {
  approvedServiceId?: string;
  apiKey?: string;
  imageUrl?: string;
  fetchService?: (...args: unknown[]) => Promise<unknown>;
  sleep?: (ms: number) => Promise<unknown>;
  now?: () => number;
  timeoutMs?: number;
  intervalMs?: number;
};

const serviceId = "srv-syntheticconvergence1";
const approvedDigest = "ghcr.io/arcana-academy/academiaarcana@sha256:" + "b".repeat(64);
const otherDigest = "ghcr.io/arcana-academy/academiaarcana@sha256:" + "c".repeat(64);

function serviceWith(imagePath: string, overrides: Record<string, unknown> = {}) {
  return {
    id: serviceId,
    imagePath,
    autoDeployTrigger: "off",
    serviceDetails: { runtime: "image" },
    ...overrides,
  };
}

/** A Render API stand-in that returns each queued reading in turn, then repeats the last. */
function reader(...readings: unknown[]) {
  let index = 0;
  return vi.fn(async () => {
    const value = readings[Math.min(index, readings.length - 1)];
    index += 1;
    return { status: 200, json: async () => value };
  });
}

function args(overrides: ConvergenceArgs = {}): ConvergenceArgs {
  return {
    approvedServiceId: serviceId,
    apiKey: "synthetic-never-print-read-api-key",
    imageUrl: approvedDigest,
    intervalMs: 1000,
    timeoutMs: 60000,
    sleep: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("Render image convergence (read-only, synthetic)", () => {
  it("declares convergence only when the service reports exactly the approved digest", async () => {
    const fetchService = reader(serviceWith(approvedDigest));

    const result = await guard.waitForRenderImageConvergence(args({ fetchService }));

    expect(result).toEqual({ status: "converged", attempts: 1 });
    expect(fetchService).toHaveBeenCalledTimes(1);
  });

  it("waits through a mutable tag and converges once the digest appears", async () => {
    const fetchService = reader(
      serviceWith("ghcr.io/arcana-academy/academiaarcana:main"),
      serviceWith("ghcr.io/arcana-academy/academiaarcana:main"),
      serviceWith(approvedDigest),
    );

    const result = await guard.waitForRenderImageConvergence(args({ fetchService }));

    expect(result).toEqual({ status: "converged", attempts: 3 });
  });

  it("reports pending without claiming success when the bounded wait expires on a tag", async () => {
    const fetchService = reader(serviceWith("ghcr.io/arcana-academy/academiaarcana:main"));
    let clock = 0;

    const result = await guard.waitForRenderImageConvergence(
      args({
        fetchService,
        // The clock advances past the deadline after the first read.
        now: () => (clock += 61000),
      }),
    );

    expect(result.status).toBe("pending");
    await expect(guard.assertRenderImageConvergence(args({ fetchService }))).rejects.toThrow(
      /did not converge/i,
    );
  });

  it("fails closed immediately when a different digest is serving", async () => {
    const fetchService = reader(serviceWith(otherDigest));

    await expect(
      guard.waitForRenderImageConvergence(args({ fetchService })),
    ).rejects.toThrow(/different image digest/i);
    expect(fetchService).toHaveBeenCalledTimes(1);
  });

  it("treats a service that stopped being the approved image target as unsafe", async () => {
    for (const mutated of [
      serviceWith(approvedDigest, { autoDeployTrigger: "on" }),
      serviceWith(approvedDigest, { serviceDetails: { runtime: "node" } }),
      serviceWith(approvedDigest, { id: "srv-anotherservice" }),
      serviceWith("docker.io/library/nginx@sha256:" + "d".repeat(64)),
      serviceWith(approvedDigest, { imagePath: undefined }),
    ]) {
      const fetchService = reader(mutated);
      await expect(
        guard.waitForRenderImageConvergence(args({ fetchService })),
      ).rejects.toThrow(/no longer matches the approved image-backed target/i);
    }
  });

  it("detects a service mutated between the preflight read and the deploy request", async () => {
    // First reading is the approved target, second is the same service with
    // auto-deploy enabled mid-rollout: the postcondition must not pass.
    const fetchService = reader(
      serviceWith("ghcr.io/arcana-academy/academiaarcana:main"),
      serviceWith(approvedDigest, { autoDeployTrigger: "on" }),
    );

    await expect(
      guard.waitForRenderImageConvergence(args({ fetchService })),
    ).rejects.toThrow(/no longer matches/i);
    expect(fetchService).toHaveBeenCalledTimes(2);
  });

  it("refuses to run without a read-only credential, approved service or digest", async () => {
    const fetchService = reader(serviceWith(approvedDigest));

    await expect(
      guard.waitForRenderImageConvergence(args({ fetchService, apiKey: "  " })),
    ).rejects.toThrow(/read-only service API credential/i);
    await expect(
      guard.waitForRenderImageConvergence(args({ fetchService, approvedServiceId: "srv-NotValid" })),
    ).rejects.toThrow(/approved image service ID/i);
    await expect(
      guard.waitForRenderImageConvergence(
        args({ fetchService, imageUrl: "ghcr.io/arcana-academy/academiaarcana:main" }),
      ),
    ).rejects.toThrow(/immutable image digest/i);
    expect(fetchService).not.toHaveBeenCalled();
  });

  it("fails closed on transport failure, non-200 and unparseable metadata", async () => {
    await expect(
      guard.waitForRenderImageConvergence(
        args({ fetchService: vi.fn(async () => { throw new Error("ECONNRESET"); }) }),
      ),
    ).rejects.toThrow(/cannot read render service metadata/i);

    await expect(
      guard.waitForRenderImageConvergence(
        args({ fetchService: vi.fn(async () => ({ status: 500, json: async () => ({}) })) }),
      ),
    ).rejects.toThrow(/did not return HTTP 200/i);

    await expect(
      guard.waitForRenderImageConvergence(
        args({
          fetchService: vi.fn(async () => ({
            status: 200,
            json: async () => { throw new Error("not json"); },
          })),
        }),
      ),
    ).rejects.toThrow(/metadata is invalid/i);
  });

  it("never authenticates the request with a token in the URL", async () => {
    const fetchService = reader(serviceWith(approvedDigest));

    await guard.waitForRenderImageConvergence(args({ fetchService }));

    const [url, init] = fetchService.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.render.com/v1/services/" + serviceId);
    expect(String(url)).not.toMatch(/key=|token=/i);
    expect((init.headers as Record<string, string>).Authorization).toMatch(/^Bearer /);
    expect(init.redirect).toBe("error");
  });

  it("is bounded even if the service never converges", async () => {
    const fetchService = reader(serviceWith("ghcr.io/arcana-academy/academiaarcana:main"));
    // A clock that never advances must still stop at the attempt ceiling.
    const result = await guard.waitForRenderImageConvergence(
      args({ fetchService, now: () => 0, timeoutMs: 60000, intervalMs: 0 }),
    );

    expect(result.status).toBe("pending");
    expect(result.attempts).toBe(guard.MAX_ATTEMPTS);
    expect(fetchService).toHaveBeenCalledTimes(guard.MAX_ATTEMPTS);
  });

  it("classifies states without touching the network", () => {
    const request = { approvedServiceId: serviceId, imageUrl: approvedDigest };

    expect(guard.renderImageConvergenceState(serviceWith(approvedDigest), request)).toBe(
      "converged",
    );
    expect(guard.renderImageConvergenceState(serviceWith(otherDigest), request)).toBe("diverged");
    expect(
      guard.renderImageConvergenceState(serviceWith("ghcr.io/arcana-academy/academiaarcana:main"), request),
    ).toBe("pending");
    expect(guard.renderImageConvergenceState(serviceWith(approvedDigest, { autoDeployTrigger: "on" }), request)).toBe(
      "unsafe",
    );
    expect(guard.renderImageServiceIsApproved(null, request)).toBe(false);
    expect(guard.renderImageServiceIsApproved(serviceWith(approvedDigest), request)).toBe(true);
  });
});

describe("image release workflow contract", () => {
  const workflow = readFileSync(
    resolve(process.cwd(), ".github/workflows/image-release.yml"),
    "utf8",
  ).replaceAll("\r\n", "\n");

  it("fetches the guard before the irreversible call and verifies convergence before the smoke artifact", () => {
    const guardFetch = workflow.indexOf("name: Fetch convergence guard from approved main SHA");
    const deployRequest = workflow.indexOf("name: Request deployment of the immutable image");
    const convergence = workflow.indexOf("name: Verify the service converged to the approved image digest");
    const smokeArtifact = workflow.indexOf("name: Upload requested production revision for smoke verification");

    // An unavailable guard must block before the deploy hook is called, not after.
    expect(guardFetch).toBeGreaterThan(-1);
    expect(guardFetch).toBeLessThan(deployRequest);
    expect(convergence).toBeGreaterThan(deployRequest);
    expect(smokeArtifact).toBeGreaterThan(convergence);
  });

  it("runs the convergence guard as a hard gate with the read-only credential", () => {
    const convergenceStep = workflow.slice(
      workflow.indexOf("name: Verify the service converged to the approved image digest"),
      workflow.indexOf("name: Upload requested production revision for smoke verification"),
    );

    expect(convergenceStep).toContain("node /tmp/aa-render-image-convergence-guard.cjs");
    expect(convergenceStep).toContain("RENDER_SERVICE_READ_API_KEY: ${{ secrets.RENDER_SERVICE_READ_API_KEY }}");
    expect(convergenceStep).toContain("RENDER_IMAGE_SERVICE_ID: ${{ vars.RENDER_IMAGE_SERVICE_ID }}");
    expect(convergenceStep).toContain("IMAGE_URL: ${{ needs.publish.outputs.image_url }}");
    expect(convergenceStep).toContain("set -euo pipefail");
    expect(convergenceStep).not.toContain("continue-on-error");
    // The step may never fall back to a mutable tag reference.
    expect(convergenceStep).not.toMatch(/imageUrl:\s*ghcr\.io\/[^@\s]+:/);
  });

  it("fetches the convergence guard from the approved immutable revision", () => {
    expect(workflow).toContain(
      "https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${EXPECTED_REVISION}/scripts/security/verify-render-image-convergence-536.cjs",
    );
    expect(workflow).toMatch(/curl --fail --silent --show-error --proto '=https' --tlsv1\.2 --max-redirs 0/);
  });

  it("keeps the deploy job fail-closed and approval-gated", () => {
    expect(workflow).toContain("vars.RENDER_IMAGE_DEPLOY_ENABLED == 'true'");
    expect(workflow).toContain("vars.RENDER_DEPLOY_APPROVED_RUN_ID == format('{0}', github.run_id)");
    expect(workflow).toContain("github.run_attempt == 1");
    expect(workflow).toContain("environment:\n      name: render-production-approval");
    expect(workflow).not.toContain("continue-on-error");
    // A digest is required before the hook is called at all.
    expect(workflow).toContain("Deployment requires an immutable GHCR image digest.");
  });
});
