import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { THEME_IDS } from "../../src/design-system/themes/presets";

type Baselines = Record<string, string>;

const baselinePath = join(process.cwd(), "tests/e2e/statistics-pilot-baselines.json");
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

test("StatisticsView pilot renders the real analytical view at representative viewports", async ({ page }) => {
  for (const viewport of [
    { width: 375, height: 812, label: "mobile" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 1280, height: 900, label: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/design-system/pilots/statistics?theme=mago-classico&scenario=mixed");

    await expect(page.getByTestId("statistics-production-pilot")).toHaveAttribute("data-pilot-status", "validation");
    await expect(page.locator("[data-statistics-view=production]")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Estatísticas", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Evidência objetiva" })).toBeVisible();
    await assertNoHorizontalOverflow(page, viewport.label);
  }
});

test("StatisticsView analytical styling stays M0-M1/T0/D0-D1 across all themes", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 900 });

  for (const themeId of THEME_IDS) {
    await page.goto(`/design-system/pilots/statistics?theme=${themeId}&scenario=mixed`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", themeId);

    const root = page.locator("[data-statistics-view=production]");
    const regions = root.locator("[data-statistics-region]");
    expect(await regions.count()).toBeGreaterThanOrEqual(7);

    const cards = root.locator(".aa-card");
    for (let index = 0; index < await cards.count(); index += 1) {
      const card = cards.nth(index);
      const styles = await card.evaluate((node) => {
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

      const heading = card.locator("h2").first();
      if (await heading.count()) {
        const textColor = await heading.evaluate((node) => getComputedStyle(node).color);
        expect(
          contrastRatio(textColor, styles.backgroundColor),
          `Statistics card contrast in ${themeId}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }

    await assertNoHorizontalOverflow(page, `theme:${themeId}`);
  }
});

test("StatisticsView preserves non-colour evidence semantics and progressbar semantics", async ({ page }) => {
  await page.goto("/design-system/pilots/statistics?scenario=mixed");

  await expect(page.getByRole("heading", { name: "Evidência autorreportada por conteúdo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evidência objetiva" })).toBeVisible();
  await expect(page.getByText(/fonte: autoavaliação/)).toBeVisible();
  await expect(page.getByText(/fonte: critério explícito/)).toBeVisible();

  const progress = page.getByRole("progressbar", { name: "Progresso para o próximo nível" });
  await expect(progress).toHaveAttribute("aria-valuemin", "0");
  await expect(progress).toHaveAttribute("aria-valuemax", "100");
  await expect(progress).toHaveAttribute("aria-valuenow", "40");
});

test("StatisticsView covers no-data, objective confirmation, review-gap and low-confidence scenarios", async ({ page }) => {
  await page.goto("/design-system/pilots/statistics?scenario=no-data");
  await expect(page.getByText("Sem atividades de prática ainda.")).toBeVisible();
  await expect(page.getByText(/A ausência aqui não significa ausência de aprendizagem/)).toBeVisible();
  await expect(page.getByText(/Isso não significa que todas as competências estejam dominadas/)).toBeVisible();
  await expect(page.getByText("Não há revisão liberada neste momento.")).toBeVisible();

  await page.goto("/design-system/pilots/statistics?scenario=objective-confirmed");
  await expect(page.getByText(/Confirmado/).first()).toBeVisible();
  await expect(page.getByText(/fonte: critério explícito/)).toBeVisible();

  await page.goto("/design-system/pilots/statistics?scenario=review-gap");
  await expect(page.getByRole("heading", { name: "Possíveis lacunas" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Revisar" })).toHaveAttribute(
    "href",
    "/pratica?pagina=page-cardio&item=self-cardio",
  );

  await page.goto("/design-system/pilots/statistics?scenario=low-confidence");
  await expect(page.getByText(/confiança Insuficiente/).first()).toBeVisible();
  await expect(page.getByText("1 tentativa(s)")).toBeVisible();
});

test("StatisticsView preserves keyboard focus and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-system/pilots/statistics?scenario=mixed");

  const link = page.getByRole("link", { name: "Praticar" });
  await link.focus();
  await expect(link).toBeFocused();

  const outline = await link.evaluate((node) => {
    const computed = getComputedStyle(node);
    return { style: computed.outlineStyle, width: Number.parseFloat(computed.outlineWidth) };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThan(0);

  const transitionMs = await page.locator(".aa-progress-value").evaluate((node) => {
    const raw = getComputedStyle(node).transitionDuration.split(",")[0]?.trim() ?? "0s";
    const value = Number.parseFloat(raw);
    return raw.endsWith("ms") ? value : value * 1000;
  });
  expect(transitionMs).toBeLessThanOrEqual(0.01);
});

test("StatisticsView remains usable when AA-ASSET-004 fails", async ({ page }) => {
  await page.route("**/assets/**", (route) => route.abort());
  await page.goto("/design-system/pilots/statistics?scenario=mixed");

  await expect(page.getByRole("heading", { name: "Continuidade" })).toBeVisible();
  await expect(page.getByText("6 dias")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evidência objetiva" })).toBeVisible();
  await expect(page.getByText(/fonte: critério explícito/)).toBeVisible();
});

test("StatisticsView records performance evidence without inventing a budget", async ({ page }) => {
  await page.goto("/design-system/pilots/statistics?scenario=review-gap");
  const metrics = await page.locator("[data-statistics-view=production]").evaluate((node) => ({
    descendants: node.querySelectorAll("*").length,
    images: node.querySelectorAll("img").length,
    filters: [...node.querySelectorAll("*")].filter((element) => {
      const style = getComputedStyle(element);
      return style.filter !== "none" || style.backdropFilter !== "none";
    }).length,
    activeAnimations: document.getAnimations().filter((animation) => animation.playState === "running").length,
  }));

  console.log(`AA_STATISTICS_PILOT_PERF_JSON=${JSON.stringify(metrics)}`);
  expect(metrics.filters).toBe(0);
});

test("StatisticsView production pilot matches deterministic visual baselines", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const actual: Baselines = {};

  for (const viewport of [
    { width: 375, height: 812, label: "mobile" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 1280, height: 900, label: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/design-system/pilots/statistics?theme=mago-classico&scenario=mixed");
    const root = page.locator("[data-statistics-view=production]");
    await expect(root).toBeVisible();
    await settleVisualSurface(page, root);
    actual[`statistics:mago-classico:${viewport.label}`] = await screenshotHash(root);
  }

  console.log(`AA_STATISTICS_PILOT_BASELINES_JSON=${JSON.stringify(actual)}`);
  expect(actual).toEqual(baselines);
});
