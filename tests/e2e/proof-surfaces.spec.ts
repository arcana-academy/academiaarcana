import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { THEME_IDS } from "../../src/design-system/themes/presets";
import { PROOF_IDS } from "../../src/design-system/proofs/proof-registry";

type Baselines = Record<string, string>;

const baselinePath = join(process.cwd(), "tests/e2e/proof-visual-baselines.json");
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

function parseRgb(value: string): [number, number, number] {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Unsupported RGB value: ${value}`);
  return channels as [number, number, number];
}

function luminance([red, green, blue]: [number, number, number]): number {
  const channels = [red, green, blue].map((value) => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string): number {
  const first = luminance(parseRgb(foreground));
  const second = luminance(parseRgb(background));
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

test("four proof surfaces expose A/B/C at representative viewports without overflow", async ({ page }) => {
  for (const viewport of [
    { width: 375, height: 812, label: "mobile" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 1280, height: 900, label: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/design-system/proofs?theme=mago-classico");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "mago-classico");
    await expect(page.getByTestId("proof-showcase")).toHaveAttribute("data-proof-status", "experimental");
    await assertNoHorizontalOverflow(page, viewport.label);

    for (const proofId of PROOF_IDS) {
      for (const variant of ["current", "target", "negative"] as const) {
        await expect(page.getByTestId(`proof-${proofId}-${variant}`)).toBeVisible();
      }
    }
  }
});

test("target proof content plates preserve measured text contrast", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  for (const themeId of THEME_IDS) {
    await page.goto(`/design-system/proofs?theme=${themeId}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", themeId);

    for (const proofId of PROOF_IDS) {
      const target = page.getByTestId(`proof-${proofId}-target`);
      const plate = target.locator("[data-proof-content-plate]");
      await expect(plate).toBeVisible();

      const background = await plate.evaluate((node) => getComputedStyle(node).backgroundColor);
      for (const copy of await target.locator("[data-proof-copy]").all()) {
        const foreground = await copy.evaluate((node) => getComputedStyle(node).color);
        expect(
          contrastRatio(foreground, background),
          `${themeId} ${proofId}: composed content-plate contrast`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  }
});

test("target proofs retain explicit keyboard focus independent of magic effects", async ({ page }) => {
  await page.goto("/design-system/proofs?theme=mago-classico");

  for (const proofId of PROOF_IDS) {
    const target = page.getByTestId(`proof-${proofId}-target`);
    const control = target.locator("button").first();
    await control.focus();
    await expect(control).toBeFocused();

    const outline = await control.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        style: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth),
      };
    });

    expect(outline.style, proofId).not.toBe("none");
    expect(outline.width, proofId).toBeGreaterThanOrEqual(1);
  }
});

test("reduced motion preserves proof meaning and removes target animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-system/proofs?theme=mago-classico");

  const target = page.getByTestId("proof-AA-PROOF-004-target");
  await expect(target.getByText("Primeiro ciclo completo", { exact: true })).toBeVisible();
  await expect(target.getByText(/progresso real desbloqueou/i)).toBeVisible();

  const animated = await target.locator("div").evaluateAll((nodes) =>
    nodes.map((node) => {
      const style = getComputedStyle(node);
      return { name: style.animationName, duration: style.animationDuration };
    }).filter((value) => value.name !== "none"),
  );

  expect(animated).toEqual([]);
});

test("target proofs remain functional when decorative assets fail", async ({ page }) => {
  await page.route("**/assets/**", (route) => route.abort());
  await page.goto("/design-system/proofs?theme=mago-classico");

  await expect(page.getByTestId("proof-AA-PROOF-001-target").getByText("18:42")).toBeVisible();
  await expect(page.getByTestId("proof-AA-PROOF-002-target").getByRole("button", { name: "Abrir grimório" })).toBeVisible();
  await expect(page.getByTestId("proof-AA-PROOF-003-target").getByRole("button", { name: "Continuar jornada" })).toBeVisible();
  await expect(page.getByTestId("proof-AA-PROOF-004-target").getByRole("button", { name: "Continuar" })).toBeVisible();
});

test("all supported themes preserve proof structure and reflow", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 900 });

  for (const themeId of THEME_IDS) {
    await page.goto(`/design-system/proofs?theme=${themeId}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", themeId);
    await assertNoHorizontalOverflow(page, themeId);

    for (const proofId of PROOF_IDS) {
      await expect(page.getByTestId(`proof-${proofId}-target`)).toBeVisible();
    }
  }
});

test("proof visual matrix matches deterministic A/B/C baselines", async ({ page }) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "reduce" });

  const actual: Baselines = {};

  for (const viewport of [
    { width: 375, height: 812, label: "mobile" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 1280, height: 900, label: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/design-system/proofs?theme=mago-classico");

    for (const proofId of PROOF_IDS) {
      for (const variant of ["current", "target", "negative"] as const) {
        const locator = page.getByTestId(`proof-${proofId}-${variant}`);
        actual[`${proofId}:${variant}:${viewport.label}`] = await screenshotHash(locator);
      }
    }
  }

  console.log(`AA_PROOF_BASELINES_JSON=${JSON.stringify(actual)}`);
  expect(actual).toEqual(baselines);
});

test("proof performance evidence is recorded without inventing a budget", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/design-system/proofs?theme=mago-classico");

  const assets = [
    "public/assets/focus/aa-focus-sigil.svg",
    "public/assets/grimoires/aa-grimoire-cover-base.svg",
    "public/assets/sanctuary/aa-sanctuary-sigil.svg",
    "public/assets/gamification/aa-achievement-emblem.svg",
  ];

  const evidence: Record<string, unknown> = {
    assetBytes: Object.fromEntries(
      assets.map((path) => [path, statSync(join(process.cwd(), path)).size]),
    ),
    targets: {},
  };

  for (const proofId of PROOF_IDS) {
    const target = page.getByTestId(`proof-${proofId}-target`);
    const metrics = await target.evaluate((node) => {
      const descendants = [...node.querySelectorAll("*")];
      const filtered = descendants.filter((element) => {
        const style = getComputedStyle(element);
        return style.filter !== "none" || style.backdropFilter !== "none";
      }).length;
      const infiniteAnimations = descendants.filter((element) => {
        const style = getComputedStyle(element);
        return style.animationIterationCount.split(",").some((value) => value.trim() === "infinite");
      }).length;

      return {
        domElements: descendants.length,
        filteredElements: filtered,
        infiniteAnimations,
      };
    });

    expect(metrics.infiniteAnimations, proofId).toBe(0);
    (evidence.targets as Record<string, unknown>)[proofId] = metrics;
  }

  console.log(`AA_PROOF_PERF_JSON=${JSON.stringify(evidence)}`);
});
