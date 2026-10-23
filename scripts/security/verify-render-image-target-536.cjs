"use strict";

// Read-only guard. No Render deploy request may run until the hook's service
// identity, backing mode, and registered image repository are proven.
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
  if (!service || service.id !== hookId || service.serviceDetails?.runtime !== "image") {
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

module.exports = { checkedHookServiceId, registeredImageRepo, verifyRenderImageTarget };

if (require.main === module) {
  verifyRenderImageTarget({
    hookUrl: process.env.RENDER_DEPLOY_HOOK_URL,
    approvedServiceId: process.env.RENDER_IMAGE_SERVICE_ID,
    apiKey: process.env.RENDER_SERVICE_READ_API_KEY,
    imageUrl: process.env.IMAGE_URL,
  }).then(() => {
    process.stdout.write("Render image-backed target verification: PASS\n");
  }).catch(error => {
    // Errors intentionally contain no hooks, tokens, API payloads or image digests.
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  });
}
