import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const surfaces = [
  { name: "cadastro-desktop", route: "/cadastro", w: 1440, h: 900, title: "Comece sua jornada" },
  { name: "cadastro-mobile", route: "/cadastro", w: 390, h: 844, title: "Comece sua jornada" },
  { name: "recuperacao-desktop", route: "/recuperar-senha", w: 1440, h: 900, title: "Recuperar acesso" },
  { name: "recuperacao-mobile", route: "/recuperar-senha", w: 390, h: 844, title: "Recuperar acesso" },
  { name: "configuracoes-desktop", route: "/c106-visual-fixture/configuracoes", w: 1440, h: 900, title: "Configurações" },
  { name: "configuracoes-mobile", route: "/c106-visual-fixture/configuracoes", w: 390, h: 844, title: "Configurações" },
  { name: "santuario-mobile", route: "/c106-visual-fixture/santuario", w: 390, h: 844, title: "Seu Santuário de aprendizagem" },
];
for (const s of surfaces) {
  test(s.name, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.setViewportSize({ width: s.w, height: s.h });
    const response = await page.goto(s.route, {waitUntil: "domcontentloaded"});
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", {name: s.title, exact: true})).toBeVisible();
    await page.locator("body").evaluate(async ()=>document.fonts.ready);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    if (s.route.startsWith("/cadastro")) {
      await expect(page.getByLabel("Confirmar senha")).toBeVisible();
      expect(await page.locator(".aa-auth-story").evaluate(e=>getComputedStyle(e).backgroundImage)).toContain("aa-login-ambiente-approved.webp");
    }
    if (s.route.startsWith("/recuperar-senha")) {
      await expect(page.getByRole("link", {name:"Voltar ao Login"})).toHaveAttribute("href", "/login");
    }
    if (s.route.includes("configuracoes")) {
      await expect(page.getByRole("link", { name: "Escolher tema" })).toHaveAttribute("href", "/personalizar");
    }
    if (s.name === "santuario-mobile") {
      const dock = page.getByRole("navigation", { name:"Atalhos do Santuário" });
      await expect(dock).toBeVisible();
      await expect(dock.getByRole("link", { name:"Início" })).toHaveAttribute("aria-current","page");
    }
    expect(errors).toEqual([]);
    mkdirSync("artifacts", {recursive:true});
    await page.screenshot({path: "artifacts/c106-"+s.name+".png", fullPage:true});
  });
}
