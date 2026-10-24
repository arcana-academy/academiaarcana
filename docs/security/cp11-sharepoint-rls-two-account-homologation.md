# AA-MASTER CP-11 — Plano de homologação SharePoint / RLS com dois sujeitos sintéticos

**Status:** PLANEJADO / NÃO EXECUTADO. **Gate:** P0 #536 + D1–D4 + DEP-C17 NO-GO. **Base técnica:** PR #598 `63f21d5a9e2af40e8fee5852c752ca14761eae75`, CP-10 `ac5f9f993aa14f9b6893795f27ea0c82dd99f7b2`.

## 0. Limites e autorização
- Este documento **não é autorização** para conexão com qualquer banco remoto, Supabase hospedado, SharePoint real, tenant Microsoft, migração, alteração de RLS, criação de conta de produção ou uso de credenciais.
- Executar somente após **autorização explícita e documentada** para um ambiente isolado e descartável, com responsável designado, projeto/URL validado como **não produção**, janela e procedimento de destruição.
- Priorizar banco Supabase local descartável com migrações já aprovadas, sem conexão à rede de produção. Para provar comportamento de serviços hospedados, exigir etapa separada em staging próprio autorizado e isolado.
- Nenhum teste utilizará `service_role`, credenciais de proprietário, sessão de administrador ou chaves de bypass RLS para **verificar** políticas. Eventual preparação de fixtures ocorre em etapa apartada, auditada e encerrada antes das verificações.
- Não registrar tokens JWT, refresh tokens, PII, nomes de usuários reais ou cookies em logs. Usar dois UUIDs e dados sintéticos (A e B).

## 1. Preparação verificável (somente futura)
1. Congelar SHA das migrações e dos testes. Confirmar migração `20260929172005_create_external_document_sources.sql` e concessões posteriores em `20260929220739_revoke_excess_external_document_source_privileges.sql`; inspecionar RLS efetivamente aplicadas **no ambiente autorizado**.
2. Criar as identidades **sintéticas** A e B no ambiente descartável. Validar `auth.uid()` associado ao `sub` correto e `role=authenticated`; não reutilizar contas existentes.
3. Preparar fonte S-A `owner_id=A`, `provider_id=microsoft-sharepoint`, `source_type=external_document`, ids/site/drive/item sintéticos. Preparar fonte S-B `owner_id=B`.
4. Usar chaves públicas/publishable e sessões separadas de A e B nos clientes de teste; preparar cliente anônimo distinto.
5. Confirmar `public.external_document_sources` com RLS ativa e políticas explícitas para SELECT/INSERT/UPDATE/DELETE com `(select auth.uid()) = owner_id`. Verificar grants reais de `authenticated`, ausência de privilégios anônimos e não utilização de bypass.

## 2. Matriz de homologação RLS (assertivas obrigatórias)
| Identidade | Operação | Alvo | Resultado esperado |
| --- | --- | --- | --- |
| A | SELECT por id/listagem | S-A | visível |
| A | SELECT por id/listagem | S-B | nenhum registro |
| B | SELECT por id/listagem | S-B | visível |
| B | SELECT por id/listagem | S-A | nenhum registro |
| anônimo | SELECT | S-A / S-B | nenhum registro/acesso negado |
| A | INSERT com owner_id=A | S-A2 | permitido se schema válido |
| A | INSERT com owner_id=B | S-B2 | negado por WITH CHECK |
| A | UPDATE de S-B | S-B | zero linhas modificadas / negado; S-B intacto |
| A | UPDATE owner_id de S-A para B | S-A | negado por WITH CHECK; propriedade intacta |
| A | DELETE de S-B | S-B | zero linhas afetadas; S-B intacto |
| A | DELETE de S-A2 | S-A2 | permitido |
| B | Mesmos negativos invertidos | S-A / S-B | isolamento simétrico |

**Oráculo:** sempre validar tanto a resposta como o estado da tabela lido por uma sessão de verificação legitimamente autorizada e distinta; não interpretar HTTP 200 com `[]` como autorização de acesso. Confirmar que um cliente não consegue consultar diretamente linhas de outro por endpoints de tabela, independentemente dos filtros da aplicação.

## 3. Matriz de rotas SharePoint com dados sintéticos (separada do RLS)
- Em ambiente autorizado com OAuth Microsoft **simulado** ou Graph stub, JWT A + cookie criptografado de B deve negar sites, drives, search, context GET/POST e leitura de fonte antes de qualquer consulta a Graph ou escrita no banco.
- JWT A + cookie A permite rotas de descoberta válidas; uma fonte de B conhecida pelo ID deve retornar 404, sem acesso à fonte/Graph e sem vazamento de dados.
- Com JWT A e cookie A, fonte S-A retorna conteúdo sintético e `Cache-Control: no-store` quando disponível; validar `owner_id=A`, `provider_id`, `source_type` e ID.
- Testar ausência de JWT, token inválido, token expirado, cookie adulterado e credencial ligada a outro sujeito. Evidência: resposta, correlação, ausência de chamada upstream e nenhuma exposição de token.
- Verificar de forma separada o comportamento de refresh OAuth, sem tenant/credenciais reais neste ciclo.

## 4. Critérios de GO técnico e interrupção
- Executar apenas quando houver autorização assinada para o alvo isolado, fixture sintética e proteção contra conexão acidental a produção.
- **PASS:** todos os cenários positivos têm sucesso, todos os negativos falham, nenhuma linha ou fonte cross-account é acessível/alterada, nenhum segredo aparece nos artefatos e rollback das fixtures foi confirmado.
- **FAIL/STOP:** qualquer acesso cruzado, mudança de propriedade, sucesso com `service_role`, fallback a produção, dúvida sobre URL/identidade, logs sensíveis ou RLS diferente da migração examinada.
- Preservar checklist auditável com SHA do código, SHA das migrações, ID do ambiente autorizado (sem segredo), carimbo de execução, matriz caso a caso, logs redigidos e aprovação independente do responsável.
- Destruir fixtures/ambiente local e verificar limpeza após o teste; nenhuma limpeza de produção é autorizada.

## 5. Fronteiras metodológicas
- Os 8/8 testes sintéticos CP-10 e as regressões CP-11 são **unitárias/contratuais**, não representam homologação RLS de Postgres nem Microsoft Graph em produção.
- A migração contém políticas relevantes, mas a existência do arquivo **não comprova** o estado aplicado em banco remoto.
- Aprovação CI ou de IA não atende a D1. Mesmo GO técnico em sandbox **não** remove #536, D1–D4 ou DEP-C17.
- Referências oficiais: https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/local-development/testing/overview ; https://supabase.com/docs/guides/security/security-testing
