import { test, expect } from "@playwright/test";
const base = "http://127.0.0.1:3105";
test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => {
    const url = route.request().url();
    if (url.startsWith(base) || url.startsWith("data:") || url.startsWith("blob:")) return route.continue();
    return route.abort("blockedbyclient");
  });
});
for (const [label, width, height] of [["desktop",1440,900],["mobile",390,844]] as const) {
  test(`Login C105 ${label}`,async ({page})=>{
    await page.setViewportSize({width,height});
    await page.goto(base+"/login",{waitUntil:"domcontentloaded"});
    await expect(page.getByRole("heading",{name:"Entre no seu santuário de estudos"})).toBeVisible();
    await expect(page.getByRole("button",{name:"Entrar"})).toBeVisible();
    await expect(page.getByRole("link",{name:"Criar conta"})).toBeVisible();
    const artwork=await page.locator(".aa-auth-story").evaluate(el=>getComputedStyle(el).backgroundImage);
    expect(artwork).toContain("aa-login-ambiente-approved.webp");
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({path:`artifacts/c105-login-${label}.png`,fullPage:true});
  });
  test(`Santuário sintético C105 ${label}`,async ({page})=>{
    await page.setViewportSize({width,height});
    await page.goto(base+"/c105-visual-sanctuary",{waitUntil:"domcontentloaded"});
    await expect(page.getByTestId("c105-synthetic")).toBeVisible();
    await expect(page.getByRole("heading",{name:"Seu Santuário de aprendizagem"})).toBeVisible();
    await expect(page.getByRole("link",{name:"Meus grimórios"}).first()).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({path:`artifacts/c105-sanctuary-${label}.png`,fullPage:true});
  });
}
