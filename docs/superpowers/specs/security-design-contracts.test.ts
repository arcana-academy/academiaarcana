import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const specsRoot = dirname(fileURLToPath(import.meta.url));

const sec003 = readFileSync(
  join(specsRoot, "2026-09-12-sec-003-leaked-password-protection-design.md"),
  "utf8",
);
const sec007 = readFileSync(
  join(specsRoot, "2026-09-12-sec-007-data-lifecycle-and-privacy-design.md"),
  "utf8",
);

function section(markdown: string, heading: string): string {
  const marker = `## ${heading}`;
  const start = markdown.indexOf(marker);

  if (start === -1) {
    throw new Error(`Missing specification section: ${heading}`);
  }

  const remainder = markdown.slice(start + marker.length);
  const nextHeading = remainder.indexOf("\n## ");
  return nextHeading === -1 ? remainder : remainder.slice(0, nextHeading);
}

function expectAll(text: string, requirements: readonly string[]): void {
  for (const requirement of requirements) {
    expect(text, `missing requirement: ${requirement}`).toContain(requirement);
  }
}

describe("SEC-003 leaked-password protection design", () => {
  it("keeps remediation at the provider boundary", () => {
    expectAll(sec003, [
      "**Status:** Design for review",
      "**Security item:** SEC-003",
      "nenhuma alteração de código da aplicação nesta etapa",
      "Nenhum código da aplicação será alterado exclusivamente para resolver SEC-003.",
      "Nenhuma migration ou tabela deve ser criada",
    ]);
  });

  it("requires approval and an unambiguous, verified configuration before closure", () => {
    const decision = section(sec003, "3. Decisão de design");
    const acceptanceCriteria = section(sec003, "5. Critérios de aceitação");

    expectAll(decision, [
      "aprovação registrada",
      "aprovador, a data e uma referência rastreável à aprovação",
      "Nenhuma alteração de configuração poderá ocorrer antes dessa aprovação.",
    ]);
    expectAll(acceptanceCriteria, [
      "projeto Supabase auditado estiver identificado sem ambiguidade por um identificador estável",
      "supabaseUrl",
      "mesmo projeto identificado pelo identificador estável",
      "estado anterior tiver sido determinado e registrado antes de qualquer alteração",
      "Existir aprovação registrada antes da execução",
      "aprovador, data e referência rastreável da aprovação",
      "estado final estiver habilitado",
      "evidência registrável do estado final",
      "associada ao identificador SEC-003 e ao ambiente correto",
    ]);
  });

  it("records auditable evidence without leaking credentials", () => {
    const privacy = section(sec003, "6. Segurança e privacidade");
    const traceability = section(sec003, "9. Observabilidade e rastreabilidade");
    const validation = section(sec003, "8. Testes e validação");

    expect(privacy).toContain(
      "Nenhuma senha, token, secret ou dado sensível será incluído na evidência versionada.",
    );
    expectAll(validation, [
      "registrar o estado anterior antes de qualquer alteração",
      "A ausência de estado anterior determinável impede a execução e o encerramento de SEC-003.",
    ]);
    expectAll(traceability, [
      "identificador estável do projeto Supabase",
      "`supabaseUrl` obtido por `getPublicRuntimeConfig()`",
      "correspondência verificada entre o identificador estável e o `supabaseUrl` usado por `createBrowserClient`",
      "data da verificação",
      "estado anterior, obrigatoriamente determinado antes da alteração",
      "aprovador",
      "data da aprovação",
      "referência rastreável da aprovação",
      "estado final",
      "referência à evidência utilizada",
    ]);
  });
});

describe("SEC-007 data-lifecycle and privacy design", () => {
  it("defines every governed data category and its minimum contract", () => {
    const categories = section(sec007, "3. Categorias de dados");
    const minimumRequirements = section(
      sec007,
      "4. Requisitos mínimos por categoria",
    );

    expectAll(categories, [
      "### 3.1 Identidade e autenticação",
      "### 3.2 Perfil e preferências",
      "### 3.3 Conteúdo acadêmico",
      "### 3.4 Dados operacionais",
      "### 3.5 Dados derivados",
      "categorias de dados",
      "não autoriza a criação automática de schemas, tabelas ou colunas",
    ]);
    expectAll(minimumRequirements, [
      "finalidade",
      "necessidade/minimização",
      "base legal aplicável",
      "retenção",
      "mecanismo de acesso",
      "mecanismo de correção",
      "exportação/portabilidade quando aplicável",
      "exclusão, anonimização ou bloqueio quando aplicável",
      "exceções de conservação",
      "evidência e auditoria",
    ]);
  });

  it("does not confirm deletion while any owner remains unresolved", () => {
    const deletion = section(sec007, "7. Fluxo de exclusão");

    expectAll(deletion, [
      "`recebida`",
      "`autorizada`",
      "`em execução`",
      "`aguardando nova tentativa`",
      "`em reconciliação`",
      "`confirmada`",
      "`falha terminal`",
      "`eliminado`",
      "`anonimizado`",
      "`conservação restrita`",
      "todos os proprietários aplicáveis alcançarem um estado terminal verificado",
      "Enquanto houver proprietário pendente, falha não reconciliada ou verificação ausente, o pedido não poderá ser confirmado.",
      "novas tentativas idempotentes ou ações compensatórias",
      "RLS no Supabase, inclusive em fluxos server-side",
      "controle equivalente que valida ownership e/ou contexto",
      "`requireAuthenticatedUser` ou equivalente de autenticação não substitui",
      "mudança de contexto",
      "conta, sua trajetória ou seus dados históricos",
      "A invariável é: trocar o contexto não pode apagar nem redefinir a conta ou os dados históricos do usuário.",
    ]);
  });

  it("prevents cross-user disclosure and client-controlled authorization", () => {
    const exportAndAccess = section(sec007, "8. Exportação e acesso");
    const architecture = section(sec007, "9. Segurança por arquitetura");

    expectAll(exportAndAccess, [
      "exigir autenticação e autorização adequadas",
      "limitar o conteúdo ao escopo pertencente ao titular",
      "não expor dados de terceiros",
      "evitar inclusão de segredos, credenciais ou material interno",
      "RLS ou ao controle server-side equivalente documentado na seção 7",
      "Autenticação por si só não é suficiente",
    ]);
    expectAll(architecture, [
      "A camada de apresentação não é fronteira de segurança.",
      "deve ser protegido no servidor",
      "políticas RLS coerentes com ownership/contexto",
      "Nenhuma implementação deverá confiar em metadados controlados pelo cliente para autorização.",
    ]);
  });

  it("covers derived copies, bounded audit evidence, and post-deletion retention", () => {
    const retention = section(sec007, "6. Retenção");
    const auditing = section(sec007, "11. Observabilidade e auditoria");

    expectAll(retention, [
      "backups, caches, índices de busca e outras cópias derivadas",
      "retenção, eliminação/anonimização e verificação para cada cópia e processador",
    ]);
    expectAll(auditing, [
      "ator da operação",
      "titular ou escopo de dados afetado",
      "operação executada",
      "resultado",
      "instante da operação",
      "senhas",
      "tokens",
      "secrets",
      "credenciais",
      "conteúdo pessoal não necessário",
      "por até 5 anos",
      "Qualquer identificador pseudonimizado deverá continuar sendo tratado como dado pessoal enquanto houver informação adicional ou outro meio razoável que permita sua associação com o titular",
      "pseudonimização não equivale a anonimização",
      "A informação adicional usada para reidentificação deverá ser mantida separadamente",
      "em ambiente controlado e seguro",
      "com acesso restrito aos papéis autorizados",
      "registro dos acessos de reidentificação",
      "finalidade legítima de segurança, obrigação legal/regulatória ou exercício regular de direitos",
      "regra própria de retenção e eliminação",
      "identificador pseudonimizado do titular",
      "identificador pseudonimizado da solicitação ou correlação",
      "identificadores diretos, payloads e demais dados pessoais desnecessários deverão ser eliminados ou anonimizados",
      "A comprovação desses cinco campos obrigatórios e das exclusões de dados proibidos deverá fazer parte da validação",
    ]);
  });

  it("keeps persistence and product implementation behind future review gates", () => {
    const persistence = section(sec007, "12. Persistência");
    const acceptanceCriteria = section(
      sec007,
      "14. Critérios de aceitação da especificação",
    );

    expect(persistence).toContain(
      "Esta especificação **não autoriza** criação de migrations, tabelas, views, buckets ou funções de banco.",
    );
    expectAll(acceptanceCriteria, [
      "Cada novo fluxo de dados declarar finalidade e necessidade",
      "definir retenção e regra de descarte",
      "Exceções de conservação forem identificadas",
      "incluindo RLS obrigatório para dados com escopo de titular em fluxos server-side",
      "autenticação isolada não satisfaz este requisito",
      "Não existirem tabelas, migrations, views, buckets ou funções de banco criados apenas para resolver o gap",
      "cinco campos mínimos de evidência — ator, titular/escopo, operação, resultado e instante",
      "ausência de senhas, tokens, secrets e conteúdo pessoal desnecessário",
      "Mudanças de contexto preservarem a conta e os dados históricos do usuário",
    ]);
  });
});
