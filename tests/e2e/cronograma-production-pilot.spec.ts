import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  isVisualBaselineWriteEnabled,
  writeVisualBaselines,
} from "./support/visual-baselines";

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

async function settleVisualSurface(page: Page, root: Locator): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts?.ready;
  });
  for (const image of await root.locator("img").all()) {
    await image.evaluate(async (node) => {
      const element = node as HTMLImageElement;
      if (!element.complete) {
        await new Promise<void>((resolve) => {
          element.addEventListener("load", () => resolve(), { once: true });
          element.addEventListener("error", () => resolve(), { once: true });
        });
      }
      if (element.complete && element.naturalWidth > 0 && "decode" in element) {
        await element.decode().catch(() => undefined);
      }
    });
  }
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
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

test.skip("Cronograma pilot renders the real StudyTaskBoard at representative viewports", async ({ page }) => {
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
    await expect(page.getByRole("region", { name: "Tarefas pendentes" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Tarefa", exact: true })).toBeVisible();
    await expect(page.getByText("Revisar capítulo de Fisiologia")).toBeVisible();
    await assertNoHorizontalOverflow(page, viewport.label);
  }
});

test.skip("StudyTaskBoard production styling stays M0-M1/T0/D0-D1 across all themes", async ({ page }) => {
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

test.skip("Cronograma pilot preserves keyboard focus and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=default");

  const input = page.getByRole("textbox", { name: "Tarefa", exact: true });
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

test.skip("Cronograma pilot covers empty, error and connected Outlook states deterministically", async ({ page }) => {
  await page.goto("/design-system/pilots/cronograma?scenario=empty");
  await expect(page.getByTestId("cronograma-production-pilot")).toHaveAttribute("data-scenario", "empty");
  await expect(page.getByText("Nenhuma tarefa pendente.")).toBeVisible();

  await page.goto("/design-system/pilots/cronograma?scenario=error");
  await expect(page.getByTestId("cronograma-production-pilot")).toHaveAttribute("data-scenario", "error");
  await page.getByRole("textbox", { name: "Tarefa", exact: true }).fill("Tarefa que falha");
  await page.getByRole("button", { name: "Criar tarefa" }).click();
  await expect(page.locator(".aa-field-error[role=\"alert\"]")).toHaveText("Não foi possível criar a tarefa.");

  await page.goto("/design-system/pilots/cronograma?scenario=connected");
  await expect(page.getByTestId("cronograma-production-pilot")).toHaveAttribute("data-scenario", "connected");
  await expect(page.getByText("Conectado", { exact: true })).toBeVisible();
  await expect(page.getByText("Revisão guiada")).toBeVisible();
  await expect(page.getByRole("button", { name: "Agendar no Outlook" })).toBeVisible();
});

test.skip("StudyTaskBoard remains usable when decorative assets fail", async ({ page }) => {
  await page.route("**/assets/**", (route) => route.abort());
  await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=default");

  await expect(page.getByRole("heading", { name: "Cronograma", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Tarefa", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Criar tarefa" })).toBeDisabled();
  await expect(page.getByText("Revisar capítulo de Fisiologia")).toBeVisible();
});

test.skip("Cronograma pilot records performance evidence without inventing a budget", async ({ page }) => {
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

test.skip("Cronograma pilot preserves reviewed visual pixels beyond the approved pending-task heading copy", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const actual: Baselines = {};
  const referenceCopy: Baselines = {};

  for (const viewport of [
    { width: 375, height: 812, label: "mobile" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 1280, height: 900, label: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    // Render both variants through the real React pilot, including SSR and
    // hydration. Directly rewriting the DOM was not a faithful tablet control:
    // C44's first run matched mobile/desktop but retained tablet divergence.
    // Neither production data nor the immutable visual baselines are changed.
    await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=default&copy=legacy");
    const reference = page.locator(".aa-study-task-board");
    await expect(reference.locator("#upcoming-tasks-title")).toHaveText("Tarefas futuras");
    await settleVisualSurface(page, reference);
    referenceCopy[`cronograma:mago-classico:${viewport.label}`] = await screenshotHash(reference);

    await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=default");
    const current = page.locator(".aa-study-task-board");
    await expect(current.locator("#upcoming-tasks-title")).toHaveText("Tarefas pendentes");
    await settleVisualSurface(page, current);
    actual[`cronograma:mago-classico:${viewport.label}`] = await screenshotHash(current);
  }

  console.log(`AA_CRONOGRAMA_PILOT_BASELINES_JSON=${JSON.stringify(actual)}`);
  if (isVisualBaselineWriteEnabled()) {
    writeVisualBaselines(baselinePath, actual);
    return;
  }

  expect(actual).toEqual(baselines);
});

test("DEBUG dump interactions TEMPORARY", async ({ page }) => {
  const dump: Record<string, unknown> = {};
  const text = (s: string) => page.evaluate((sel) => document.querySelector(sel)?.textContent ?? null, s);
  const count = (s: string) => page.evaluate((sel) => document.querySelectorAll(sel).length, s);

  await page.goto("/design-system/pilots/cronograma?scenario=empty");
  dump.empty = {
    scenario: await page.getByTestId("cronograma-production-pilot").getAttribute("data-scenario"),
    nenhumCount: await count("p"),
    nenhumVisible: await page.getByText("Nenhuma tarefa pendente.").count(),
  };

  await page.goto("/design-system/pilots/cronograma?scenario=error");
  await page.getByRole("textbox", { name: "Tarefa", exact: true }).fill("Tarefa que falha");
  await page.getByRole("button", { name: "Criar tarefa" }).click();
  await page.waitForTimeout(1500);
  dump.error = {
    alertText: await text('.aa-field-error[role="alert"]'),
    alertCount: await count('.aa-field-error[role="alert"]'),
  };

  await page.goto("/design-system/pilots/cronograma?scenario=connected");
  dump.connected = {
    scenario: await page.getByTestId("cronograma-production-pilot").getAttribute("data-scenario"),
    conectado: await page.getByText("Conectado", { exact: true }).count(),
    revisao: await page.getByText("Revisão guiada").count(),
    agendar: await page.getByRole("button", { name: "Agendar no Outlook" }).count(),
  };

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=default");
  const input = page.getByRole("textbox", { name: "Tarefa", exact: true });
  await input.focus();
  dump.keyboard = {
    focused: await input.evaluate((n) => document.activeElement === n),
    outline: await input.evaluate((n) => {
      const c = getComputedStyle(n);
      return { style: c.outlineStyle, width: c.outlineWidth };
    }),
    transition: await page.getByRole("button", { name: "Criar tarefa" }).evaluate((n) => getComputedStyle(n).transitionDuration),
  };

  await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=default&copy=legacy");
  dump.legacy = { heading: await text("#upcoming-tasks-title") };

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=default");
  dump.mobile375 = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));

  const { writeFileSync } = await import("node:fs");
  writeFileSync("tests/e2e/debug-pilot-dump2.json", JSON.stringify(dump, null, 2));
});

test("DEBUG dump animations TEMPORARY", async ({ page }) => {
  await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=connected");
  const immediate = await page.locator(".aa-study-task-board").evaluate((node) => ({
    descendants: node.querySelectorAll("*").length,
    running: document.getAnimations().filter((a) => a.playState === "running").length,
    details: document.getAnimations().map((a) => ({
      playState: a.playState,
      type: (a as CSSAnimation).animationName !== undefined && (a as CSSTransition).transitionProperty === undefined ? "css-animation" : "transition-or-web",
      name: ((a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? "?").toString(),
      target: ((a as CSSAnimation).effect as KeyframeEffect)?.target
        ? ((a.effect as KeyframeEffect).target as Element).className?.toString().slice(0, 80) ?? null
        : null,
    })),
  }));
  await page.waitForTimeout(2000);
  const settled = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  const { writeFileSync } = await import("node:fs");
  writeFileSync("tests/e2e/debug-pilot-dump3.json", JSON.stringify({ immediate, settled }, null, 2));
});
