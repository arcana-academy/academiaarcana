"use strict";

// P0 #536: read-only, metadata-only migration contract. No API calls, no deploy.
const SERVICE_ID = "srv-dauor697lnhs739cicag";
const SERVICE_NAME = "academiaarcana";
const OWNER_ID = "tea-daa6v6tg1s2s73cb5gi0";
const ENVIRONMENT_ID = "evm-dauor697lnhs739cibr0";
const SERVICE_URL = "https://academiaarcana.onrender.com";
const REPO = "https://github.com/arcana-academy/academiaarcana";
const IMAGE_PREFIX = "ghcr.io/arcana-academy/academiaarcana@sha256:";
const DIGEST_PATTERN = /^ghcr\.io\/arcana-academy\/academiaarcana@sha256:[a-f0-9]{64}$/;

function reject() {
  // Never echo raw provider metadata, environment variables or credentials.
  throw new Error("P0 #536 migration contract rejected metadata or approved image; NO-GO.");
}

function frozenService(data) {
  if (!data || typeof data !== "object" ||
      data.id !== SERVICE_ID ||
      data.name !== SERVICE_NAME ||
      data.ownerId !== OWNER_ID ||
      data.environmentId !== ENVIRONMENT_ID ||
      data.type !== "web_service" ||
      data.autoDeploy !== "no" ||
      data.autoDeployTrigger !== "off" ||
      data.serviceDetails?.plan !== "free" ||
      data.serviceDetails?.region !== "ohio" ||
      data.serviceDetails?.numInstances !== 1 ||
      data.serviceDetails?.healthCheckPath !== "/api/health" ||
      data.serviceDetails?.url !== SERVICE_URL ||
      data.serviceDetails?.previews?.generation !== "off" ||
      data.serviceDetails?.pullRequestPreviewsEnabled !== "no" ||
      data.suspended !== "not_suspended") reject();
  return true;
}

function verifyCurrentGitSource(data) {
  frozenService(data);
  if (data.serviceDetails.runtime !== "node" ||
      data.repo !== REPO || data.branch !== "main") reject();
  // Passing is NOT migration authorization or evidence of build secret isolation.
  return true;
}

function verifyProposedImageSource(before, after, approvedImage) {
  verifyCurrentGitSource(before);
  frozenService(after);
  if (typeof approvedImage !== "string" ||
      !DIGEST_PATTERN.test(approvedImage) ||
      !approvedImage.startsWith(IMAGE_PREFIX) ||
      after.serviceDetails.runtime !== "image") reject();
  const topPath = after.imagePath;
  const nestedPath = after.serviceDetails.imagePath;
  if ((topPath !== undefined && nestedPath !== undefined && topPath !== nestedPath) ||
      (nestedPath ?? topPath) !== approvedImage) reject();
  // The live backing source can only be attested after a separately authorized change.
  return true;
}

module.exports = { verifyCurrentGitSource, verifyProposedImageSource };
