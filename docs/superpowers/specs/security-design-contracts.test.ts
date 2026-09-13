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

  it("requires an unambiguous, verified final configuration before closure", () => {
    const acceptanceCriteria = section(sec003, "5. Critérios de aceitação");

    expectAll(acceptanceCriteria, [
      "projeto Supabase auditado estiver identificado sem ambiguidade por um identificador estável",
      "`supabaseUrl` obtido por `getPublicRuntimeConfig()` estiver demonstradamente associado ao mesmo projeto",
      "correspondência do projeto estiver registrada na evidência e na matriz de rastreabilidade",
      "estado da proteção tiver sido diretamente verificado",
      "estado anterior tiver sido determinado e registrado antes de qualquer alteração",
      "aprovação registrada antes da execução, contendo aprovador, data e referência rastreável da aprovação",
      "estado final estiver habilitado",
      "evidência registrável do estado final, incluindo a correspondência do projeto, o estado anterior e a aprovação",
      "associada ao identificador SEC-003 e ao ambiente correto",
    ]);
  });

  it("requires approval and project matching before changing provider configuration", () => {
    const design = section(sec003, "3. Decisão de design");
    const validation = section(sec003, "8. Testes e validação");

    expectAll(design, [
      "aprovação registrada",
      "aprovador, a data e uma referência rastreável à aprovação",
      "Nenhuma alteração de configuração poderá ocorrer antes dessa aprovação.",
      "identificar projeto/ambiente → validar correspondência do projeto → registrar estado anterior → registrar aprovação → habilitar se necessário",
    ]);
    expectAll(validation, [
      "identificar o projeto por identificador estável",
      "obter o `supabaseUrl` por `getPublicRuntimeConfig()` e comparar sua correspondência com o projeto identificado",
      "executar a alteração somente se necessária e somente após aprovação",
    ]);
  });

  it("records auditable evidence without leaking credentials", () => {
    const privacy = section(sec003, "6. Segurança e privacidade");
    const traceability = section(sec003, "9. Observabilidade e rastreabilidade");

    expect(privacy).toContain(
      "Nenhuma senha, token, secret ou dado sensível será incluído na evidência versionada.",
    );
    expectAll(traceability, [
      "projeto/ambiente Supabase",
      "identificador estável do projeto Supabase",
      "`supabaseUrl` obtido por `getPublicRuntimeConfig()`",
      "`supabaseUrl` usado por `createBrowserClient` em `src/infrastructure/supabase/browser.ts`",
      "data da verificação",
      "estado anterior, obrigatoriamente determinado antes da alteração",
      "aprovador",
      "data da aprovação",
      "referência rastreável da aprovação",
      "ação executada, quando houver",
      "estado final",
      "referência à evidência utilizada",
    ]);
  });

  it("fails closed when execution prerequisites cannot be evidenced", () => {
    const validation = section(sec003, "8. Testes e validação");
    const closure = section(sec003, "10. Encerramento");

    expect(validation).toContain(
      "A ausência de estado anterior determinável impede a execução e o encerramento de SEC-003.",
    );
    expectAll(closure, [
      "somente se o estado anterior estiver determinado, a aprovação prévia estiver registrada e a correspondência do projeto estiver comprovada",
      "Na ausência de qualquer desses elementos, SEC-003 permanece aberto e não pode ser concluído como resolvido.",
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
    ]);
    expectAll(architecture, [
      "A camada de apresentação não é fronteira de segurança.",
      "deve ser protegido no servidor",
      "políticas RLS coerentes com ownership/contexto",
      "Nenhuma implementação deverá confiar em metadados controlados pelo cliente para autorização.",
    ]);
  });

  it("covers derived copies and bounds post-deletion audit retention", () => {
    const retention = section(sec007, "6. Retenção");
    const auditing = section(sec007, "11. Observabilidade e auditoria");

    expectAll(retention, [
      "backups, caches, índices de busca e outras cópias derivadas",
      "retenção, eliminação/anonimização e verificação para cada cópia e processador",
    ]);
    expectAll(auditing, [
      "por até 5 anos",
      "desde que pseudonimizados e sem conteúdo pessoal",
      "identificador pseudonimizado do titular",
      "identificador pseudonimizado da solicitação ou correlação",
      "identificadores diretos, payloads e demais dados pessoais deverão ser eliminados ou anonimizados",
    ]);
  });

  it("qualifies data-subject rights by applicability and legal limits", () => {
    const rights = section(sec007, "5. Direitos do titular");

    expectAll(rights, [
      "confirmação da existência de tratamento e acesso",
      "correção de dados incompletos, inexatos ou desatualizados",
      "anonimização, bloqueio ou eliminação nos casos aplicáveis",
      "portabilidade nos casos e condições aplicáveis",
      "revogação de consentimento quando o tratamento tiver consentimento como base legal",
      "não deve prometer direitos de forma mais ampla ou irrestrita do que a legislação aplicável permite",
    ]);
  });

  it("minimizes and authorizes any future AI context", () => {
    const artificialIntelligence = section(sec007, "10. Inteligência artificial");

    expectAll(artificialIntelligence, [
      "minimização do contexto fornecido à IA",
      "A IA não recebe implicitamente o banco inteiro, conteúdo de terceiros ou privilégios equivalentes aos do usuário/administrador.",
      "previamente autorizado e mínimo para a tarefa",
      "não cria uma implementação de IA agora",
    ]);
  });

  it("defines negative authorization cases for future feature tests", () => {
    const qualityGate = section(sec007, "13. Testes e Quality Gate");

    expectAll(qualityGate, [
      "Requirement → Contract → Test → Code → Security → Persistence → Observability → Quality Gate",
      "titular acessa apenas o próprio escopo",
      "usuário não autenticado é negado",
      "usuário sem autorização adequada é negado",
      "exportação não inclui dados de terceiros",
      "exclusão respeita exceções de conservação",
      "exclusão não apaga automaticamente dados pertencentes a terceiros",
      "mudança de contexto não reseta a conta ou trajetória",
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
      "compatível com ownership, autorização, contexto e RLS",
      "Não existirem tabelas/migrations criadas apenas para “resolver” o gap",
    ]);
  });
});
