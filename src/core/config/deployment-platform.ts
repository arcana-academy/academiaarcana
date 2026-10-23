export const DEPLOYMENT_PLATFORM = "render" as const;

export const DEPLOYMENT_CONTRACT = {
  platform: DEPLOYMENT_PLATFORM,
  serviceType: "web",
  runtime: "node",
  branch: "main",
  buildCommand: "npm ci && npm run build",
  startCommand: "npm start",
  healthCheckPath: "/api/health",
  // Promotion must not wait on Production Smoke: that check can only pass once
  // the new revision is already serving, so gating the deploy on it deadlocks.
  // The Quality Gate runs before a commit reaches main.
  autoDeployTrigger: "commit",
} as const;
