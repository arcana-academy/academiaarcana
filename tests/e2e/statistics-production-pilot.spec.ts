import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { THEME_IDS } from "../../src/design-system/themes/presets";

type Baselines = Record<string, string>;

const baselinePath = join(process.cwd(), "tests/e2e/statistics-pilot-baselines.json");
const baselines = JSON.parse(readFileSync(baselinePath, "utf8")) as Baselines;

async function screenshotHash(locator: Locator): Promise<{ hash: string; bytes: Buffer }> {
  const bytes = await locator.screenshot({ animations: "disabled" });
  return {
    hash: createHash("sha256").update(bytes).digest("hex"),
    bytes,
  };
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
  const [red, green, blue] = parseRgb(value).map(channelToLinear);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

test("StatisticsView stays usable at mobile, tablet and desktop sizes", async ({ page }) => {
  for (const viewport of [
    { width: 375, height: 812, label: "mobile" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 1280, height: 900, label: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/design-system/pilots/statistics?scenario=mixed-evidence&theme=mago-classico");

    await expect(page.getByTestId("statistics-production-pilot")).toBeVisible();
    await expect(page.getByTestId("statistics-view")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Estatísticas", exact: true })).toBeVisible();
    await assertNoHorizontalOverflow(page, viewport.label);
  }
});

test("prepared scenarios keep no-data, self-report and objective evidence distinct", async ({ page }) => {
  await page.goto("/design-system/pilots/statistics?scenario=no-data");
  const view = page.getByTestId("statistics-view");
  const progress = page.getByRole("progressbar", { name: "Progresso para o próximo nível" });

  await expect(view).toContainText("Sem atividades de prática ainda.");
  await expect(view).toContainText("Nenhuma avaliação objetiva foi criada ainda.");
  await expect(view).toContainText("Sem dados");
  await expect(progress).toHaveAttribute("aria-valuemin", "0");
  await expect(progress).toHaveAttribute("aria-valuemax", "100");
  await expect(progress).toHaveAttribute("aria-valuenow", "62");

  await page.getByTestId("statistics-pilot-scenario-select").selectOption("mixed-evidence");
  const selfReported = page.locator('[data-evidence-kind="self-reported"]');
  const objective = page.locator('[data-evidence-kind="objective"]');
  await expect(selfReported.getByRole("heading", { name: "Evidência autorreportada por conteúdo" })).toBeVisible();
  await expect(selfReported).toContainText("Autoavaliação em desenvolvimento");
  await expect(objective.getByRole("heading", { name: "Evidência objetiva" })).toBeVisible();
  await expect(objective).toContainText("Não confirmado");

  const boundaryStyles = await page.evaluate(() => ({
    selfReported: getComputedStyle(document.querySelector('[data-evidence-kind="self-reported"]')!).borderTopStyle,
    objective: getComputedStyle(document.querySelector('[data-evidence-kind="objective"]')!).borderTopStyle,
  }));
  expect(boundaryStyles.selfReported).toBe("solid");
  expect(boundaryStyles.objective).toBe("double");
});

test("objective confirmation, due review, gaps and low-confidence signals remain explicit", async ({ page }) => {
  await page.goto("/design-system/pilots/statistics?scenario=objective-confirmed");
  const objective = page.locator('[data-evidence-kind="objective"]');
  await expect(objective).toContainText("Confirmado");
  await expect(objective).toContainText("2/2 aprovações");
  await expect(page.locator('[data-evidence-kind="self-reported"]')).toContainText("Sem atividades de prática ainda.");

  await page.getByTestId("statistics-pilot-scenario-select").selectOption("review-gap");
  await expect(page.locator('[data-evidence-kind="learning-gap"]')).toContainText("Duas tentativas recentes indicam dificuldade.");
  await expect(page.getByRole("link", { name: "Investigar" })).toHaveAttribute(
    "href",
    "/pratica?pagina=page-fractions&item=self-item-gap",
  );
  await expect(page.getByRole("link", { name: "Revisar" })).toHaveAttribute(
    "href",
    "/pratica?pagina=page-fractions&item=self-item-gap",
  );

  await page.getByTestId("statistics-pilot-scenario-select").selectOption("low-confidence");
  await expect(page.locator(".statistics-view__profile")).toContainText("confiança Insuficiente");
  await expect(page.locator(".statistics-view__profile")).toContainText("1 tentativa(s)");
  const lowConfidenceEvidence = page.locator('[data-evidence-kind="self-reported"]');
  await expect(lowConfidenceEvidence).toContainText("Introdução às frações");
  await expect(lowConfidenceEvidence).toContainText("30% · 1 tentativa(s)");
  await expect(lowConfidenceEvidence).not.toContainText("Sem atividades de prática ainda.");
  await expect(page.locator('[data-evidence-kind="review"]')).toContainText(
    "Não há revisão liberada neste momento.",
  );
});

test("all 40 themes keep composed contrast, evidence boundaries and no overflow", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/design-system/pilots/statistics?scenario=mixed-evidence&theme=mago-classico");

  const themeSelect = page.getByTestId("statistics-pilot-theme-select");
  for (const themeId of THEME_IDS) {
    await themeSelect.selectOption(themeId);
    await expect(page.locator("html")).toHaveAttribute("data-theme", themeId);
    await assertNoHorizontalOverflow(page, `theme:${themeId}`);

    const surfaces = await page.evaluate(() => {
      const selectors = [
        ".statistics-view__educational-statistics",
        ".statistics-view__self-reported",
        ".statistics-view__objective",
      ];
      return selectors.map((selector) => {
        const surface = document.querySelector(selector)!;
        const heading = surface.querySelector("h2")!;
        return {
          foreground: getComputedStyle(heading).color,
          background: getComputedStyle(surface).backgroundColor,
          backgroundImage: getComputedStyle(surface).backgroundImage,
        };
      });
    });

    for (const [index, surface] of surfaces.entries()) {
      expect(contrastRatio(surface.foreground, surface.background), `${themeId}: section ${index} text contrast`).toBeGreaterThanOrEqual(4.5);
      expect(surface.backgroundImage, `${themeId}: section ${index} uses no decorative gradient`).toBe("none");
    }
  }
});

test("keyboard focus and reduced motion remain visible and predictable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-system/pilots/statistics?scenario=review-gap&theme=mago-classico");

  const themeSelect = page.getByTestId("statistics-pilot-theme-select");
  await themeSelect.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Praticar" })).toBeFocused();

  const focusStyle = await page.getByRole("link", { name: "Praticar" }).evaluate((node) => {
    const style = getComputedStyle(node);
    return { outlineStyle: style.outlineStyle, outlineWidth: Number.parseFloat(style.outlineWidth) };
  });
  expect(focusStyle.outlineStyle).not.toBe("none");
  expect(focusStyle.outlineWidth).toBeGreaterThan(0);

  const transitionMs = await page.locator(".aa-progress-value").evaluate((node) => {
    const raw = getComputedStyle(node).transitionDuration.split(",")[0]?.trim() ?? "0s";
    const value = Number.parseFloat(raw);
    return raw.endsWith("ms") ? value : value * 1000;
  });
  expect(transitionMs).toBeLessThanOrEqual(0.01);

  const domReadyMs = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return navigation.domContentLoadedEventEnd;
  });
  expect(domReadyMs, "the prepared projection should render without a long page stall").toBeLessThan(10_000);
});

test("learning data remains available when the decorative asset fails", async ({ page }) => {
  const failedRequests: string[] = [];
  page.on("requestfailed", (request) => failedRequests.push(request.url()));
  await page.route("**/assets/**", (route) => route.abort());
  await page.route("**/_next/image**", (route) => route.abort());
  await page.goto("/design-system/pilots/statistics?scenario=review-gap&theme=mago-classico", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByTestId("statistics-view")).toContainText("Evidência autorreportada por conteúdo");
  await expect(page.getByRole("progressbar", { name: "Progresso para o próximo nível" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Revisar" })).toBeVisible();
  expect(failedRequests.some((url) => url.includes("aa-contained-arcane-flame.svg"))).toBe(true);
});

test("StatisticsView matches reviewed deterministic screenshots at three viewport sizes", async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const actual: Baselines = {};
  const captureDir = process.env.STATISTICS_PILOT_CAPTURE_DIR;

  for (const viewport of [
    { width: 375, height: 812, label: "mobile" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 1280, height: 900, label: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/design-system/pilots/statistics?scenario=mixed-evidence&theme=mago-classico");
    const view = page.getByTestId("statistics-view");
    await expect(view).toBeVisible();
    const capture = await screenshotHash(view);
    if (captureDir) {
      mkdirSync(captureDir, { recursive: true });
      writeFileSync(join(captureDir, `statistics-${viewport.label}.png`), capture.bytes);
    }
    actual[`statistics:mago-classico:${viewport.label}`] = capture.hash;
  }

  // SHA-256 screenshots are meaningful only in the reference rasterization
  // environment (GitHub Actions on Linux). Other OS/font renderers can vary
  // byte-for-byte while preserving a correct and accessible visual layout.
  // Continue capturing on other platforms without treating those hashes as
  // proof of regression; the cross-platform semantic and responsive checks
  // above remain mandatory everywhere.
  const referenceRenderer =
    process.env.CI === "true" &&
    process.env.GITHUB_ACTIONS === "true" &&
    process.env.RUNNER_OS === "Linux";

  expect(Object.keys(actual)).toHaveLength(3);

  if (process.env.UPDATE_STATISTICS_PILOT_BASELINES === "1") {
    // Baseline updates require explicit human review before committing.
    writeFileSync(baselinePath, `${JSON.stringify(actual, null, 2)}\n`);
  } else if (referenceRenderer) {
    expect(actual).toEqual(baselines);
  } else {
    console.info(
      "Statistics screenshot hashes recorded for a non-reference renderer; " +
        "strict baseline comparison runs only on GitHub Actions Linux.",
    );
    console.info(`STATISTICS_PILOT_NON_REFERENCE_HASHES=${JSON.stringify(actual)}`);
  }
});
