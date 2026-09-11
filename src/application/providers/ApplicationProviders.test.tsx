import { describe, expect, it } from "vitest";
import type { ReactElement, ReactNode } from "react";

import type { Identity } from "@/core/identity";

import type {
  AuthenticatedAccessibilityPreferencesRepository,
  PersistedAccessibilityPreferences,
} from "@/core/accessibility-preferences/contracts";

import { ApplicationProviders } from "./ApplicationProviders";

const identity: {
  status: "authenticated";
  identity: Identity;
  error: null;
} = {
  status: "authenticated",
  identity: {
    subjectId: "user-123",
    status: "active",
  },
  error: null,
};

const authenticatedRepository: AuthenticatedAccessibilityPreferencesRepository =
  {
    load: async () => null,
    save: () => Promise.resolve(),
  };

describe("ApplicationProviders", () => {
  it("expõe a composição central da aplicação", () => {
    expect(ApplicationProviders).toBeDefined();
  });

  it("recebe a identidade da aplicação e o repositório autenticado", () => {
    expect(() =>
      ApplicationProviders({
        children: null,
        identity,
        authenticated: authenticatedRepository,
      }),
    ).not.toThrow();
  });

  it("permite omitir o repositório autenticado", () => {
    type ApplicationProvidersContract = (props: {
      children: ReactNode;
      identity: {
        status: "authenticated";
        identity: Identity;
        error: null;
      };
      authenticated?: AuthenticatedAccessibilityPreferencesRepository;
    }) => ReactElement;

    const provider: ApplicationProvidersContract =
      ApplicationProviders;

    expect(provider).toBeDefined();
  });

  it("mantém o mock autenticado compatível com todos os argumentos do contrato", async () => {
    const preferences: PersistedAccessibilityPreferences = {
      version: 1,
      preferences: {
        motion: "reduced",
      },
    };

    await expect(
      authenticatedRepository.save(
        "user-123",
        preferences,
      ),
    ).resolves.toBeUndefined();
  });
});