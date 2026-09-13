# SEC-003 — Leaked Password Protection Design

**Status:** Design for review  
**Security item:** SEC-003  
**Phase:** Implementação rastreável, após V3  
**Baseline de auditoria:** `a2e7f0bdb37778f1a82666a6e1c644be3a432e76`  
**Scope:** configuração do Supabase Auth; nenhuma alteração de código da aplicação nesta etapa

## 1. Objetivo

Eliminar a lacuna de evidência registrada na V3 sobre a configuração de **Leaked Password Protection** no projeto Supabase usado pela Academia Arcana.

O objetivo não é alterar o fluxo de autenticação da aplicação. A pendência é de configuração/evidência do provedor.

## 2. Estado de partida

A V3 classificou SEC-003 como **não verificado** porque a configuração administrativa não pôde ser confirmada pelos meios disponíveis durante a auditoria.

A aplicação já possui autenticação baseada no Supabase e o baseline técnico da aplicação foi aprovado. SEC-003 não reabre F4, Foundation ou o fluxo de autenticação já validado.

## 3. Decisão de design

A remediação será executada no projeto Supabase correto, por meio da configuração suportada de Auth.

Antes de qualquer execução no Supabase Auth, deve existir **aprovação registrada** para a execução da remediação. A aprovação deve identificar, no mínimo, o aprovador, a data e uma referência rastreável à aprovação. Nenhuma alteração de configuração poderá ocorrer antes dessa aprovação.

Fluxo:

`identificar projeto/ambiente → validar correspondência do projeto → registrar estado anterior → registrar aprovação → habilitar se necessário → verificar estado final → registrar evidência → encerrar SEC-003`

Nenhum código da aplicação será alterado exclusivamente para resolver SEC-003.

## 4. Escopo

### Incluído

- Confirmar o projeto Supabase e o ambiente correspondentes ao baseline.
- Identificar o projeto por um identificador estável do projeto Supabase.
- Obter o `supabaseUrl` por `getPublicRuntimeConfig()` e verificar que é o mesmo projeto referenciado pelo identificador estável.
- Verificar o estado atual da proteção contra senhas vazadas.
- Registrar obrigatoriamente o estado anterior antes de qualquer alteração.
- Registrar a aprovação prévia de execução antes de qualquer alteração.
- Habilitar a proteção se estiver desabilitada.
- Confirmar novamente o estado após a alteração.
- Registrar evidência suficiente para auditoria futura.
- Atualizar a matriz de rastreabilidade de segurança com a correspondência do projeto, a aprovação, a evidência e o resultado.

### Excluído

- Alteração de componentes React.
- Alteração de Server Actions.
- Alteração de middleware.
- Alteração de tabelas, migrations ou RLS.
- Troca do provedor de autenticação.
- Inclusão de biblioteca de segurança para compensar configuração do provedor.
- Qualquer mudança não relacionada a SEC-003.

## 5. Critérios de aceitação

SEC-003 poderá ser marcado como encerrado somente quando todos os itens seguintes forem verdadeiros:

1. O projeto Supabase auditado estiver identificado sem ambiguidade por um identificador estável.
2. O `supabaseUrl` obtido por `getPublicRuntimeConfig()` estiver demonstradamente associado ao mesmo projeto identificado pelo identificador estável.
3. A correspondência do projeto estiver registrada na evidência e na matriz de rastreabilidade.
4. O estado da proteção tiver sido diretamente verificado.
5. O estado anterior tiver sido determinado e registrado antes de qualquer alteração.
6. Existir aprovação registrada antes da execução, contendo aprovador, data e referência rastreável da aprovação.
7. O estado final estiver habilitado.
8. Existir evidência registrável do estado final, incluindo a correspondência do projeto, o estado anterior e a aprovação.
9. A evidência estiver associada ao identificador SEC-003 e ao ambiente correto.
10. Não houver alteração desnecessária no código da aplicação.

## 6. Segurança e privacidade

A configuração deve reduzir o risco de uso de credenciais comprometidas sem introduzir armazenamento adicional de senhas ou lógica equivalente na aplicação.

Nenhuma senha, token, secret ou dado sensível será incluído na evidência versionada. A evidência deve registrar apenas o mínimo necessário para demonstrar a configuração e seu estado.

## 7. Dados e persistência

Não há mudança de persistência da Academia Arcana para SEC-003.

Nenhuma migration ou tabela deve ser criada para representar uma configuração que já pertence ao Supabase Auth.

## 8. Testes e validação

Não é necessário criar teste unitário da aplicação para a alteração de configuração do provedor.

A validação obrigatória é operacional:

- identificar o projeto por identificador estável;
- obter o `supabaseUrl` por `getPublicRuntimeConfig()` e comparar sua correspondência com o projeto identificado;
- registrar o estado anterior antes de qualquer alteração;
- verificar a aprovação registrada antes da execução;
- executar a alteração somente se necessária e somente após aprovação;
- verificar configuração depois;
- registrar evidência.

A ausência de estado anterior determinável impede a execução e o encerramento de SEC-003.

Os Quality Gates de código permanecem aplicáveis quando houver mudança de código por outro motivo, mas não devem ser artificialmente ampliados para uma alteração puramente administrativa do provedor.

## 9. Observabilidade e rastreabilidade

A evidência deve conter, no mínimo:

- SEC-003;
- projeto/ambiente Supabase;
- identificador estável do projeto Supabase;
- `supabaseUrl` obtido por `getPublicRuntimeConfig()`;
- correspondência verificada entre o identificador estável e o `supabaseUrl` usado por `createBrowserClient` em `src/infrastructure/supabase/browser.ts`;
- data da verificação;
- estado anterior, obrigatoriamente determinado antes da alteração;
- aprovador;
- data da aprovação;
- referência rastreável da aprovação;
- ação executada, quando houver;
- estado final;
- referência à evidência utilizada.

A correspondência do projeto e os dados da aprovação também devem constar na matriz de rastreabilidade antes do encerramento.

## 10. Encerramento

Após evidência verificável do estado final, SEC-003 será encerrado como **resolvido por configuração do provedor** somente se o estado anterior estiver determinado, a aprovação prévia estiver registrada e a correspondência do projeto estiver comprovada.

Na ausência de qualquer desses elementos, SEC-003 permanece aberto e não pode ser concluído como resolvido.

Isso não altera a conclusão da V3 nem reabre qualquer etapa já validada. Qualquer novo comportamento observado posteriormente será tratado como nova evidência, não como reabertura automática deste item.
