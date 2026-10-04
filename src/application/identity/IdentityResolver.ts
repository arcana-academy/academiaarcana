import type { Identity } from "@/core/identity";

import type { ApplicationIdentityState } from "./contracts";

type IdentityResolverDependencies = {
  resolveSubjectId: () => Promise<string | null>;
};

export type IdentityResolver = {
  resolve: () => Promise<ApplicationIdentityState>;
};

export function createIdentityResolver({
  resolveSubjectId,
}: IdentityResolverDependencies): IdentityResolver {
  return {
    async resolve() {
      try {
        const subjectId = await resolveSubjectId();

        if (!subjectId) {
          return {
            status: "anonymous",
            identity: null,
            error: null,
          };
        }

        const identity: Identity = {
          subjectId,
          status: "active",
        };

        return {
          status: "authenticated",
          identity,
          error: null,
        };
      } catch (error) {
        return {
          status: "error",
          identity: null,
          error: {
            code: "IDENTITY_RESOLUTION_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Falha ao resolver identidade.",
          },
        };
      }
    },
  };
}
