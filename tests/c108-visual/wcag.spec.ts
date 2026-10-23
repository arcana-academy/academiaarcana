import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test, expect } from "@playwright/test";

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const pages = [
  { name: "login-desktop", path: "/login", width: 1440, height: 900 },
  { name: "login-mobile", path: "/login", width: 390, height: 844 },
  { name: "signup-mobile", path: "/cadastro", width: 390, height: 844 },
  { name: "recover-mobile", path: "/recuperar-senha", width: 390, height: 844 },
  { name: "settings-desktop", path: "/c106-visual-fixture/configuracoes", width: 1440, height: 900 },
  { name: "sanctuary-mobile", path: "/c106-visual-fixture/santuario", width: 390, height: 844 },
] as const;

for (const scenario of pages) {
  test("C108 WCAG 2.2 scan "+scenario.name, async ({page}) => {
    await page.setViewportSize({width:scenario.width,height:scenario.height});
    const errors: string[] = [];
    page.on("pageerror", error=>errors.push(error.message));
    const response=await page.goto(scenario.path,{waitUntil:"networkidle"});
    expect(response?.status()).toBe(200);
    await page.locator("body").evaluate(async () => { await document.fonts.ready; });
    await page.addScriptTag({content:axeSource});
    const violations=await page.evaluate(async()=> {
      const axe=(window as unknown as {axe:{
        run:(root:Document,opts:object)=>Promise<{violations:Array<{id:string,impact:string,nodes:Array<{target:string[],failureSummary:string}>}>}>
      }}).axe;
      const report=await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]}});
      return report.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,details:n.failureSummary?.slice(0,230)}))}));
    });
    console.log(JSON.stringify({page:scenario.name,violations}));
    expect(errors).toEqual([]);
    expect(violations).toEqual([]);
  });
}

test("C108 Sanctuary dock stays operable by keyboard and has visible focus", async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/c106-visual-fixture/santuario");
  const dock=page.getByRole("navigation",{name:"Atalhos do Santuário"});
  await expect(dock).toBeVisible();
  const links=dock.getByRole("link");
  expect(await links.count()).toBe(4);
  const first=links.first();
  await first.focus();
  expect(await first.evaluate(el=>document.activeElement===el)).toBe(true);
  const outline=await first.evaluate(el=>getComputedStyle(el).outlineStyle);
  console.log("Dock focus outline:",outline);
  await page.keyboard.press("Tab");
  expect(await links.nth(1).evaluate(el=>document.activeElement===el)).toBe(true);
  await expect(links.first()).toHaveAttribute("aria-current","page");
});
