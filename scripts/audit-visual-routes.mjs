/** Read-only report. It never creates routes or implies a capability is authorized. */
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const existingStudent = [
  "academia","amigos","configuracoes","conquistas","cronograma","estatisticas",
  "foco","grimorios","missoes","perfil","personalizar","pratica","santuario",
  "streak","workspace",
];
const unauthenticated = ["login","cadastro","recuperar-senha","redefinir-senha"];
const authorizationPending = ["professor","tutor","mentor","consultoria"];
const check = (segment, category) => ({
  route: `/${segment}`,
  category,
  source: `src/app/${segment}/page.tsx`,
  pageExists: existsSync(join(root, "src", "app", segment, "page.tsx")),
  functionalVerification: "NAO_VERIFICADA",
});
const routes = [
  ...existingStudent.map((s) => check(s, "aluno")),
  ...unauthenticated.map((s) => check(s, "acesso")),
  ...authorizationPending.map((s) => check(s, "PROPOSTA_SEM_CONTRATO_DE_AUTORIZACAO")),
];
const totals = {
  declared: routes.length,
  filesPresent: routes.filter((r) => r.pageExists).length,
  filesAbsent: routes.filter((r) => !r.pageExists).length,
  pendingRoleContracts: authorizationPending.length,
};
process.stdout.write(`${JSON.stringify({ generatedBy: "audit-visual-routes", totals, routes }, null, 2)}\n`);
// Diagnostic only: missing proposals are not an automatic CI failure.
