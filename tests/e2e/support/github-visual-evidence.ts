type VisualBaselines = Record<string, string>;

/**
 * Keep visual hashes visible in ordinary logs and surface mismatches as a
 * bounded GitHub notice. Artifact downloads can be unavailable to restricted
 * reviewers, while the hashes themselves contain no application data.
 */
export function reportVisualBaselineComparison(
  label: string,
  actual: VisualBaselines,
  expected: VisualBaselines,
): void {
  const serialized = JSON.stringify(actual);
  console.log(`${label}=${serialized}`);

  if (
    process.env.GITHUB_ACTIONS === "true" &&
    serialized !== JSON.stringify(expected)
  ) {
    const escaped = serialized
      .replaceAll("%", "%25")
      .replaceAll("\r", "%0D")
      .replaceAll("\n", "%0A");
    console.log(`::notice title=${label}::${escaped}`);
  }
}
