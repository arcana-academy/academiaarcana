export const DEPLOYMENT_PLATFORM = "render" as const;

export const DEPLOYMENT_CONTRACT = {
  platform: DEPLOYMENT_PLATFORM,
  serviceType: "web",
  runtime: "node",
  branch: "main",
  buildCommand: "node scripts/security/assert-build-secret-isolation-536.cjs && node scripts/verify-dependency-lifecycle-scripts.cjs && npm ci --ignore-scripts && npm rebuild unrs-resolver --ignore-scripts=false && npm run build",
  startCommand: "npm start",
  healthCheckPath: "/api/health",
  // NO-GO: merges cannot initiate production deployment.
  // Production Smoke remains post-deployment verification.
  autoDeployTrigger: "off",
} as const;
