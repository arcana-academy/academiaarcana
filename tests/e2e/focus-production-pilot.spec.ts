import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { THEME_IDS } from "../../src/design-system/themes/presets";

type Baselines = Record<string, string>;

const baselinePath = join(process.cwd(), "tests/e2e/focus-pilot-baselines.json");
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

function channelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function parseRgb(value: string): [number, number, number] {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) {
    throw new Error(`Unsupported color value: ${value}`);
  }
  return [channels[0], channels[1], channels[2]];
}

function luminance(value: string): number {
  const [r, g, b] = parseRgb(value).map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test("Focus pilot renders the real FocusSession at representative viewports", async ({ page }) => {
  for (const viewport of [
    { width: 375, height: 812, label: "mobile" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 1280, height: 900, label: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/design-system/pilots/focus?theme=mago-classico");

    await expect(page.getByTestId("focus-production-pilot")).toHaveAttribute(
      "data-pilot-status",
      "validation",
    );
    await expect(page.getByRole("heading", { name: "25 minutos de foco" })).toBeVisible();
    await expect(page.getByText("25:00")).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar sessão" })).toBeVisible();
    await assertNoHorizontalOverflow(page, viewport.label);
  }
});

test("Focus production styling stays M0/T0/D0 across all themes", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 900 });

  for (const themeId of THEME_IDS) {
    await page.goto(`/design-system/pilots/focus?theme=${themeId}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", themeId);

    const timer = page.locator(".aa-focus-timer");
    const timerText = timer.locator("span");
    await expect(timer).toBeVisible();

    const styles = await timer.evaluate((node) => {
      const computed = getComputedStyle(node);
      return {
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage,
        borderStyle: computed.borderStyle,
      };
    });

    expect(styles.backgroundImage, `decorative texture/gradient leaked into ${themeId}`).toBe("none");
    expect(styles.borderStyle).toBe("solid");

    const textColor = await timerText.evaluate((node) => getComputedStyle(node).color);
    const ratio = contrastRatio(textColor, styles.backgroundColor);
    expect(ratio, `Focus timer contrast in ${themeId}`).toBeGreaterThanOrEqual(4.5);

    await assertNoHorizontalOverflow(page, `theme:${themeId}`);
  }
});

test("Focus pilot preserves keyboard focus, running semantics and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-system/pilots/focus?theme=mago-classico");

  const start = page.getByRole("button", { name: "Iniciar sessão" });
  await start.focus();
  await expect(start).toBeFocused();

  const outline = await start.evaluate((node) => {
    const computed = getComputedStyle(node);
    return {
      style: computed.outlineStyle,
      width: Number.parseFloat(computed.outlineWidth),
    };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThan(0);

  await start.click();
  await expect(page.getByRole("button", { name: "Pausar sessão" })).toBeVisible();
  await expect(page.getByText("Em andamento")).toBeVisible();

  const transitionMs = await page.locator(".aa-progress-value").evaluate((node) => {
    const raw = getComputedStyle(node).transitionDuration.split(",")[0]?.trim() ?? "0s";
    const value = Number.parseFloat(raw);
    return raw.endsWith("ms") ? value : value * 1000;
  });
  expect(transitionMs).toBeLessThanOrEqual(0.01);
});

test("FocusSession remains usable when decorative assets fail", async ({ page }) => {
  await page.route("**/assets/**", (route) => route.abort());
  await page.goto("/design-system/pilots/focus?theme=mago-classico");

  await expect(page.getByText("25:00")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Progresso da sessão de foco" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar sessão" })).toBeEnabled();
});

test("Focus production pilot matches deterministic visual baselines", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const actual: Baselines = {};

  for (const viewport of [
    { width: 375, height: 812, label: "mobile" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 1280, height: 900, label: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/design-system/pilots/focus?theme=mago-classico");
    const session = page.locator(".aa-focus-session");
    await expect(session).toBeVisible();
    actual[`focus:mago-classico:${viewport.label}`] = await screenshotHash(session);
  }

  console.log(`AA_FOCUS_PILOT_BASELINES_JSON=${JSON.stringify(actual)}`);
  expect(actual).toEqual(baselines);
});
