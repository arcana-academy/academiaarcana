/** Typed companion for the existing ESM build preflight script. */
export function verifyPublicRuntimeConfig(environment?: Record<string, string | undefined>): {
  integration: string;
  verified: boolean;
  environment: string;
  configuration: string;
};
