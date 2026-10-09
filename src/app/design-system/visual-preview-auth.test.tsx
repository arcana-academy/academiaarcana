import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuthenticatedUser = vi.hoisted(() => vi.fn(async () => ({ sub: "subject-test" })));
vi.mock("@/lib/auth/require-authenticated-user", () => ({ requireAuthenticatedUser }));

import EventThemesPreviewPage from "./eventos/page";
import FixedThemesPreviewPage from "./temas-fixos/page";
import PortalPreviewsPage from "./portais/page";

describe("visual preview access boundary", () => {
  beforeEach(() => {
    requireAuthenticatedUser.mockClear();
  });

  it("requires a verified session before composing the events preview", async () => {
    const rendered = await EventThemesPreviewPage();
    expect(requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(rendered.type).toBe("main");
  });

  it("requires a verified session before composing the fixed-theme preview", async () => {
    const rendered = await FixedThemesPreviewPage();
    expect(requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(rendered.type).toBe("main");
  });

  it("requires a verified session for proposed role-based portal shells", async () => {
    const rendered = await PortalPreviewsPage();
    expect(requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(rendered.type).toBe("main");
  });

  it("does not return either preview when authentication fails", async () => {
    requireAuthenticatedUser.mockRejectedValueOnce(new Error("authentication denied"));
    await expect(EventThemesPreviewPage()).rejects.toThrow("authentication denied");
    requireAuthenticatedUser.mockRejectedValueOnce(new Error("authentication denied"));
    await expect(FixedThemesPreviewPage()).rejects.toThrow("authentication denied");
    requireAuthenticatedUser.mockRejectedValueOnce(new Error("authentication denied"));
    await expect(PortalPreviewsPage()).rejects.toThrow("authentication denied");
  });
});
