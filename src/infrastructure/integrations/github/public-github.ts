import type {
  IntegrationConnectionStatus,
  IntegrationDefinition,
} from "../contracts";

export const GITHUB_PLUGIN_NAME = "GitHub" as const;
export const GITHUB_PROVIDER_ID = "github" as const;
export const DEFAULT_GITHUB_VERIFICATION_REPOSITORY =
  "arcana-academy/academiaarcana" as const;

export const GITHUB_INTEGRATION_DEFINITION = {
  id: GITHUB_PROVIDER_ID,
  displayName: GITHUB_PLUGIN_NAME,
  authMode: "none",
  capabilities: ["read", "search"],
  userConnectionRequired: false,
  serverSideOnly: true,
  scopes: [],
  documentationUrl: "https://docs.github.com/en/rest/repos/repos",
} satisfies IntegrationDefinition;

const GITHUB_API_ORIGIN = "https://api.github.com";

export type GitHubRepositorySnapshot = {
  readonly fullName: string;
  readonly defaultBranch: string;
  readonly visibility: string;
  readonly private: boolean;
  readonly htmlUrl: string;
};

export type GitHubConnectionVerification = {
  readonly providerId: typeof GITHUB_PROVIDER_ID;
  readonly pluginName: typeof GITHUB_PLUGIN_NAME;
  readonly status: Extract<IntegrationConnectionStatus, "connected" | "error">;
  readonly repository: GitHubRepositorySnapshot;
  readonly verifiedAt: string;
};

export class GitHubConnectionError extends Error {
  readonly httpStatus: number;

  constructor(message: string, httpStatus: number) {
    super(message);
    this.name = "GitHubConnectionError";
    this.httpStatus = httpStatus;
  }
}

type GitHubRepositoryApiResponse = {
  readonly full_name?: unknown;
  readonly default_branch?: unknown;
  readonly visibility?: unknown;
  readonly private?: unknown;
  readonly html_url?: unknown;
};

export type GitHubFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

function parseRepositorySlug(repository: string): {
  owner: string;
  name: string;
} {
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(repository.trim());

  if (!match) {
    throw new GitHubConnectionError(
      "GitHub repository must use the owner/name format.",
      400,
    );
  }

  return {
    owner: match[1],
    name: match[2],
  };
}

function parseRepositoryResponse(
  payload: GitHubRepositoryApiResponse,
): GitHubRepositorySnapshot {
  if (
    typeof payload.full_name !== "string" ||
    typeof payload.default_branch !== "string" ||
    typeof payload.visibility !== "string" ||
    typeof payload.private !== "boolean" ||
    typeof payload.html_url !== "string"
  ) {
    throw new GitHubConnectionError(
      "GitHub returned an invalid repository payload.",
      502,
    );
  }

  return {
    fullName: payload.full_name,
    defaultBranch: payload.default_branch,
    visibility: payload.visibility,
    private: payload.private,
    htmlUrl: payload.html_url,
  };
}

export async function verifyGitHubConnection({
  repository = DEFAULT_GITHUB_VERIFICATION_REPOSITORY,
  fetchImpl = fetch,
}: {
  readonly repository?: string;
  readonly fetchImpl?: GitHubFetch;
} = {}): Promise<GitHubConnectionVerification> {
  const { owner, name } = parseRepositorySlug(repository);
  const url = `${GITHUB_API_ORIGIN}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;

  let response: Response;

  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "academiaarcana-integration-verifier",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });
  } catch {
    throw new GitHubConnectionError(
      "GitHub could not be reached from the server.",
      502,
    );
  }

  if (!response.ok) {
    throw new GitHubConnectionError(
      `GitHub repository lookup failed with HTTP ${response.status}.`,
      response.status,
    );
  }

  let payload: GitHubRepositoryApiResponse;

  try {
    payload = (await response.json()) as GitHubRepositoryApiResponse;
  } catch {
    throw new GitHubConnectionError(
      "GitHub returned a response that was not valid JSON.",
      502,
    );
  }

  const repositorySnapshot = parseRepositoryResponse(payload);

  return {
    providerId: GITHUB_PROVIDER_ID,
    pluginName: GITHUB_PLUGIN_NAME,
    status: "connected",
    repository: repositorySnapshot,
    verifiedAt: new Date().toISOString(),
  };
}
