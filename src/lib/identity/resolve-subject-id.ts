type ClaimsResponse = {
  data: {
    claims: {
      sub?: string;
    } | null;
  };
  error: unknown;
};

type GetClaims = () => Promise<ClaimsResponse>;

export function createResolveSubjectId(
  getClaims: GetClaims,
): () => Promise<string | null> {
  return async () => {
    const { data, error } = await getClaims();

    if (error) {
      throw error;
    }

    if (!data.claims?.sub) {
      return null;
    }

    return data.claims.sub;
  };
}
