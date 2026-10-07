import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { THEME_IDS } from "../../src/design-system/themes/presets";

type Baselines = Record<string, string>;

const baselinePath = join(process.cwd(), "tests/e2e/visual-baselines.json");
const baselines = JSON.parse(readFileSync(baselinePath, "utf8")) as Baselines;

async function screenshotHash(locator: Locator): Promise<string> {
  const bytes = await locator.screenshot({ animations: "disabled" });
  return createHash("sha256").update(bytes).digest("hex");
}

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

  for (const themeId of THEME_IDS) {
    await page.goto(`/design-system?theme=${themeId}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", themeId);

    const showcase = page.getByTestId("theme-showcase");
    await expect(showcase).toBeVisible();
    await assertNoHorizontalOverflow(page, themeId);

    actual[`theme:${themeId}:desktop`] = await screenshotHash(showcase);
  }

  // Kept intentionally machine-readable so the first reviewed run can seed
  // the text manifest without committing binary screenshot artifacts.
  console.log(`AA_VISUAL_BASELINES_JSON=${JSON.stringify(actual)}`);
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
