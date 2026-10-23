"use strict";

// Fail-closed Render target guard. The deploy hook may only be requested
// by the same operation that just read and verified live service metadata.
// This minimizes TOCTOU exposure; Render does not offer an atomic hook
// precondition tied to the service configuration snapshot.
const IMAGE_REPOSITORY = "ghcr.io/arcana-academy/academiaarcana";
const IMAGE_DIGEST = /^ghcr\.io\/arcana-academy\/academiaarcana@sha256:[a-f0-9]{64}$/;
const SERVICE_ID = /^srv-[a-z0-9]+$/;

function checkedHookServiceId(rawHook) {
  if (!rawHook || typeof rawHook !== "string") {
    throw new Error("Render deploy hook is unavailable; refusing image deployment.");
  }
  let url;
  try { url = new URL(rawHook); } catch {
    throw new Error("Render deploy hook URL is invalid; refusing image deployment.");
  }
  const match = /^\/deploy\/(srv-[a-z0-9]+)\/?$/.exec(url.pathname);
  if (url.protocol !== "https:" || url.hostname !== "api.render.com" ||
      url.port || url.username || url.password || url.hash || !match ||
      url.searchParams.getAll("key").length !== 1 || !url.searchParams.get("key") ||
      [...url.searchParams.keys()].some(name => name !== "key")) {
    throw new Error("Render deploy hook origin, service, or query is unsafe.");
  }
  return match[1];
}

function registeredImageRepo(value) {
  if (typeof value !== "string") return false;
  return value === IMAGE_REPOSITORY ||
    value.startsWith(IMAGE_REPOSITORY + ":") && /^[^/]+$/.test(value.slice(IMAGE_REPOSITORY.length + 1)) ||
    new RegExp("^" + IMAGE_REPOSITORY.replaceAll(".", "\\.") + "@sha256:[a-f0-9]{64}$").test(value);
}

/** Require live authenticated Render metadata, never a caller's asserted kind.
 * @param {{hookUrl:string, approvedServiceId:string, apiKey:string, imageUrl:string,
 * fetchService?:typeof fetch, waitForNextPoll?:(delayMs:number)=>Promise<void>}} inputs
 */
async function verifyRenderImageTarget(inputs) {
  const { hookUrl, approvedServiceId, apiKey, imageUrl, fetchService = fetch } = inputs;
  const hookId = checkedHookServiceId(hookUrl);
  if (typeof approvedServiceId !== "string" || !SERVICE_ID.test(approvedServiceId) ||
      hookId !== approvedServiceId) {
    throw new Error("Render hook target does not match independently approved service ID.");
  }
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw new Error("Read-only Render service API credential is missing.");
  }
  if (typeof imageUrl !== "string" || !IMAGE_DIGEST.test(imageUrl)) {
    throw new Error("Render deployment requires the exact reviewed immutable GHCR image.");
  }
  let response;
  try {
    response = await fetchService("https://api.render.com/v1/services/" + hookId, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: "Bearer " + apiKey },
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("Cannot read Render service metadata; refusing image deployment.");
  }
  if (!response || response.status !== 200) {
    throw new Error("Render service metadata did not return HTTP 200; refusing image deployment.");
  }
  let service;
  try { service = await response.json(); } catch {
    throw new Error("Render service metadata is invalid; refusing image deployment.");
  }
  if (!service || service.id !== hookId || service.type !== "web_service" ||
      service.serviceDetails?.runtime !== "image") {
    throw new Error("Render target is not a verified image-backed service; refusing imgURL.");
  }
  // Render's current API exposes imagePath at the top level; also accept
  // serviceDetails.imagePath when that is the only configured path returned.
  // Contradictory paths must fail closed rather than select either value.
  const topLevelImagePath = service.imagePath;
  const detailsImagePath = service.serviceDetails.imagePath;
  if (topLevelImagePath !== undefined && detailsImagePath !== undefined &&
      topLevelImagePath !== detailsImagePath) {
    throw new Error("Render target reports conflicting image repositories; refusing image deployment.");
  }
  if (!registeredImageRepo(detailsImagePath ?? topLevelImagePath)) {
    throw new Error("Render image-backed target registry/repository is not the approved GHCR image.");
  }
  // Render may return the current autoDeployTrigger or the legacy autoDeploy.
  // A legacy-only response with "no" is safe; any enabled, missing, or
  // contradictory value fails closed.
  const hasTrigger = Object.prototype.hasOwnProperty.call(service, "autoDeployTrigger");
  const hasLegacy = Object.prototype.hasOwnProperty.call(service, "autoDeploy");
  if ((!hasTrigger && !hasLegacy) ||
      (hasTrigger && service.autoDeployTrigger !== "off") ||
      (hasLegacy && service.autoDeploy !== "no")) {
    throw new Error("Render target must keep automatic deployment disabled for controlled release.");
  }
  return true;
}

/** Recheck live Render metadata immediately before requesting this image deploy.
 * Callers must not split this operation into separate CI steps.
 * @param {{hookUrl:string, approvedServiceId:string, apiKey:string, imageUrl:string,
 * fetchService?:typeof fetch, waitForNextPoll?:(delayMs:number)=>Promise<void>}} inputs
 */
async function requestVerifiedRenderImageDeployment(inputs) {
  const fetchService = inputs.fetchService || fetch;
  await verifyRenderImageTarget({ ...inputs, fetchService });

  // Never reuse a hook URL or a preflight result without this fresh API read.
  const hook = new URL(inputs.hookUrl);
  hook.searchParams.set("imgURL", inputs.imageUrl);
  const requestStartedAt = Date.now();
  let response;
  try {
    response = await fetchService(hook.toString(), {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("Render deploy hook request failed; deployment is not confirmed.");
  }
  // A hook HTTP 202 can create an asynchronous deploy without returning its
  // ID. Never mistake that acceptance for a confirmed or canceled deployment.
  // Reconcile against live Render deploy records and require one unambiguous
  // post-request deploy_hook event with the exact immutable image reference.
  // Queued deployment discovery and live confirmation share one time budget.
  const waitForNextPoll = inputs.waitForNextPoll ||
    (delayMs => new Promise(resolve => setTimeout(resolve, delayMs)));
  const deadline = requestStartedAt + 20 * 60 * 1000;
  const pause = async delayMs => {
    if (!Number.isFinite(delayMs) || delayMs < 0 || Date.now() + delayMs > deadline) {
      throw new Error("Render deploy confirmation exceeded the bounded 20-minute window.");
    }
    await waitForNextPoll(delayMs);
  };

  let deployId;
  if (response?.status === 202) {
    const listUrl = "https://api.render.com/v1/services/" + inputs.approvedServiceId +
      "/deploys?createdAfter=" + encodeURIComponent(new Date(requestStartedAt).toISOString()) +
      "&limit=100";
    for (let attempt = 0; attempt < 120 && Date.now() < deadline; attempt++) {
      let listed;
      try {
        listed = await fetchService(listUrl, {
          method: "GET",
          headers: { Accept: "application/json", Authorization: "Bearer " + inputs.apiKey },
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        throw new Error("Cannot reconcile queued Render deployment; rollout is not confirmed.");
      }
      if (!listed || listed.status !== 200) {
        throw new Error("Queued Render deployment lookup failed; rollout is not confirmed.");
      }
      let entries;
      try { entries = await listed.json(); } catch {
        throw new Error("Queued Render deployment lookup returned invalid JSON.");
      }
      // A full page might omit additional new deployments: do not guess.
      if (!Array.isArray(entries) || entries.length >= 100) {
        throw new Error("Queued Render deployment lookup is incomplete or malformed.");
      }
      const newHookDeploys = entries.map(entry => entry?.deploy).filter(deploy =>
        deploy?.trigger === "deploy_hook" &&
        typeof deploy.createdAt === "string" &&
        Date.parse(deploy.createdAt) >= requestStartedAt
      );
      if (newHookDeploys.length > 1) {
        throw new Error("Queued Render deployment identity is ambiguous; rollout is not confirmed.");
      }
      if (newHookDeploys.length === 1) {
        const candidate = newHookDeploys[0];
        if (typeof candidate.id !== "string" || !/^dep-[a-z0-9]+$/.test(candidate.id) ||
            candidate.image?.ref !== inputs.imageUrl) {
          throw new Error("Queued Render deployment is not the uniquely approved image.");
        }
        deployId = candidate.id;
        break;
      }
      if (attempt < 119) await pause(10000);
    }
    if (!deployId) {
      throw new Error("Queued Render deployment ID was not confirmed in the bounded window.");
    }
  } else {
    if (!response || response.status !== 200) {
      throw new Error("Render deploy hook did not accept the request (HTTP 200 required).");
    }
    let started;
    try { started = await response.json(); } catch {
      throw new Error("Render deploy hook returned invalid deployment identity.");
    }
    deployId = started?.deploy?.id;
    if (typeof deployId !== "string" || !/^dep-[a-z0-9]+$/.test(deployId)) {
      throw new Error("Render deploy hook returned no valid deployment ID.");
    }
  }

  // Verify the *specific* new deploy, not the already-live alias or merely
  // the source SHA: a previous deployment of the same SHA may still be live.
  const expectedDigest = inputs.imageUrl.split("@")[1];
  const digestHex = expectedDigest.slice("sha256:".length);
  // 120 polls at 10 seconds apart allow roughly 20 minutes for Render\'s
  // documented 15-minute start-command allowance and rollout overhead.
  // The deploy job is independently bounded at 25 minutes.
  for (let attempt = 0; attempt < 120 && Date.now() < deadline; attempt++) {
    let current;
    try {
      current = await fetchService(
        "https://api.render.com/v1/services/" + inputs.approvedServiceId +
          "/deploys/" + deployId,
        {
          method: "GET",
          headers: { Accept: "application/json", Authorization: "Bearer " + inputs.apiKey },
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        },
      );
    } catch {
      if (attempt === 119) {
        throw new Error("Cannot check Render deployment status; retries exhausted.");
      }
      await pause(10000);
      continue;
    }
    if (!current || current.status !== 200) {
      // Transient Render API throttling/outages are retried after accepting
      // the deploy hook. A nontransient response still fails immediately.
      if (current && [429, 500, 502, 503, 504].includes(current.status) &&
          attempt < 119) {
        const rawRetryAfter = current.headers?.get?.("retry-after");
        let retryMs = 10000;
        if (typeof rawRetryAfter === "string") {
          if (/^[0-9]+$/.test(rawRetryAfter)) {
            retryMs = Math.max(retryMs, Number(rawRetryAfter) * 1000);
          } else {
            const retryDate = Date.parse(rawRetryAfter);
            if (Number.isFinite(retryDate)) {
              retryMs = Math.max(retryMs, retryDate - Date.now());
            }
          }
        }
        await pause(retryMs);
        continue;
      }
      throw new Error("Render deploy lookup failed; rollout is not confirmed.");
    }
    let details;
    try { details = await current.json(); } catch {
      throw new Error("Render deploy lookup returned invalid JSON.");
    }
    if (!details || details.id !== deployId) {
      throw new Error("Render deploy lookup returned a different deployment ID.");
    }
    if (details.status === "live") {
      const image = details.image;
      const hasRef = typeof image?.ref === "string" && image.ref.length > 0;
      const hasSha = typeof image?.sha === "string" && image.sha.length > 0;
      if (!image || (!hasRef && !hasSha) ||
          (hasRef && image.ref !== inputs.imageUrl) ||
          (hasSha && image.sha !== expectedDigest && image.sha !== digestHex)) {
        throw new Error("Live Render deployment does not match approved image digest.");
      }
      return true;
    }
    if (["canceled", "deactivated", "build_failed", "update_failed", "pre_deploy_failed"]
      .includes(details.status)) {
      throw new Error("Render deployment failed or was canceled before becoming live.");
    }
    if (!["created", "queued", "build_in_progress", "update_in_progress",
      "pre_deploy_in_progress"].includes(details.status)) {
      throw new Error("Render deployment returned an unrecognized status.");
    }
    if (attempt < 119) await pause(10000);
  }
  throw new Error("Render deployment did not reach live within the bounded confirmation window.");
}

module.exports = {
  checkedHookServiceId,
  registeredImageRepo,
  verifyRenderImageTarget,
  requestVerifiedRenderImageDeployment,
};

if (require.main === module) {
  requestVerifiedRenderImageDeployment({
    hookUrl: process.env.RENDER_DEPLOY_HOOK_URL,
    approvedServiceId: process.env.RENDER_IMAGE_SERVICE_ID,
    apiKey: process.env.RENDER_SERVICE_READ_API_KEY,
    imageUrl: process.env.IMAGE_URL,
  }).then(() => {
    process.stdout.write("Render image deployment confirmed live after target verification.\n");
  }).catch(error => {
    // Errors intentionally contain no hooks, tokens, API payloads or image digests.
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  });
}
