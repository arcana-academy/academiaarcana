import { expect, test } from "@playwright/test";

test("design-system showcase exposes visible keyboard focus and adequate targets", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/design-system?theme=mago-classico");

  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toBeVisible();

  const outline = await focused.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      width: Number.parseFloat(style.outlineWidth),
      style: style.outlineStyle,
    };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThanOrEqual(1);

  for (const control of await page.locator("button, input, select").all()) {
    const box = await control.boundingBox();
    if (!box) continue;
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

test("altered landing and showcase reflow at 320 CSS px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });

  for (const path of ["/", "/design-system?theme=mago-classico"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow, `horizontal overflow at ${path}`).toBe(false);
  }
});

test("representative text-spacing override does not create structural overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });

  for (const path of ["/", "/design-system?theme=mago-classico"]) {
    await page.goto(path);
    await page.addStyleTag({
      content: `
        p, li, label, input, button, a {
          line-height: 1.5 !important;
          letter-spacing: 0.12em !important;
          word-spacing: 0.16em !important;
        }
        p { margin-bottom: 2em !important; }
      `,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow, `text spacing overflow at ${path}`).toBe(false);
  }
});

test("semantic status samples remain labelled independently of color", async ({ page }) => {
  await page.goto("/design-system?theme=mago-classico");

  await expect(page.getByText("Sucesso", { exact: true })).toBeVisible();
  await expect(page.getByText("Atenção", { exact: true })).toBeVisible();
  await expect(page.getByText("Informação", { exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: /64%/ })).toHaveAttribute("aria-valuenow", "64");
});
