import { describe, expect, it } from "vitest";
import { getOpenSourceAiIntegration, getOpenSourceAiStatus, openSourceAiIntegrations } from "./open-source-ai";

describe("open source AI integration catalog", () => {
  it("contains the complete validated provider set", () => {
    expect(openSourceAiIntegrations).toHaveLength(10);
    expect(getOpenSourceAiIntegration("ollama")?.license).toBe("MIT");
    expect(getOpenSourceAiIntegration("vllm")?.license).toBe("Apache-2.0");
    expect(getOpenSourceAiIntegration("huggingface")?.endpointEnv).toBe("HUGGINGFACE_BASE_URL");
  });

  it("reports runtime configuration from environment only", () => {
    const integration = getOpenSourceAiIntegration("ollama")!;
    const status = getOpenSourceAiStatus(integration, { OLLAMA_BASE_URL: "http://localhost:11434" });
    expect(status.configured).toBe(true);
    expect(status.endpointConfigured).toBe(true);
  });

  it("does not pretend non-runtime frameworks are connected", () => {
    const integration = getOpenSourceAiIntegration("langchain")!;
    expect(getOpenSourceAiStatus(integration).configured).toBe(false);
  });
});
