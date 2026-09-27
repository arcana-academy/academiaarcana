import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_GITHUB_VERIFICATION_REPOSITORY,
  GITHUB_INTEGRATION_DEFINITION,
  GitHubConnectionError,
  verifyGitHubConnection,
} from "./public-github";

describe("GitHub integration verifier", () => {
  it("declares GitHub as a read-only, no-secret integration", () => {
    expect(GITHUB_INTEGRATION_DEFINITION).toMatchObject({
      id: "github",
      displayName: "GitHub",
      authMode: "none",
      userConnectionRequired: false,
      serverSideOnly: true,
      scopes: [],
    });
  });

  it("performs a server-side, no-secret repository lookup", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          full_name: DEFAULT_GITHUB_VERIFICATION_REPOSITORY,
          default_branch: "main",
          visibility: "public",
          private: false,
          html_url:
            "https://github.com/arcana-academy/academiaarcana",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const result = await verifyGitHubConnection({ fetchImpl });

    expect(result.providerId).toBe("github");
    expect(result.pluginName).toBe("GitHub");
    expect(result.status).toBe("connected");
    expect(result.repository.fullName).toBe(
      DEFAULT_GITHUB_VERIFICATION_REPOSITORY,
    );

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(
      "https://api.github.com/repos/arcana-academy/academiaarcana",
    );
    expect(init).toMatchObject({
      method: "GET",
      cache: "no-store",
    });
    expect(init?.headers).not.toHaveProperty("Authorization");
  });

  it("rejects malformed repository identifiers before network access", async () => {
    const fetchImpl = vi.fn();

    await expect(
      verifyGitHubConnection({
        repository: "not-a-repository",
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      name: GitHubConnectionError.name,
      httpStatus: 400,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails closed when GitHub returns a non-success response", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 404 }));

    await expect(
      verifyGitHubConnection({
        repository: DEFAULT_GITHUB_VERIFICATION_REPOSITORY,
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      name: GitHubConnectionError.name,
      httpStatus: 404,
    });
  });

  it("fails closed when GitHub returns invalid JSON", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response("not-json", {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await expect(
      verifyGitHubConnection({
        repository: DEFAULT_GITHUB_VERIFICATION_REPOSITORY,
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      name: GitHubConnectionError.name,
      httpStatus: 502,
    });
  });
});
