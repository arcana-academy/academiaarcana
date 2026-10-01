export type CanonicalInfrastructureRole =
  | "source-control"
  | "ci-cd"
  | "application-runtime"
  | "data-backend";

export type CanonicalProvider = {
  readonly role: CanonicalInfrastructureRole;
  readonly provider: string;
  readonly responsibility: string;
  readonly disallowedAlternatives: readonly string[];
};

export const CANONICAL_INFRASTRUCTURE_PROVIDERS = [
  {
    role: "source-control",
    provider: "GitHub",
    responsibility: "Source control, repository history, branches and pull requests.",
    disallowedAlternatives: ["GitLab", "Bitbucket", "Codeberg"],
  },
  {
    role: "ci-cd",
    provider: "GitHub Actions",
    responsibility: "CI, Quality Gate, security checks, tests and delivery orchestration.",
    disallowedAlternatives: [
      "GitLab CI/CD",
      "CircleCI",
      "Travis CI",
      "Jenkins",
      "Bitbucket Pipelines",
    ],
  },
  {
    role: "application-runtime",
    provider: "Render",
    responsibility: "Next.js production Web Service, runtime and application deployment.",
    disallowedAlternatives: [
      "Vercel",
      "Netlify",
      "Railway",
      "Fly.io",
      "Heroku",
      "AWS App Runner",
      "AWS Amplify",
      "Cloudflare Pages",
      "Cloudflare Workers",
    ],
  },
  {
    role: "data-backend",
    provider: "Supabase",
    responsibility: "Authentication, PostgreSQL persistence, RLS, Storage and application data services.",
    disallowedAlternatives: ["Firebase", "Appwrite", "PocketBase"],
  },
] as const satisfies readonly CanonicalProvider[];

export const CANONICAL_INFRASTRUCTURE_RULE =
  "One architectural responsibility has one canonical platform; equivalent platforms require an explicit architectural decision before introduction.";
