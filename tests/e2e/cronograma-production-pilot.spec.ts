import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { THEME_IDS } from "../../src/design-system/themes/presets";

type Baselines = Record<string, string>;

const baselinePath = join(process.cwd(), "tests/e2e/cronograma-pilot-baselines.json");
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
  if (!channels || channels.length !== 3) throw new Error(`Unsupported color value: ${value}`);
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

test("Cronograma pilot renders the real StudyTaskBoard at representative viewports", async ({ page }) => {
  for (const viewport of [
    { width: 375, height: 812, label: "mobile" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 1280, height: 900, label: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=default");

    await expect(page.getByTestId("cronograma-production-pilot")).toHaveAttribute("data-pilot-status", "validation");
    await expect(page.getByTestId("cronograma-production-pilot")).toHaveAttribute("data-scenario", "default");
    await expect(page.getByRole("heading", { name: "Cronograma", exact: true })).toBeVisible();
    await expect(page.getByLabel("Tarefa")).toBeVisible();
    await expect(page.getByText("Revisar capítulo de Fisiologia")).toBeVisible();
    await assertNoHorizontalOverflow(page, viewport.label);
  }
});

test("StudyTaskBoard production styling stays M0-M1/T0/D0-D1 across all themes", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 900 });

  for (const themeId of THEME_IDS) {
    await page.goto(`/design-system/pilots/cronograma?theme=${themeId}&scenario=default`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", themeId);

    const board = page.locator(".aa-study-task-board");
    await expect(board).toBeVisible();

    const surfaces = board.locator(":scope > .aa-surface");
    expect(await surfaces.count()).toBeGreaterThanOrEqual(3);

    for (let index = 0; index < await surfaces.count(); index += 1) {
      const surface = surfaces.nth(index);
      const styles = await surface.evaluate((node) => {
        const computed = getComputedStyle(node);
        return {
          backgroundColor: computed.backgroundColor,
          backgroundImage: computed.backgroundImage,
          borderStyle: computed.borderStyle,
          filter: computed.filter,
          backdropFilter: computed.backdropFilter,
        };
      });

      expect(styles.backgroundImage, `decorative gradient leaked into ${themeId}`).toBe("none");
      expect(styles.borderStyle).toBe("solid");
      expect(styles.filter).toBe("none");
      expect(styles.backdropFilter).toBe("none");

      const heading = surface.locator("h2").first();
      if (await heading.count()) {
        const textColor = await heading.evaluate((node) => getComputedStyle(node).color);
        expect(
          contrastRatio(textColor, styles.backgroundColor),
          `Cronograma surface contrast in ${themeId}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }

    await assertNoHorizontalOverflow(page, `theme:${themeId}`);
  }
});

test("Cronograma pilot preserves keyboard focus and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=default");

  const input = page.getByLabel("Tarefa");
  await input.focus();
  await expect(input).toBeFocused();

  const outline = await input.evaluate((node) => {
    const computed = getComputedStyle(node);
    return { style: computed.outlineStyle, width: Number.parseFloat(computed.outlineWidth) };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThan(0);

  const transitionMs = await page.getByRole("button", { name: "Criar tarefa" }).evaluate((node) => {
    const raw = getComputedStyle(node).transitionDuration.split(",")[0]?.trim() ?? "0s";
    const value = Number.parseFloat(raw);
    return raw.endsWith("ms") ? value : value * 1000;
  });
  expect(transitionMs).toBeLessThanOrEqual(0.01);
});

test("Cronograma pilot covers empty, error and connected Outlook states deterministically", async ({ page }) => {
  await page.goto("/design-system/pilots/cronograma?scenario=empty");
  await expect(page.getByTestId("cronograma-production-pilot")).toHaveAttribute("data-scenario", "empty");
  await expect(page.getByText("Nenhuma tarefa futura cadastrada.")).toBeVisible();

  await page.goto("/design-system/pilots/cronograma?scenario=error");
  await expect(page.getByTestId("cronograma-production-pilot")).toHaveAttribute("data-scenario", "error");
  await page.getByLabel("Tarefa").fill("Tarefa que falha");
  await page.getByRole("button", { name: "Criar tarefa" }).click();
  await expect(page.getByRole("alert")).toHaveText("Não foi possível criar a tarefa.");

  await page.goto("/design-system/pilots/cronograma?scenario=connected");
  await expect(page.getByTestId("cronograma-production-pilot")).toHaveAttribute("data-scenario", "connected");
  await expect(page.getByText("Conectado", { exact: true })).toBeVisible();
  await expect(page.getByText("Revisão guiada")).toBeVisible();
  await expect(page.getByRole("button", { name: "Agendar no Outlook" })).toBeVisible();
});

test("StudyTaskBoard remains usable when decorative assets fail", async ({ page }) => {
  await page.route("**/assets/**", (route) => route.abort());
  await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=default");

  await expect(page.getByRole("heading", { name: "Cronograma", exact: true })).toBeVisible();
  await expect(page.getByLabel("Tarefa")).toBeEnabled();
  await expect(page.getByRole("button", { name: "Criar tarefa" })).toBeDisabled();
  await expect(page.getByText("Revisar capítulo de Fisiologia")).toBeVisible();
});

test("Cronograma pilot records performance evidence without inventing a budget", async ({ page }) => {
  await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=connected");
  const metrics = await page.locator(".aa-study-task-board").evaluate((node) => ({
    descendants: node.querySelectorAll("*").length,
    images: node.querySelectorAll("img").length,
    filters: [...node.querySelectorAll("*")].filter((element) => {
      const style = getComputedStyle(element);
      return style.filter !== "none" || style.backdropFilter !== "none";
    }).length,
    activeAnimations: document.getAnimations().filter((animation) => animation.playState === "running").length,
  }));

  console.log(`AA_CRONOGRAMA_PILOT_PERF_JSON=${JSON.stringify(metrics)}`);
  expect(metrics.filters).toBe(0);
  expect(metrics.activeAnimations).toBe(0);
});

test("Cronograma production pilot matches deterministic visual baselines", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const actual: Baselines = {};

  for (const viewport of [
    { width: 375, height: 812, label: "mobile" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 1280, height: 900, label: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=default");
    const board = page.locator(".aa-study-task-board");
    await expect(board).toBeVisible();
    actual[`cronograma:mago-classico:${viewport.label}`] = await screenshotHash(board);
  }

  console.log(`AA_CRONOGRAMA_PILOT_BASELINES_JSON=${JSON.stringify(actual)}`);
  expect(actual).toEqual(baselines);
});
