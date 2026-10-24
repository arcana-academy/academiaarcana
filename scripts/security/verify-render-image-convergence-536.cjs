"use strict";

// Post-deploy convergence guard for the image-backed Render service.
//
// Why this exists: the preflight guard (verify-render-image-target-536.cjs)
// reads Render's service metadata and then a *separate* request posts the
// deploy hook. Two calls cannot be one transaction, so that pair is NOT
// atomic. This guard closes the part of that gap which is closable without a
// transactional Render API:
//
//   * every poll re-validates the service identity and configuration, so a
//     service mutated between the preflight read and the hook request (or
//     during the rollout) is detected instead of trusted;
//   * the deployment is content-addressed by digest, so repeating it can never
//     promote different bytes;
//   * success is never inferred from the hook response. It is declared only
//     after the service reports exactly the requested immutable image, and any
//     other digest, any unknown shape and any timeout fail closed.
//
// What it does NOT claim: this is convergence verification, not atomicity. A
// mutation landing between the preflight GET and the hook POST is still
// possible; it is detected here, not prevented. Never describe this file as
// making the release path atomic.
const IMAGE_REPOSITORY = "ghcr.io/arcana-academy/academiaarcana";
const IMAGE_DIGEST = /^ghcr\.io\/arcana-academy\/academiaarcana@sha256:[a-f0-9]{64}$/;
const SERVICE_ID = /^srv-[a-z0-9]+$/;

const DEFAULT_TIMEOUT_MS = 180000;
const DEFAULT_INTERVAL_MS = 5000;
const MAX_ATTEMPTS = 120;

function assertRequest(inputs) {
  const { approvedServiceId, apiKey, imageUrl } = inputs || {};
  if (typeof approvedServiceId !== "string" || !SERVICE_ID.test(approvedServiceId)) {
    throw new Error("Render convergence check requires the approved image service ID.");
  }
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw new Error("Render convergence check requires a read-only service API credential.");
  }
  if (typeof imageUrl !== "string" || !IMAGE_DIGEST.test(imageUrl)) {
    throw new Error("Render convergence proof requires an exact immutable image digest.");
  }
  return { approvedServiceId, apiKey, imageUrl };
}

function boundedDuration(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("Render convergence timing must be a non-negative number of milliseconds.");
  }
  return value;
}

/** Pure: does the live service still look like the approved image-backed target? */
function renderImageServiceIsApproved(service, { approvedServiceId }) {
  if (!service || typeof service !== "object") return false;
  if (service.id !== approvedServiceId) return false;
  if (service.serviceDetails?.runtime !== "image") return false;
  if (service.autoDeployTrigger !== "off") return false;
  const imagePath = service.imagePath;
  if (typeof imagePath !== "string") return false;
  return (
    imagePath === IMAGE_REPOSITORY ||
    imagePath.startsWith(IMAGE_REPOSITORY + ":") ||
    IMAGE_DIGEST.test(imagePath)
  );
}

/** Pure: "converged" only on exact digest equality; a mutable tag never proves it. */
function renderImageConvergenceState(service, request) {
  if (!renderImageServiceIsApproved(service, request)) return "unsafe";
  if (service.imagePath === request.imageUrl) return "converged";
  if (IMAGE_DIGEST.test(service.imagePath)) return "diverged";
  return "pending";
}

async function readRenderService({ approvedServiceId, apiKey, fetchService, requestTimeoutMs }) {
  let response;
  try {
    response = await fetchService("https://api.render.com/v1/services/" + approvedServiceId, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: "Bearer " + apiKey },
      redirect: "error",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch {
    throw new Error("Cannot read Render service metadata; refusing to claim convergence.");
  }
  if (!response || response.status !== 200) {
    throw new Error("Render service metadata did not return HTTP 200; refusing to claim convergence.");
  }
  let service;
  try {
    service = await response.json();
  } catch {
    throw new Error("Render service metadata is invalid; refusing to claim convergence.");
  }
  return service;
}

/**
 * Polls the read-only Render API until the service image equals the approved
 * digest.
 *
 * Resolves `{ status: "converged", attempts }` only on exact equality. Returns
 * `{ status: "pending", attempts }` when the bounded wait expires without
 * proof. Throws when the caller's inputs are invalid, when the service cannot
 * be read, or as soon as the service stops being the approved target or starts
 * reporting a different digest — an unexpected digest is never treated as
 * "still rolling out".
 *
 * @param {{approvedServiceId: string, apiKey: string, imageUrl: string,
 *   fetchService?: typeof fetch, sleep?: (ms: number) => Promise<unknown>,
 *   now?: () => number, timeoutMs?: number, intervalMs?: number}} inputs
 */
async function waitForRenderImageConvergence(inputs) {
  const request = assertRequest(inputs);
  const fetchService = inputs.fetchService || fetch;
  const sleep = inputs.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const now = inputs.now || (() => Date.now());
  const timeoutMs = boundedDuration(inputs.timeoutMs, DEFAULT_TIMEOUT_MS);
  const intervalMs = boundedDuration(inputs.intervalMs, DEFAULT_INTERVAL_MS);
  const deadline = now() + timeoutMs;

  for (let attempts = 1; ; attempts += 1) {
    const service = await readRenderService({
      approvedServiceId: request.approvedServiceId,
      apiKey: request.apiKey,
      fetchService,
      requestTimeoutMs: Math.max(1, Math.min(15000, timeoutMs || 15000)),
    });
    const state = renderImageConvergenceState(service, request);

    if (state === "converged") return { status: "converged", attempts };
    if (state === "unsafe") {
      throw new Error(
        "Render service no longer matches the approved image-backed target; refusing to claim convergence.",
      );
    }
    if (state === "diverged") {
      throw new Error(
        "Render service reports a different image digest than the approved release; refusing to claim convergence.",
      );
    }
    if (attempts >= MAX_ATTEMPTS || now() >= deadline) {
      return { status: "pending", attempts };
    }
    await sleep(intervalMs);
  }
}

/** Workflow-facing wrapper: resolves only on proven convergence. */
async function assertRenderImageConvergence(inputs) {
  const result = await waitForRenderImageConvergence(inputs);
  if (result.status !== "converged") {
    throw new Error(
      "Render did not converge to the approved image digest within the bounded wait; deployment stays unverified.",
    );
  }
  return result;
}

module.exports = {
  DEFAULT_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  assertRenderImageConvergence,
  renderImageConvergenceState,
  renderImageServiceIsApproved,
  waitForRenderImageConvergence,
};

if (require.main === module) {
  const timeoutEnv = process.env.RENDER_CONVERGENCE_TIMEOUT_MS;
  const intervalEnv = process.env.RENDER_CONVERGENCE_INTERVAL_MS;
  assertRenderImageConvergence({
    approvedServiceId: process.env.RENDER_IMAGE_SERVICE_ID,
    apiKey: process.env.RENDER_SERVICE_READ_API_KEY,
    imageUrl: process.env.IMAGE_URL,
    timeoutMs: timeoutEnv ? Number(timeoutEnv) : undefined,
    intervalMs: intervalEnv ? Number(intervalEnv) : undefined,
  })
    .then((result) => {
      process.stdout.write(
        "Render image convergence verification: PASS (attempts " + result.attempts + ")\n",
      );
    })
    .catch((error) => {
      // Errors intentionally contain no hooks, tokens, API payloads or digests.
      process.stderr.write(error.message + "\n");
      process.exitCode = 1;
    });
}
