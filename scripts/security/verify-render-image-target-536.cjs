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
 * fetchService?:typeof fetch}} inputs
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
  if (!registeredImageRepo(service.imagePath)) {
    throw new Error("Render image-backed target registry/repository is not the approved GHCR image.");
  }
  if (service.autoDeployTrigger !== "off") {
    throw new Error("Render target must keep automatic deployment disabled for controlled release.");
  }
  return true;
}

/** Recheck live Render metadata immediately before requesting this image deploy.
 * Callers must not split this operation into separate CI steps.
 * @param {{hookUrl:string, approvedServiceId:string, apiKey:string, imageUrl:string,
 * fetchService?:typeof fetch}} inputs
 */
async function requestVerifiedRenderImageDeployment(inputs) {
  const fetchService = inputs.fetchService || fetch;
  await verifyRenderImageTarget({ ...inputs, fetchService });

  // Never reuse a hook URL or a preflight result without this fresh API read.
  const hook = new URL(inputs.hookUrl);
  hook.searchParams.set("imgURL", inputs.imageUrl);
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
  // Render accepts 200 for an immediately started deploy or 202 for a
  // queued deploy. Both confirm the request, not a completed rollout.
  if (!response || (response.status !== 200 && response.status !== 202)) {
    throw new Error("Render deploy hook did not accept the request (HTTP 200/202).");
  }
  return true;
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
    process.stdout.write("Render image deployment requested after live target verification.\n");
  }).catch(error => {
    // Errors intentionally contain no hooks, tokens, API payloads or image digests.
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  });
}
