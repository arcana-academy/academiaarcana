import { describe, expect, it } from "vitest";

import {
  isPrivatePreviewAuthorized,
  isPrivatePreviewEnabled,
  PRIVATE_PREVIEW_USER,
} from "./private-preview-gate";

const strongPassword = "SyntheticOnlyPreviewPassphrase-2026-Long-90";
const environment = {
  AA_PRIVATE_PREVIEW: "required",
  AA_PRIVATE_PREVIEW_PASSWORD: strongPassword,
};

const basic = (user: string, password: string) =>
  `Basic ${Buffer.from(`${user}:${password}`, "utf8").toString("base64")}`;

describe("private preview access", () => {
  it("is fail-closed by default; test opt-out requires explicit setting", () => {
    expect(isPrivatePreviewEnabled({})).toBe(true);
    expect(isPrivatePreviewEnabled({ AA_PRIVATE_PREVIEW: "disabled" })).toBe(false);
    expect(isPrivatePreviewEnabled(environment)).toBe(true);
  });

  it("rejects missing or short passwords even if request claims authorization", () => {
    expect(
      isPrivatePreviewAuthorized(basic(PRIVATE_PREVIEW_USER, strongPassword), {}),
    ).toBe(false);
    expect(
      isPrivatePreviewAuthorized(
        basic(PRIVATE_PREVIEW_USER, "too-short"),
        { AA_PRIVATE_PREVIEW_PASSWORD: "too-short" },
      ),
    ).toBe(false);
  });

  it("accepts only the exact dedicated preview credentials", () => {
    expect(
      isPrivatePreviewAuthorized(basic(PRIVATE_PREVIEW_USER, strongPassword), environment),
    ).toBe(true);
    expect(
      isPrivatePreviewAuthorized(basic("other-user", strongPassword), environment),
    ).toBe(false);
    expect(
      isPrivatePreviewAuthorized(basic(PRIVATE_PREVIEW_USER, "wrong"), environment),
    ).toBe(false);
  });

  it("rejects malformed, absent and oversized authorization headers", () => {
    for (const bad of [null, "", "Bearer xyz", "Basic ???", "Basic Zm9v", "Basic " + "x".repeat(4100)]) {
      expect(isPrivatePreviewAuthorized(bad, environment)).toBe(false);
    }
  });
});
