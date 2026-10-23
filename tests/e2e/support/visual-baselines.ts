import { writeFileSync } from "node:fs";

export type VisualBaselines = Record<string, string>;

/**
 * Visual baselines are produced by the CI Chromium build, so they cannot be
 * regenerated faithfully on an arbitrary workstation. When
 * `AA_VISUAL_BASELINES_WRITE=1` the specs rewrite their manifest instead of
 * asserting; the `autofix` workflow only enables that mode for pull requests
 * labelled `refresh-visual-baselines`, and the resulting diff is reviewed like
 * any other change. An ordinary run always asserts.
 */
export function isVisualBaselineWriteEnabled(): boolean {
  return process.env.AA_VISUAL_BASELINES_WRITE === "1";
}

/** Persists the captured manifest in the same shape the specs read back. */
export function writeVisualBaselines(
  baselinePath: string,
  baselines: VisualBaselines,
): void {
  writeFileSync(baselinePath, `${JSON.stringify(baselines, null, 2)}\n`);
  console.log(`AA_VISUAL_BASELINES_WRITTEN=${baselinePath}`);
}
