import { describe, expect, it } from "vitest";
import { authorizeDemoBasic, isAllowedDemoPath } from "./isolated-access";

describe("independent synthetic demonstration access", () => {
  const demoKey = "test-demonstration-key-of-sufficient-length";

  it("accepts only the independent Basic demo identity", () => {
    const good = `Basic ${Buffer.from(`arcana-demo:${demoKey}`).toString("base64")}`;
    expect(authorizeDemoBasic(good, demoKey)).toBe(true);
    expect(authorizeDemoBasic(null, demoKey)).toBe(false);
    expect(authorizeDemoBasic("Basic invalid!", demoKey)).toBe(false);
    expect(authorizeDemoBasic(`Basic ${Buffer.from(`student:${demoKey}`).toString("base64")}`, demoKey)).toBe(false);
    expect(authorizeDemoBasic(`Basic ${Buffer.from("arcana-demo:wrong").toString("base64")}`, demoKey)).toBe(false);
  });

  it("denies real modules and APIs", () => {
    expect(isAllowedDemoPath("/")).toBe(true);
    expect(isAllowedDemoPath("/design-system/pilots/mvp")).toBe(true);
    expect(isAllowedDemoPath("/estatisticas")).toBe(false);
    expect(isAllowedDemoPath("/api/ready")).toBe(false);
    expect(isAllowedDemoPath("/api/integrations/notion/status")).toBe(false);
    expect(isAllowedDemoPath("/grimoire")).toBe(false);
  });
});
