import { describe, expect, it } from "vitest";

import { createRelewiseSearchUser } from "./server";

describe("Relewise search helpers", () => {
  it("creates a user from the authenticated subject id", () => {
    expect(createRelewiseSearchUser("user-123")).toEqual({
      authenticatedId: "user-123",
    });
  });
});
