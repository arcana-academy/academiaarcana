import type { Locator, Page } from "@playwright/test";

type VisualBaselines = Record<string, string>;

/** Wait for hydrated theme tokens, fonts, images, and finite transitions. */
export async function settleVisualSurface(
  page: Page,
  root: Locator,
): Promise<void> {
  // data-theme can match the server HTML before the ThemeProvider effect has
  // committed its inline token set. The token is the observable hydration
  // boundary shared by every visual pilot.
  await page.waitForFunction(
    () =>
      document.documentElement.style
        .getPropertyValue("--aa-surfaces-panel")
        .trim().length > 0,
    null,
    { timeout: 10_000 },
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await root.evaluate((node) => {
    node.scrollIntoView({ block: "center", inline: "nearest" });
  });

  for (const image of await root.locator("img").all()) {
    await image.evaluate((node) => {
      node.scrollIntoView({ block: "center", inline: "nearest" });
    });
    await image.evaluate(async (node) => {
      const element = node as HTMLImageElement;
      if (!element.complete) {
        // Native lazy loading can leave an offscreen image dormant even after
        // its containing proof card is scrolled. Promote it before waiting so
        // the visual evidence never records an unrequested placeholder.
        element.loading = "eager";
        element.src = element.currentSrc || element.src;
      }
      if (!element.complete) {
        await new Promise<void>((resolve, reject) => {
          const finish = () => {
            clearTimeout(timeout);
            element.removeEventListener("load", finish);
            element.removeEventListener("error", finish);
            resolve();
          };
          const timeout = window.setTimeout(() => {
            element.removeEventListener("load", finish);
            element.removeEventListener("error", finish);
            reject(new Error(`Image did not settle: ${element.currentSrc || element.src}`));
          }, 5_000);
          element.addEventListener("load", finish);
          element.addEventListener("error", finish);
          // Close the race between the initial complete check and listener setup.
          if (element.complete) finish();
        });
      }
      if (element.complete && element.naturalWidth > 0) {
        await element.decode().catch(() => undefined);
      }
    });
  }

  await root.evaluate(async (node) => {
    const nextFrames = () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    const deadline = performance.now() + 10_000;
    let settledPasses = 0;

    while (performance.now() < deadline) {
      for (const element of [node, ...node.querySelectorAll("*")]) {
        const style = getComputedStyle(element);
        void style.color;
        void style.backgroundColor;
        void style.borderColor;
        void style.filter;
        void style.backdropFilter;
      }
      await nextFrames();

      const hasRunningAnimation = node
        .getAnimations({ subtree: true })
        .some((animation) => animation.playState === "running");
      settledPasses = hasRunningAnimation ? 0 : settledPasses + 1;
      if (settledPasses >= 2) return;
    }

    throw new Error("Visual surface did not settle within 10 seconds.");
  });
}

/**
 * Keep visual hashes visible in ordinary logs and surface mismatches as a
 * bounded GitHub notice. Artifact downloads can be unavailable to restricted
 * reviewers, while the hashes themselves contain no application data.
 */
export function reportVisualBaselineComparison(
  label: string,
  actual: VisualBaselines,
  expected: VisualBaselines,
): void {
  const serialized = JSON.stringify(actual);
  console.log(`${label}=${serialized}`);

  if (
    process.env.GITHUB_ACTIONS === "true" &&
    serialized !== JSON.stringify(expected)
  ) {
    const escaped = serialized
      .replaceAll("%", "%25")
      .replaceAll("\r", "%0D")
      .replaceAll("\n", "%0A");
    console.log(`::notice title=${label}::${escaped}`);
  }
}
