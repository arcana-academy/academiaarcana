import { Searcher, UserFactory } from "@relewise/client";

function requireRelewiseValue(name: "RELEWISE_DATASET_ID" | "RELEWISE_API_KEY" | "RELEWISE_SERVER_URL"): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function createRelewiseSearcher() {
  return new Searcher(requireRelewiseValue("RELEWISE_DATASET_ID"), requireRelewiseValue("RELEWISE_API_KEY"), {
    serverUrl: requireRelewiseValue("RELEWISE_SERVER_URL"),
  });
}

export function createRelewiseSearchUser(userId: string) {
  return UserFactory.byAuthenticatedId(userId);
}
