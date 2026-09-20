import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSanctuary } from "@/application/sanctuary/get-sanctuary";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

import SanctuaryPage from "./page";

const getSanctuaryMock = vi.mocked(getSanctuary);
const requireAuthenticatedUserMock = vi.mocked(requireAuthenticatedUser);
const createClientMock = vi.mocked(createClient);

vi.mock("@/application/sanctuary/get-sanctuary", () => ({
    getSanctuary: vi.fn(),
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
    requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn(),
}));

vi.mock("@/components/sanctuary/Sanctuary", () => ({
    Sanctuary: ({ viewModel }: { viewModel: unknown }) => (
        <div data-testid="sanctuary-component">
            {JSON.stringify(viewModel)}
        </div>
    ),
}));

vi.mock("@/infrastructure/sanctuary/supabase-sanctuary-repository", () => ({
    SupabaseSanctuaryRepository: class { },
}));

type AuthenticatedClaims = Awaited<
    ReturnType<typeof requireAuthenticatedUser>
>;

function createAuthenticatedClaims(sub: string): AuthenticatedClaims {
    return {
        iss: "test-issuer",
        aud: "authenticated",
        exp: 4_102_444_800,
        iat: 0,
        sub,
        role: "authenticated",
        aal: "aal1",
        session_id: "test-session",
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("SanctuaryPage", () => {
    it("requires authentication before rendering the sanctuary", async () => {
        requireAuthenticatedUserMock.mockResolvedValue(
            createAuthenticatedClaims("user-1"),
        );

        createClientMock.mockResolvedValue(
            {} as Awaited<ReturnType<typeof createClient>>,
        );

        getSanctuaryMock.mockResolvedValue({
            header: {
                greeting: "Seu Santuário de aprendizagem",
                user: {
                    id: "user-1",
                },
            },
            primaryAction: {
                id: "open-workspace",
                label: "Abrir Workspace",
                href: "/workspace?view=tree#current",
                priority: "supporting",
            },
            continueLearning: null,
            progress: {
                status: "not-configured",
                data: null,
            },
            missions: {
                status: "not-configured",
                data: null,
            },
            schedule: [],
            quickActions: [],
        });

        render(await SanctuaryPage());

        expect(requireAuthenticatedUserMock).toHaveBeenCalledTimes(1);
        expect(getSanctuaryMock).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId("sanctuary-component")).toBeTruthy();
    });

    it("passes the authenticated subject to the application layer", async () => {
        requireAuthenticatedUserMock.mockResolvedValue(
            createAuthenticatedClaims("user-42"),
        );

        createClientMock.mockResolvedValue(
            {} as Awaited<ReturnType<typeof createClient>>,
        );

        getSanctuaryMock.mockResolvedValue({
            header: {
                greeting: "Seu Santuário de aprendizagem",
                user: {
                    id: "user-42",
                },
            },
            primaryAction: {
                id: "open-workspace",
                label: "Abrir Workspace",
                href: "/workspace?view=tree#current",
                priority: "supporting",
            },
            continueLearning: null,
            progress: {
                status: "not-configured",
                data: null,
            },
            missions: {
                status: "not-configured",
                data: null,
            },
            schedule: [],
            quickActions: [],
        });

        render(await SanctuaryPage());

        expect(getSanctuaryMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                user: {
                    id: "user-42",
                },
            }),
        );
    });
});
