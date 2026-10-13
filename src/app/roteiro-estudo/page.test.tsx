import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  pages: vi.fn(),
  items: vi.fn(),
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mocks.auth,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));
vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/infrastructure/supabase/education/practice-repository", () => ({
  SupabaseEducationalPracticeRepository: class {
    listPages(ownerId: string) { return mocks.pages(ownerId); }
    listPracticeItems(ownerId: string) { return mocks.items(ownerId); }
  },
}));
vi.mock("@/components/education/StudyItineraryPlanner", () => ({
  StudyItineraryPlanner: ({ pages }: { pages: Array<{ title: string; practiceCount: number }> }) => (
    <section data-test-itinerary={pages.map((page) => `${page.title}:${page.practiceCount}`).join("|")} />
  ),
}));

import RoteiroEstudoPage from "./page";

describe("RoteiroEstudoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ sub: "owner-1" });
    mocks.pages.mockResolvedValue([{ id: "page1", title: "Biologia" }]);
    mocks.items.mockResolvedValue([
      { ownerId: "owner-1", pageId: "page1", active: true, referenceAnswer: "PRIVATE-ANSWER", prompt: "Private prompt" },
      { ownerId: "other", pageId: "page1", active: true, referenceAnswer: "FOREIGN-SECRET" },
    ]);
  });

  it("reads only after authentication and does not expose answers or foreign records", async () => {
    const html = renderToStaticMarkup(await RoteiroEstudoPage());
    expect(mocks.pages).toHaveBeenCalledWith("owner-1");
    expect(mocks.items).toHaveBeenCalledWith("owner-1");
    expect(html).toContain('data-test-itinerary="Biologia:1"');
    expect(html).not.toContain("PRIVATE-ANSWER");
    expect(html).not.toContain("FOREIGN-SECRET");
    expect(html).not.toContain("Private prompt");
  });

  it("distinguishes actual empty collections from read outages", async () => {
    mocks.pages.mockResolvedValue([]);
    mocks.items.mockResolvedValue([]);
    expect(renderToStaticMarkup(await RoteiroEstudoPage())).toContain("Nenhuma página salva disponível");
    mocks.pages.mockRejectedValue(new Error("PRIVATE-INTERNAL-ERROR"));
    const html = renderToStaticMarkup(await RoteiroEstudoPage());
    expect(html).toContain("Não foi possível carregar suas páginas");
    expect(html).not.toContain("Nenhuma página salva disponível");
    expect(html).not.toContain("PRIVATE-INTERNAL-ERROR");
    expect(html).toContain('action="/roteiro-estudo"');
  });

  it("rejects unauthenticated access before repository reads", async () => {
    mocks.auth.mockRejectedValue(new Error("AUTH_REQUIRED"));
    await expect(RoteiroEstudoPage()).rejects.toThrow("AUTH_REQUIRED");
    expect(mocks.pages).not.toHaveBeenCalled();
    expect(mocks.items).not.toHaveBeenCalled();
  });
});
