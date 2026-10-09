export const DEPLOYMENT_PLATFORM = "render" as const;

export const DEPLOYMENT_CONTRACT = {
  platform: DEPLOYMENT_PLATFORM,
  serviceType: "web",
  runtime: "node",
  branch: "main",
  buildCommand: "npm ci && npm run build",
  startCommand: "npm start",
  healthCheckPath: "/api/health",
  autoDeployTrigger: "off",
} as const;
