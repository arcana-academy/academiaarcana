import { describe, expect, it } from "vitest";
import type { ContextResource, ContextVisibility } from "./contracts";

describe("context contracts", () => {
  it("requires every resource to declare its owning context and visibility", () => {
    const resource: ContextResource = {
      resourceId: "resource-1",
      ownerId: "user-1",
      contextId: "personal",
      visibility: "private",
    };

    expect(resource.visibility).toBe("private");
    expect(resource.contextId).toBe("personal");
  });

  it("models private-by-default visibility and explicit sharing separately", () => {
    const visibility: ContextVisibility[] = ["private", "explicit-share"];

    expect(visibility).toEqual(["private", "explicit-share"]);
  });
});
