"use strict";

// Post-deploy convergence guard for the image-backed Render service.
//
// Why this exists: the deployment guard (verify-render-image-target-536.cjs)
// reads Render's service metadata and then makes a separate authenticated
// POST /deploys request. It verifies the request-specific deployment ID and
// waits for that deployment to become live, but two HTTP calls still cannot be
// one transaction. This guard adds a final service-level postcondition:
//
//   * every poll re-validates service identity and configuration, so a service
//     mutated between the preflight read and the deploy request (or during the
//     rollout) is detected instead of trusted;
//   * the deployment is content-addressed by digest, so repeating it can never
//     promote different bytes;
//   * success requires both the deploy-specific proof and this final service
//     metadata reading to report the exact requested immutable image. Any other
//     digest, unknown shape, or timeout fails closed.
//
// What it does NOT claim: this is convergence verification, not atomicity. A
// mutation landing between the preflight GET and POST /deploys is still
// possible; it is detected by the guards, not prevented. Never describe this
// file as making the release path atomic.
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

function registeredImageRepo(value) {
  if (typeof value !== "string") return false;
  return value === IMAGE_REPOSITORY ||
    (value.startsWith(IMAGE_REPOSITORY + ":") &&
      /^[^/]+$/.test(value.slice(IMAGE_REPOSITORY.length + 1))) ||
    IMAGE_DIGEST.test(value);
}

function approvedServiceImagePath(service, { approvedServiceId }) {
  if (!service || typeof service !== "object") return null;
  if (service.id !== approvedServiceId || service.type !== "web_service") return null;
  if (!service.serviceDetails || service.serviceDetails.runtime !== "image") return null;

  // Render may expose either current or legacy auto-deploy metadata. Missing,
  // enabled, or contradictory values all fail closed.
  const hasTrigger = Object.prototype.hasOwnProperty.call(
    service,
    "autoDeployTrigger",
  );
  const hasLegacy = Object.prototype.hasOwnProperty.call(service, "autoDeploy");
  if (
    (!hasTrigger && !hasLegacy) ||
    (hasTrigger && service.autoDeployTrigger !== "off") ||
    (hasLegacy && service.autoDeploy !== "no")
  ) {
    return null;
  }

  // Match the pre-deploy guard: accept either documented imagePath location,
  // but never choose between contradictory values.
  const topLevelImagePath = service.imagePath;
  const detailsImagePath = service.serviceDetails.imagePath;
  if (
    topLevelImagePath !== undefined &&
    detailsImagePath !== undefined &&
    topLevelImagePath !== detailsImagePath
  ) {
    return null;
  }
  const imagePath = detailsImagePath ?? topLevelImagePath;
  return registeredImageRepo(imagePath) ? imagePath : null;
}

/** Pure: does the live service still look like the approved image-backed target? */
function renderImageServiceIsApproved(service, request) {
  return approvedServiceImagePath(service, request) !== null;
}

/** Pure: "converged" only on exact digest equality; a mutable tag never proves it. */
function renderImageConvergenceState(service, request) {
  const imagePath = approvedServiceImagePath(service, request);
  if (imagePath === null) return "unsafe";
  if (imagePath === request.imageUrl) return "converged";
  if (IMAGE_DIGEST.test(imagePath)) return "diverged";
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
      requestTimeoutMs: Math.max(1, Math.min(15000, timeoutMs > 0 ? timeoutMs : 1)),
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
    const remainingMs = deadline - now();
    if (attempts >= MAX_ATTEMPTS || remainingMs <= 0) {
      return { status: "pending", attempts };
    }
    await sleep(Math.min(intervalMs, remainingMs));
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
