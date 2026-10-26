import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import {
  reportVisualBaselineComparison,
  settleVisualSurface,
} from "./support/github-visual-evidence";
import { captureStableVisualHash } from "./support/stable-visual-hash";
import {
  isVisualBaselineWriteEnabled,
  writeVisualBaselines,
} from "./support/visual-baselines";

import { THEME_IDS } from "../../src/design-system/themes/presets";

type Baselines = Record<string, string>;

const baselinePath = join(process.cwd(), "tests/e2e/visual-baselines.json");
const baselines = JSON.parse(readFileSync(baselinePath, "utf8")) as Baselines;

async function assertNoHorizontalOverflow(page: Page, label: string): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow, `horizontal overflow: ${label}`).toBe(false);
}

test("all 40 themes match deterministic visual baselines", async ({ page }) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });

  const actual: Baselines = {};
  const captureDir = process.env.AA_VISUAL_REVIEW_CAPTURE_DIR;

  for (const themeId of THEME_IDS) {
    await page.goto(`/design-system?theme=${themeId}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", themeId);

    const showcase = page.getByTestId("theme-showcase");
    await expect(showcase).toBeVisible();
    await settleVisualSurface(page, showcase);
    await assertNoHorizontalOverflow(page, themeId);

    const key = `theme:${themeId}:desktop`;
    const capture = await captureStableVisualHash(showcase);
    actual[key] = capture.hash;
    // Collect evidence for discrepancies only; never modify approved baselines.
    if (captureDir && capture.hash !== baselines[key]) {
      mkdirSync(captureDir, { recursive: true });
      writeFileSync(join(captureDir, `design-system-${themeId}-desktop.png`), capture.bytes);
    }
  }

  // Kept intentionally machine-readable so a reviewed run can reconcile the
  // text manifest without committing binary screenshot artifacts.
  reportVisualBaselineComparison("AA_VISUAL_BASELINES_JSON", actual, baselines);
  if (isVisualBaselineWriteEnabled()) {
    writeVisualBaselines(baselinePath, actual);
    return;
  }

  expect(actual).toEqual(baselines);
});

test("representative viewports preserve reflow", async ({ page }) => {
  for (const viewport of [
    { width: 375, height: 812, label: "small" },
    { width: 768, height: 1024, label: "medium" },
    { width: 1280, height: 900, label: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/design-system?theme=mago-classico");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "mago-classico");
    await assertNoHorizontalOverflow(page, viewport.label);
  }
});

test("public landing preserves responsive reflow", async ({ page }) => {
  for (const viewport of [
    { width: 375, height: 812, label: "landing-small" },
    { width: 1280, height: 900, label: "landing-desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await assertNoHorizontalOverflow(page, viewport.label);
  }
});

test("reduced motion collapses non-essential transition duration", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-system?theme=mago-classico");

  const duration = await page.locator(".aa-button").first().evaluate((node) => {
    const raw = getComputedStyle(node).transitionDuration.split(",")[0]?.trim() ?? "0s";
    const value = Number.parseFloat(raw);
    return raw.endsWith("ms") ? value : value * 1000;
  });

  expect(duration).toBeLessThanOrEqual(0.01);
});
