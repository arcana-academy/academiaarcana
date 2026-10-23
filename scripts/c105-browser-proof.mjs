import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const origin = "http://127.0.0.1:3000";
const output = "c105-artifacts";
mkdirSync(output, { recursive: true });
const chromiumBrowser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const checkpoints = [];
const failures = [];

try {
  for (const [surface, route] of [["login", "/login"], ["sanctuary-synthetic", "/__c105_visual_probe"]]) {
    for (const [device, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
      const page = await chromiumBrowser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const res = await page.goto(origin + route, { waitUntil: "networkidle", timeout: 120000 });
      if (res?.status() !== 200) throw new Error(surface + "/" + device + ": HTTP " + res?.status());
      if (surface === "login") {
        await page.getByRole("heading", { name: "Entre no seu santuário de estudos" }).waitFor();
        await page.getByLabel("Email").waitFor();
        await page.getByLabel("Senha").waitFor();
        await page.getByRole("button", { name: "Entrar" }).waitFor();
      } else {
        await page.getByRole("heading", { name: "Seu Santuário de aprendizagem" }).waitFor();
        await page.getByRole("region", { name: "Explore seus espaços de estudo" }).waitFor();
      }
      await page.screenshot({ path: output + "/" + surface + "-" + device + ".png", fullPage: true });
      const dims = await page.evaluate(() => ({
        viewport: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        title: document.title,
        h1: document.querySelector("h1")?.textContent,
        bodyHeight: document.body.scrollHeight
      }));
      const result = { surface, device, route, ...dims, errors };
      checkpoints.push(result);
      if (dims.scrollWidth > dims.viewport + 2) failures.push(surface + "/" + device + ": horizontal overflow " + dims.scrollWidth + " > " + dims.viewport);
      if (errors.length) failures.push(surface + "/" + device + ": " + errors.join("; "));
      await page.close();
    }
  }
} finally {
  await chromiumBrowser.close();
  writeFileSync(output + "/report.json", JSON.stringify({ sourceSha: "22e82f9ccb8cf5ae69423a8f5108deee84e6be62", proofType: "real Next dev login and synthetic Sanctuary component route (NOT authenticated production E2E)", checkpoints, failures }, null, 2));
}
if (failures.length) throw new Error("C105 visual browser issues: " + failures.join(" | "));
console.log("C105_BROWSER_PROOF_PASS", JSON.stringify(checkpoints));
