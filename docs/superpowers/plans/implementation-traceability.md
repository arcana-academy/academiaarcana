# Academia Arcana — Matriz de Rastreabilidade da Implementação

> Matriz operacional do Plano Mestre de Implementação.
> Esta matriz não cria requisitos novos. Ela registra requisitos aprovados,
> contratos existentes e pendências já evidenciadas.

## Convenções

| Status | Significado |
|---|---|
| `IMPLEMENTADO` | Existe contrato, teste e/ou implementação verificável no repositório |
| `PARCIAL` | Existe parte do contrato ou infraestrutura, mas a cobertura não é completa |
| `AUSENTE` | Não foi identificado contrato/implementação concreta |
| `PENDÊNCIA` | Evidência anterior exige decisão/correção posterior |
| `BLOQUEADO` | O incremento não possui evidência suficiente para implementação segura |
| `N/A` | Não aplicável ao incremento atual |

## Matriz

| ID | Requisito | Fase de origem | Contrato | Teste | Implementação | Segurança | Status |
|---|---|---|---|---|---|---|---|
| RT-001 | Arquitetura modular e fronteiras entre camadas/domínios | F1 + Foundation | `domain-policy.ts` + barrels públicos | `import-boundaries.test.ts` + `domain-policy.test.ts` | Estrutura modular existente | Fronteiras impedem acesso direto do domínio a React/Next/Supabase | IMPLEMENTADO |
| RT-002 | Identidade estável separada de perfil, contexto e permissões | F2 + F3 | `Identity` em `src/core/identity/contracts.ts` | Testes de identidade existentes | Integração com sessão/auth existente | Identidade não concede autorização por si só | IMPLEMENTADO |
| RT-003 | Autorização explícita e deny-by-default | F3 + Foundation | `AccessRequest`, `AccessDecision`, `AuthorizationPolicy` | Testes de autorização existentes | `evaluateAuthorization()` | Decisão explícita; ausência de policy resulta em negação | IMPLEMENTADO |
| RT-004 | Contratos públicos dos domínios | F3 | `src/domains/*/contracts.ts` + `index.ts` | `foundation-structure.test.ts` e testes de fronteira | Estrutura presente; vários contratos ainda placeholders | Domínios não expõem infraestrutura/presentation | PARCIAL |
| RT-005 | Commands concretos para casos de uso implementáveis | F3 + F4 + F5 | Por caso de uso | Por caso de uso | `SetMotionPreferenceCommand` implementado | Deve passar pelas fronteiras autorizadas | PARCIAL |
| RT-006 | Queries concretas para casos de leitura | F3 + F4 + F5 | Por caso de uso | Por caso de uso | `GetAccessibilityPreferencesQuery` implementado | Deve respeitar contexto/ownership/autorização quando aplicável | PARCIAL |
| RT-007 | Events concretos e rastreáveis | F3 + F4 + F5 | A definir por evento | A definir por evento | Não há evento concreto identificável neste estágio | Produtor/consumidor/idempotência/observabilidade ainda precisam ser concretizados | PARCIAL / BLOQUEADO PARA IMPLEMENTAÇÃO |
| RT-008 | Requests/Responses explícitos | F3 + F4 | `AccessRequest`/`AccessDecision` existentes; demais contratos por caso de uso | Testes correspondentes | Parcial | Não expor detalhes internos | PARCIAL |
| RT-009 | Erros estruturados | F3 + F4 | Contratos existentes em pontos específicos | Testes correspondentes | Taxonomia transversal ainda não consolidada | Separar domínio, autorização, validação e infraestrutura | PARCIAL |
| RT-010 | Validação de entrada na fronteira de aplicação | F3 + F4 | A definir por caso de uso | A definir por caso de uso | Existem validações pontuais | Entrada não confiável deve ser validada antes do domínio | PARCIAL |
| RT-011 | Idempotência quando semanticamente necessária | F3 + F4 | A definir por operação | A definir por operação | Não identificado mecanismo transversal consolidado | Evitar efeitos duplicados quando aplicável | PENDÊNCIA |
| RT-012 | Ports/adapters e isolamento de infraestrutura | F3 + Foundation | Conforme contrato do caso de uso | Testes de adapters correspondentes | Fronteira arquitetural existente | Domínio não acessa Supabase diretamente | PARCIAL |
| RT-013 | Contratos assíncronos | F3 + F4 + F5 | A definir por fluxo assíncrono | A definir por fluxo assíncrono | Não consolidado transversalmente | Idempotência e observabilidade quando aplicável | PENDÊNCIA |
| RT-014 | Webhooks/integrações externas | F3 + F4 + F5 | A definir por integração | A definir por integração | Não consolidado transversalmente | Validar origem, autorização e replay quando aplicável | PENDÊNCIA |
| SEC-001 | Correção da vulnerabilidade `@vitest/mocker` | V3 | Dependência de segurança | Quality Gate / auditoria de dependências | Vitest 4.1.11 presente na linha de implementação | Path Traversal / Arbitrary File Read | PENDÊNCIA |
| SEC-002 | Investigação/correção de exposição anônima conforme políticas RLS | V3 | Políticas Supabase/RLS | Testes de autorização/RLS a definir | Evidência existente | Risco relacionado a acesso anônimo | PENDÊNCIA |
| SEC-003 | Leaked Password Protection | V3 | Configuração Supabase Auth | Verificação de configuração | Proteção desabilitada na evidência anterior | Hardening de autenticação | PENDÊNCIA |
| SEC-004 | CSRF | V3 | A definir conforme fluxo | A definir | Não verificado transversalmente | Requer análise dos fluxos mutáveis | PENDÊNCIA |
| SEC-005 | XSS/RichEditor | V3 | Contrato de conteúdo/normalização a definir | Testes de sanitização a definir | Não verificado completamente | Conteúdo persistido não é automaticamente confiável | PENDÊNCIA |
| SEC-006 | Segurança da integração de IA | V3 | Contratos de contexto/ferramentas | Testes de autorização/contexto | Não verificado completamente | Contexto mínimo necessário; sem acesso universal | PENDÊNCIA |
| SEC-007 | Privacidade, retenção, exportação e exclusão | V3 | Contratos de trust/data a consolidar | Testes correspondentes | Cobertura completa não verificada | Princípio de mínimo acesso e governança | PENDÊNCIA |

## Estado da implementação

| Incremento | Evidência | Status |
|---|---|---|
| M1.2 | `SetMotionPreferenceCommand` com teste direcionado | IMPLEMENTADO |
| M1.3 | `GetAccessibilityPreferencesQuery` com teste direcionado | IMPLEMENTADO |
| M1.4.A | Survey não identificou infraestrutura/evento concreto | BLOQUEADO |
| M1.4.B | Não foi identificado caso de uso concreto que justifique Event | BLOQUEADO |
| M1.4.C | Learning/Planning/Gamification não possuem fluxos/contratos concretos suficientes para sustentar Event | BLOQUEADO |

### M1.4 — decisão

Não existe evidência suficiente para implementar um Event concreto
ou uma infraestrutura transversal de eventos sem introduzir arquitetura
especulativa.

M1.4 será retomado quando um fluxo real demonstrar necessidade concreta
de publicação e/ou consumo de evento.

## Regras de uso

1. Nenhum requisito novo deve ser criado nesta matriz sem origem formal.
2. Toda implementação futura deve apontar para pelo menos um ID desta matriz.
3. Uma pendência V2/V3 não reabre a fase de validação correspondente.
4. Uma correção de segurança deve possuir evidência que justifique sua inclusão.
5. Contratos genéricos não devem ser criados apenas para preencher a arquitetura.
6. Cada implementação significativa deve possuir teste correspondente.
7. O status deve ser atualizado somente após evidência verificável.
8. A ordem operacional permanece:

   F1 → F2 → F3 → F4 → F5 → Foundation → Validation → Quality Gate → Implementação

## Próximo incremento

**M1.5 — selecionar o próximo caso de uso implementável a partir dos requisitos e do estado verificável do repositório.***
