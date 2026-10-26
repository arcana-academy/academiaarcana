import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { THEME_IDS } from "../../src/design-system/themes/presets";

type Baselines = Record<string, string>;

const baselinePath = join(process.cwd(), "tests/e2e/cronograma-pilot-baselines.json");
const baselines = JSON.parse(readFileSync(baselinePath, "utf8")) as Baselines;

async function screenshotHash(locator: Locator, evidencePath?: string): Promise<string> {
  const bytes = await locator.screenshot({ animations: "disabled" });
  if (evidencePath) {
    mkdirSync(dirname(evidencePath), { recursive: true });
    writeFileSync(evidencePath, bytes);
  }
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
    await expect(page.getByRole("region", { name: "Tarefas pendentes" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Tarefa", exact: true })).toBeVisible();
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

test("Cronograma pilot covers empty, error and connected Outlook states deterministically", async ({ page }) => {
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

test("StudyTaskBoard remains usable when decorative assets fail", async ({ page }) => {
  await page.route("**/assets/**", (route) => route.abort());
  await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=default");

  await expect(page.getByRole("heading", { name: "Cronograma", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Tarefa", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Criar tarefa" })).toBeDisabled();
  await expect(page.getByText("Revisar capítulo de Fisiologia")).toBeVisible();
});

test("Cronograma pilot records performance evidence without inventing a budget", async ({ page }) => {
  await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=connected");
  // Wait for the actual hydrated theme/scenario rather than sampling the
  // initial paint, which can briefly report zero animations before transitions start.
  await expect(page.getByTestId("cronograma-production-pilot")).toHaveAttribute("data-scenario", "connected");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "mago-classico");
  // data-theme can already match server HTML before React effects run.
  // The inline theme tokens are set by applyTheme() only after hydration;
  // wait for that observable boundary before checking for active transitions.
  await page.waitForFunction(
    () => document.documentElement.style.getPropertyValue("--aa-surfaces-panel").trim().length > 0,
    null,
    { timeout: 10_000 },
  );
  await page.evaluate(async () => { await document.fonts.ready; });
  // Force style resolution before awaiting animation completion. Reading
  // getComputedStyle() for the first time in the metric collection otherwise
  // starts ~31 CSS transitions *after* a premature zero-animation poll.
  await page.locator(".aa-study-task-board").evaluate((node) => {
    for (const element of [node, ...node.querySelectorAll("*")]) {
      const style = getComputedStyle(element);
      void style.color;
      void style.backgroundColor;
      void style.borderColor;
      void style.filter;
      void style.backdropFilter;
    }
  });
  // Measure filter styles *before* testing for settled animations in the
  // same browser evaluation. A separate later getComputedStyle() pass can
  // expose pending transitions (31 observed on Ubuntu CI after a zero poll).
  // Keep the contract: no active animations and no filters on StudyTaskBoard.
  // Keep this predicate synchronous. An async predicate returns a Promise,
  // which is itself truthy and can make waitForFunction resolve to `false`
  // before the finite board transitions have actually settled. Polling on each
  // animation frame provides the intended post-style-resolution boundary.
  const settled = await page.waitForFunction(() => {
    const board = document.querySelector(".aa-study-task-board");
    if (!board) return false;
    const descendants = [...board.querySelectorAll("*")];
    // Force the same style resolution used by the performance measurement.
    const filterCount = descendants.filter((element) => {
      const style = getComputedStyle(element);
      return style.filter !== "none" || style.backdropFilter !== "none";
    }).length;
    const activeAnimations = board.getAnimations({ subtree: true })
      .filter((animation) => animation.playState === "running").length;
    if (activeAnimations !== 0) return false;
    return {
      descendants: descendants.length,
      images: board.querySelectorAll("img").length,
      filters: filterCount,
      activeAnimations,
      // Keep page-wide animations observable without changing the board contract.
      pageActiveAnimations: document.getAnimations()
        .filter((animation) => animation.playState === "running").length,
    };
  }, null, { polling: "raf", timeout: 10_000 });
  const metrics = await settled.jsonValue();
  if (!metrics) throw new Error("Cronograma metrics did not settle");

  console.log(`AA_CRONOGRAMA_PILOT_PERF_JSON=${JSON.stringify(metrics)}`);
  expect(metrics.filters).toBe(0);
  expect(metrics.activeAnimations).toBe(0);
});

test("Cronograma pilot preserves reviewed visual pixels beyond the approved pending-task heading copy", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const actual: Baselines = {};
  const referenceCopy: Baselines = {};

  for (const viewport of [
    { width: 375, height: 812, label: "mobile" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 1280, height: 900, label: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/design-system/pilots/cronograma?theme=mago-classico&scenario=default");
    const board = page.locator(".aa-study-task-board");
    await expect(board).toBeVisible();
    await settleVisualSurface(page, board);
    actual[`cronograma:mago-classico:${viewport.label}`] = await screenshotHash(
      board, join(process.cwd(), "test-results", "aa-cronograma-c43", `${viewport.label}-novo.png`),
    );

    // Comparison-only control: revert exactly the changed heading wording,
    // not CSS, layout or app data, and compare with the previously approved
    // immutable visual hashes. No production code or snapshots are altered.
    await board.locator("#upcoming-tasks-title").evaluate((heading) => {
      heading.textContent = "Tarefas futuras";
    });
    await settleVisualSurface(page, board);
    referenceCopy[`cronograma:mago-classico:${viewport.label}`] = await screenshotHash(
      board, join(process.cwd(), "test-results", "aa-cronograma-c43", `${viewport.label}-referencia.png`),
    );
  }

  console.log(`AA_CRONOGRAMA_PILOT_BASELINES_JSON=${JSON.stringify(actual)}`);
  console.log(`AA_CRONOGRAMA_PILOT_COPY_ONLY_REFERENCE_JSON=${JSON.stringify(referenceCopy)}`);
  // Original approved baselines remain unchanged. Only the confirmed text
  // change may alter the live pixels; rendering its prior wording must
  // reproduce all three previously reviewed screenshots byte-for-byte.
  expect(referenceCopy).toEqual(baselines);
  for (const key of Object.keys(actual)) {
    expect(actual[key], `Visible heading copy must change: ${key}`).not.toBe(referenceCopy[key]);
  }
});
