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

async function settleVisualSurface(page: Page, root: Locator): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
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

    const gridColumns = await page.locator(".statistics-view__gamification .aa-feature-grid").evaluate(
      (element) => {
        const styles = getComputedStyle(element);
        return {
          display: styles.display,
          columns: styles.gridTemplateColumns.split(" ").filter(Boolean).length,
        };
      },
    );
    expect(gridColumns.display, `gamification grid display: ${viewport.label}`).toBe("grid");
    expect(gridColumns.columns, `gamification columns: ${viewport.label}`).toBeGreaterThanOrEqual(
      viewport.label === "mobile" ? 1 : 2,
    );

    const educationalGridColumns = await page
      .locator(".statistics-view__educational-statistics .aa-feature-grid")
      .evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
          display: styles.display,
          columns: styles.gridTemplateColumns.split(" ").filter(Boolean).length,
        };
      });
    expect(educationalGridColumns.display, `educational grid: ${viewport.label}`).toBe("grid");
    expect(
      educationalGridColumns.columns,
      `educational grid columns: ${viewport.label}`,
    ).toBeGreaterThanOrEqual(viewport.label === "mobile" ? 1 : 2);

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
    await page.goto("/design-system/pilots/statistics?scenario=mixed-evidence&theme=mago-classico");
    const view = page.getByTestId("statistics-view");
    await expect(view).toBeVisible();
    await settleVisualSurface(page, view);
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
