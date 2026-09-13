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

Fluxo:

`identificar projeto/ambiente → verificar estado atual → habilitar se necessário → verificar estado final → registrar evidência → encerrar SEC-003`

Nenhum código da aplicação será alterado exclusivamente para resolver SEC-003.

## 4. Escopo

### Incluído

- Confirmar o projeto Supabase e o ambiente correspondentes ao baseline.
- Verificar o estado atual da proteção contra senhas vazadas.
- Habilitar a proteção se estiver desabilitada.
- Confirmar novamente o estado após a alteração.
- Registrar evidência suficiente para auditoria futura.
- Atualizar a matriz de rastreabilidade de segurança com a evidência e o resultado.

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

1. O projeto Supabase auditado estiver identificado sem ambiguidade.
2. O estado da proteção tiver sido diretamente verificado.
3. O estado final estiver habilitado.
4. Existir evidência registrável do estado final.
5. A evidência estiver associada ao identificador SEC-003 e ao ambiente correto.
6. Não houver alteração desnecessária no código da aplicação.

## 6. Segurança e privacidade

A configuração deve reduzir o risco de uso de credenciais comprometidas sem introduzir armazenamento adicional de senhas ou lógica equivalente na aplicação.

Nenhuma senha, token, secret ou dado sensível será incluído na evidência versionada. A evidência deve registrar apenas o mínimo necessário para demonstrar a configuração e seu estado.

## 7. Dados e persistência

Não há mudança de persistência da Academia Arcana para SEC-003.

Nenhuma migration ou tabela deve ser criada para representar uma configuração que já pertence ao Supabase Auth.

## 8. Testes e validação

Não é necessário criar teste unitário da aplicação para a alteração de configuração do provedor.

A validação obrigatória é operacional:

- verificar configuração antes;
- executar a alteração somente se necessária;
- verificar configuração depois;
- registrar evidência.

Os Quality Gates de código permanecem aplicáveis quando houver mudança de código por outro motivo, mas não devem ser artificialmente ampliados para uma alteração puramente administrativa do provedor.

## 9. Observabilidade e rastreabilidade

A evidência deve conter, no mínimo:

- SEC-003;
- projeto/ambiente Supabase;
- data da verificação;
- estado anterior, quando conhecido;
- ação executada, quando houver;
- estado final;
- referência à evidência utilizada.

## 10. Encerramento

Após evidência verificável do estado final, SEC-003 será encerrado como **resolvido por configuração do provedor**.

Isso não altera a conclusão da V3 nem reabre qualquer etapa já validada. Qualquer novo comportamento observado posteriormente será tratado como nova evidência, não como reabertura automática deste item.
