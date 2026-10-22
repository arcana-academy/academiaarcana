import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

const A=process.env.E2E_EMAIL;
const B=process.env.E2E_EMAIL_B;
const password=process.env.E2E_PASSWORD;
const api=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(!A||!B||!password||process.env.AA_C70_QA!=="1"||process.env.AA_LOCAL_SUPABASE_E2E!=="1"||
   process.env.GITHUB_EVENT_NAME!=="push"||process.env.GITHUB_REF!=="refs/heads/work/aa360-c70-pr767-demo-exact-20261021"||
   !api||new URL(api).hostname!=="127.0.0.1"||new URL(api).protocol!=="https:"){
  throw new Error("C70 synthetic-only auth and loopback configuration required");
}
async function login(page:import("@playwright/test").Page,email:string){
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password!);
  await page.getByRole("button",{name:"Entrar"}).click();
  await expect(page).toHaveURL(/\/santuario(?:[/?#]|$)/);
}
test("C70 identity A: Academia paths, pending task, earned mission and private Profile",async({page})=>{
  await login(page,A!);
  await page.goto("/academia");
  await expect(page.getByRole("heading",{name:"Sua jornada de aprendizagem"})).toBeVisible();
  for(const title of ["Grimórios","Workspace","Cronograma","Missões","Prática","Santuário"])
    await expect(page.getByRole("main").getByRole("link",{name:new RegExp(title)}).first()).toBeVisible();
  mkdirSync("artifacts/aa360-c70-synthetic",{recursive:true});
  await page.screenshot({path:"artifacts/aa360-c70-synthetic/academia.png",fullPage:true});
  await page.goto("/cronograma");
  await expect(page.getByRole("heading",{name:"Cronograma",exact:true})).toBeVisible();
  await expect(page.getByText("C70 estudo pendente sintético")).toBeVisible();
  await expect(page.getByText("C70 tarefa de outra identidade")).toHaveCount(0);
  await page.screenshot({path:"artifacts/aa360-c70-synthetic/cronograma.png",fullPage:true});
  await page.goto("/missoes");
  await expect(page.getByRole("heading",{name:"Missões",exact:true})).toBeVisible();
  await expect(page.getByText("1/1 concluídas")).toBeVisible();
  await page.screenshot({path:"artifacts/aa360-c70-synthetic/missoes.png",fullPage:true});
  await page.goto("/perfil");
  await expect(page.getByRole("heading",{name:"Perfil",exact:true})).toBeVisible();
  await expect(page.getByText("Conta: "+A)).toBeVisible();
  await expect(page.getByRole("link",{name:"Gerenciar configurações"})).toHaveAttribute("href","/configuracoes");
  await page.reload();
  await expect(page.getByText("Conta: "+A)).toBeVisible();
  await page.screenshot({path:"artifacts/aa360-c70-synthetic/perfil.png",fullPage:true});
});
test("C70 identity B: independent task projection and absence of identity A's task",async({page})=>{
  await login(page,B!);
  await page.goto("/cronograma");
  await expect(page.getByText("C70 tarefa de outra identidade")).toBeVisible();
  await expect(page.getByText("C70 estudo pendente sintético")).toHaveCount(0);
  await page.goto("/perfil");
  await expect(page.getByText("Conta: "+B)).toBeVisible();
  await expect(page.getByText("Conta: "+A)).toHaveCount(0);
});
