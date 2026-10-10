import { describe, expect, it } from "vitest";

import {
  DEPLOYMENT_CONTRACT,
  DEPLOYMENT_PLATFORM,
} from "./deployment-platform";

describe("deployment platform contract", () => {
  it("locks Render as the only deployment platform", () => {
    expect(DEPLOYMENT_PLATFORM).toBe("render");
    expect(DEPLOYMENT_CONTRACT).toMatchObject({
      platform: "render",
      serviceType: "web",
      runtime: "node",
      branch: "main",
      buildCommand: "npm ci && npm run build",
      startCommand: "npm start",
      healthCheckPath: "/api/health",
      autoDeployTrigger: "off",
    });
  });
});
