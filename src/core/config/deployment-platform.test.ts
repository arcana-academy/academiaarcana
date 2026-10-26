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
      buildCommand: "node scripts/security/assert-build-secret-isolation-536.cjs && node scripts/verify-dependency-lifecycle-scripts.cjs && npm ci --ignore-scripts && npm rebuild unrs-resolver --ignore-scripts=false && npm run build",
      startCommand: "npm start",
      healthCheckPath: "/api/health",
      autoDeployTrigger: "off",
    });
  });
});
