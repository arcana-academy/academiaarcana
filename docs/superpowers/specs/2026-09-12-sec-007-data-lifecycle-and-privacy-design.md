# SEC-007 — Data Lifecycle and Privacy Design

**Status:** Design for review  
**Security item:** SEC-007  
**Phase:** Implementação rastreável, após V3  
**Baseline de auditoria:** `a2e7f0bdb37778f1a82666a6e1c644be3a432e76`  
**Scope:** contrato de governança e requisitos de produto para dados; nenhuma nova persistência nesta etapa

## 1. Objetivo

Converter o gap de governança identificado na V3 em um contrato verificável para privacidade, ciclo de vida, acesso, exportação e exclusão de dados da Academia Arcana.

SEC-007 não foi classificado como vulnerabilidade explorável. O objetivo deste trabalho é impedir que mecanismos futuros de persistência sejam implementados sem requisitos claros de privacidade e ciclo de vida.

## 2. Regra-base aprovada

**Os dados permanecem enquanto forem necessários para a finalidade do serviço; o titular pode solicitar seus direitos; a exclusão é realizada quando aplicável, preservando apenas o que houver fundamento legal para conservação.**

A regra reconhece que os direitos do titular possuem limites e que determinadas hipóteses podem exigir ou permitir conservação de dados.

## 3. Categorias de dados

O contrato inicial trabalha com **categorias de dados**, usadas para agrupar requisitos de tratamento, e não com novas tabelas. “Categoria de dados” identifica o tipo de informação e sua finalidade de governança; a estrutura física de armazenamento, quando necessária, será definida somente junto do requisito funcional correspondente.

### 3.1 Identidade e autenticação

Dados estritamente necessários para criação, autenticação, recuperação e manutenção da conta.

### 3.2 Perfil e preferências

Dados e configurações fornecidos pelo titular para personalização da experiência.

### 3.3 Conteúdo acadêmico

Conteúdo criado ou mantido pelo titular, como grimórios, páginas, tarefas e demais objetos acadêmicos que venham a ser persistidos.

### 3.4 Dados operacionais

Registros estritamente necessários para funcionamento, segurança, prevenção de abuso e auditoria legítima do serviço.

### 3.5 Dados derivados

Métricas e informações derivadas usadas para gamificação, personalização, progresso e funcionamento de recursos adaptativos.

A categorização não autoriza a criação automática de schemas, tabelas ou colunas. A estrutura física será definida somente junto do requisito funcional correspondente.

## 4. Requisitos mínimos por categoria

Antes de qualquer implementação persistente, cada categoria de dado deverá possuir definição explícita de:

- finalidade;
- necessidade/minimização;
- base legal aplicável;
- titular e contexto de acesso;
- compartilhamento, quando existir;
- retenção;
- mecanismo de acesso;
- mecanismo de correção;
- exportação/portabilidade quando aplicável;
- exclusão, anonimização ou bloqueio quando aplicável;
- exceções de conservação;
- evidência e auditoria.

## 5. Direitos do titular

O produto deverá ser projetado para suportar, quando aplicáveis ao tratamento:

- confirmação da existência de tratamento e acesso;
- correção de dados incompletos, inexatos ou desatualizados;
- anonimização, bloqueio ou eliminação nos casos aplicáveis;
- portabilidade nos casos e condições aplicáveis;
- informação sobre compartilhamento e tratamento;
- revogação de consentimento quando o tratamento tiver consentimento como base legal.

A implementação não deve prometer direitos de forma mais ampla ou irrestrita do que a legislação aplicável permite.

## 6. Retenção

Não será criado um prazo único para todos os dados.

A retenção deverá ser definida por finalidade e categoria, levando em conta necessidade operacional e eventuais obrigações legais ou regulatórias de conservação.

Quando a finalidade terminar e não houver fundamento para conservação, o dado deverá ser elegível para eliminação, anonimização ou outra destinação compatível com a obrigação aplicável.

Cada contrato de dados futuro deverá enumerar todas as cópias e todos os processadores, incluindo backups, caches, índices de busca e outras cópias derivadas, e definir regras de retenção, eliminação/anonimização e verificação para cada cópia e processador.

## 7. Fluxo de exclusão

A exclusão futura será um fluxo controlado, não um `delete` indiscriminado.

O pedido de exclusão deverá ser persistido em uma máquina de estados durável, com transições explícitas para `recebida`, `autorizada`, `em execução`, `aguardando nova tentativa`, `em reconciliação`, `confirmada` e `falha terminal`.

Para cada proprietário de dados aplicável, o pedido deverá manter resultado, estado, tentativas e evidência de verificação. Os resultados terminais verificados poderão ser `eliminado`, `anonimizado` ou `conservação restrita`; falhas parciais deverão permanecer identificadas e acionar novas tentativas idempotentes ou ações compensatórias, seguidas de reconciliação.

A confirmação só poderá ocorrer quando todos os proprietários aplicáveis alcançarem um estado terminal verificado. Enquanto houver proprietário pendente, falha não reconciliada ou verificação ausente, o pedido não poderá ser confirmado.

Modelo:

`solicitação → autenticação/autorização do titular → identificação do escopo de dados → verificação de exceções de conservação → execução por proprietário → novas tentativas/ações compensatórias e reconciliação quando necessário → verificação terminal por proprietário → confirmação → registro mínimo de auditoria`

Para todos os dados com escopo de titular, a proteção obrigatória deverá existir por meio de **RLS no Supabase, inclusive em fluxos server-side**, salvo exceção explicitamente documentada. A exceção deverá identificar o controle equivalente que valida ownership e/ou contexto do recurso e como essa validação é aplicada no servidor. **`requireAuthenticatedUser` ou equivalente de autenticação não substitui a validação de ownership/contexto nem a política de RLS.**

A execução deverá respeitar ownership, autorização e RLS. A mudança de contexto do usuário nunca deve apagar ou resetar automaticamente sua conta, sua trajetória ou seus dados históricos.

Nesta especificação, **mudança de contexto** significa a troca do contexto ativo no qual o usuário atua, como uma organização, turma, grupo, perfil de atuação ou outro escopo funcional suportado pelo produto. **Trajetória** inclui dados históricos que representam progresso, atividades acadêmicas, gamificação, preferências e demais registros persistentes associados ao titular ao longo do tempo. A invariável é: trocar o contexto não pode apagar nem redefinir a conta ou os dados históricos do usuário.

Dados pertencentes a terceiros ou registros cuja conservação seja obrigatória não serão apagados simplesmente porque o titular excluiu seus próprios dados.

## 8. Exportação e acesso

Qualquer mecanismo de exportação deverá:

- exigir autenticação e autorização adequadas;
- limitar o conteúdo ao escopo pertencente ao titular;
- não expor dados de terceiros;
- evitar inclusão de segredos, credenciais ou material interno não destinado ao titular;
- produzir uma resposta/formato definido pelo requisito funcional antes da implementação.

Fluxos de exportação e acesso a dados com escopo de titular também ficam sujeitos ao requisito de RLS ou ao controle server-side equivalente documentado na seção 7. Autenticação por si só não é suficiente para autorizar acesso ao recurso.

## 9. Segurança por arquitetura

SEC-007 preserva as fronteiras existentes:

`UI → Application / Use Cases → Domain → Ports / Contracts → Infrastructure`

Identidade, perfil, autorização e contexto permanecem conceitos distintos.

A camada de apresentação não é fronteira de segurança. Qualquer fluxo de acesso, exportação, correção ou exclusão deve ser protegido no servidor e, quando houver dados no Supabase expostos ao cliente, por políticas RLS coerentes com ownership/contexto.

Nenhuma implementação deverá confiar em metadados controlados pelo cliente para autorização.

## 10. Inteligência artificial

Caso recursos de IA sejam implementados futuramente, SEC-007 exige minimização do contexto fornecido à IA.

A IA não recebe implicitamente o banco inteiro, conteúdo de terceiros ou privilégios equivalentes aos do usuário/administrador. O contexto entregue deverá ser previamente autorizado e mínimo para a tarefa.

Isso permanece como requisito futuro; SEC-007 não cria uma implementação de IA agora.

## 11. Observabilidade e auditoria

Operações sensíveis de acesso, exportação e exclusão deverão possuir evidência mínima suficiente para investigação e conformidade.

Cada evidência de auditoria deverá conter, no mínimo:

- ator da operação;
- titular ou escopo de dados afetado;
- operação executada;
- resultado;
- instante da operação.

Quando um evento não possuir um titular direto, deverá registrar o escopo funcional aplicável. Quando o ator for um processo automatizado, isso deverá ser explicitamente identificável como ator do sistema.

É proibido registrar em evidência de auditoria:

- senhas;
- tokens;
- secrets;
- credenciais;
- payloads sensíveis desnecessários;
- conteúdo pessoal não necessário para demonstrar a operação.

Registros de auditoria deverão seguir a mesma política de retenção e necessidade, sem se tornarem um mecanismo de retenção indefinida por padrão. Excepcionalmente, após a exclusão dos dados do titular, poderão ser conservados por até 5 anos os registros estritamente necessários para cumprimento de obrigação legal ou regulatória e exercício regular de direitos. **Qualquer identificador pseudonimizado deverá continuar sendo tratado como dado pessoal enquanto houver informação adicional ou outro meio razoável que permita sua associação com o titular; pseudonimização não equivale a anonimização.** A informação adicional usada para reidentificação deverá ser mantida separadamente, em ambiente controlado e seguro, com acesso restrito aos papéis autorizados e registro dos acessos de reidentificação. A finalidade que justifica a possibilidade de reidentificação deverá ser documentada, limitada a finalidade legítima de segurança, obrigação legal/regulatória ou exercício regular de direitos, e a informação adicional deverá possuir regra própria de retenção e eliminação. O conjunto mínimo remanescente poderá incluir identificador pseudonimizado do titular, tipo da operação, data e hora, resultado da operação e identificador pseudonimizado da solicitação ou correlação; identificadores diretos, payloads e demais dados pessoais desnecessários deverão ser eliminados ou anonimizados.

A comprovação desses cinco campos obrigatórios e das exclusões de dados proibidos deverá fazer parte da validação de qualquer implementação de auditoria derivada desta especificação.

## 12. Persistência

Esta especificação **não autoriza** criação de migrations, tabelas, views, buckets ou funções de banco.

Cada mecanismo de persistência futuro deverá nascer de um requisito funcional concreto e passar por revisão de ownership, autorização, RLS, minimização e ciclo de vida.

## 13. Testes e Quality Gate

Qualquer implementação derivada desta especificação deverá demonstrar, quando aplicável:

`Requirement → Contract → Test → Code → Security → Persistence → Observability → Quality Gate`

Casos mínimos esperados para fluxos futuros incluem:

- titular acessa apenas o próprio escopo;
- usuário não autenticado é negado;
- usuário sem autorização adequada é negado;
- exportação não inclui dados de terceiros;
- exclusão respeita exceções de conservação;
- exclusão não apaga automaticamente dados pertencentes a terceiros;
- mudança de contexto não reseta a conta ou trajetória;
- dados com escopo de titular permanecem protegidos por RLS em fluxos client-side e server-side, ou possuem exceção equivalente explicitamente documentada;
- `requireAuthenticatedUser` isoladamente nunca é tratado como prova suficiente de ownership/contexto;
- evidências de auditoria contêm ator, titular/escopo, operação, resultado e instante, sem senhas, tokens, secrets ou conteúdo pessoal desnecessário.

Os testes concretos pertencem às features que implementarem esses fluxos e não devem ser inventados nesta etapa documental.

## 14. Critérios de aceitação da especificação

SEC-007 estará pronto para implementação funcional quando:

1. O contrato de ciclo de vida for aprovado.
2. Cada novo fluxo de dados declarar finalidade e necessidade.
3. O requisito correspondente definir retenção e regra de descarte.
4. O tratamento de acesso, exportação e exclusão estiver especificado para o recurso concreto.
5. Exceções de conservação forem identificadas quando aplicáveis.
6. O desenho de segurança estiver compatível com ownership, autorização, contexto e RLS, incluindo RLS obrigatório para dados com escopo de titular em fluxos server-side, ou controle equivalente explicitamente documentado para cada exceção; autenticação isolada não satisfaz este requisito.
7. Não existirem tabelas, migrations, views, buckets ou funções de banco criados apenas para resolver o gap sem requisito funcional.
8. Qualquer implementação de auditoria comprovar os cinco campos mínimos de evidência — ator, titular/escopo, operação, resultado e instante — e comprovar a ausência de senhas, tokens, secrets e conteúdo pessoal desnecessário.
9. Mudanças de contexto preservarem a conta e os dados históricos do usuário, conforme a invariável definida na seção 7.

## 15. Fora do escopo desta especificação

- política de privacidade jurídica final publicada;
- definição jurídica individual de base legal para cada futuro campo sem requisito funcional;
- implementação de painel de privacidade;
- implementação de exportação;
- implementação de exclusão de conta;
- criação de data-retention jobs;
- criação de novas tabelas ou migrations;
- implementação de IA.

Esses itens somente serão tratados quando um requisito de produto correspondente for aprovado.

## 16. Encerramento e rastreabilidade

SEC-007 permanece como **gap de governança/produto** até que os mecanismos de dados reais sejam definidos e implementados conforme este contrato.

A aprovação desta especificação não transforma SEC-007 retroativamente em vulnerabilidade e não reabre a V3. Qualquer implementação futura será vinculada explicitamente a SEC-007 e aos requisitos funcionais que a justificarem.
