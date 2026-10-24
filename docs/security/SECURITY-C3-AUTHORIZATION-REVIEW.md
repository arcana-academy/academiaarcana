# Security C3 — revisão de autenticação, autorização e isolamento de dados

**Data:** 2026-10-24 (UTC)  
**Escopo:** revisão estática do checkout atual; não é certificação de ambiente produtivo.  
**Resultado geral:** controles de ownership/RLS e RPC estão presentes em várias áreas; a validação dinâmica exigida está **BLOCKED**. Nenhuma conexão ou escrita em Supabase hospedado foi tentada.

## Limite de segurança e execução

A solicitação exige duas identidades sintéticas em Supabase local descartável e comprovação do isolamento de rede. O ambiente atual não permite afirmar isso: `docker info` falhou (código 127; Docker indisponível) e o binário `supabase` não está instalado. Não há evidência de instância Supabase local, regras de rede/egress ou isolamento descartável. Por isso **não** foram criadas identidades, executados testes contra banco, simuladas requisições de rede ou alegados resultados RED→GREEN. Não se deve apontar este relatório a um projeto hospedado: isso violaria a restrição de não alterar contas, autenticação ou RLS produtiva sem autorização.

Também não foi possível executar os testes automatizados: `node_modules` não existe. Os SQL tests existentes foram inspecionados, mas não executados.

## Superfície revisada

- Cadastro, login, recuperação e redefinição de senha (`src/components/auth/AuthForm.tsx`): recuperação usa resposta genérica (“Se o endereço estiver cadastrado…”); demais falhas são normalizadas em mensagem genérica. Cadastro valida mínimo local de 8 caracteres e não revela se endereço já existe na mensagem de sucesso. A aplicação não define política de senha do Auth (config externa não revisada).
- Callback de autenticação (`src/app/auth/callback/route.ts`): troca código por sessão e valida `next` para impedir URL externa e `//`; falha encaminha a mensagem genérica de login.
- Sessões/cookies (`src/infrastructure/supabase/session.ts`, `src/proxy.ts`): Supabase SSR administra cookies; middleware solicita claims e respostas recebem `Cache-Control: private, no-store`. Requer validação dinâmica de refresh, expiração, CSRF e revogação.
- Logout (`src/lib/auth/actions.ts`): solicita `signOut({scope: "global"})`; erro é lançado. Revogação efetiva de refresh tokens e comportamento de cookie não foram exercitados.
- Proteção de páginas (`src/lib/auth/require-authenticated-user.ts`): usa `getClaims()` e redireciona quando não autenticado. Claims são verificados no servidor; não encontrei implementação de papel administrativo/MFA neste checkout.
- Alteração de e-mail e MFA administrativo: não encontrei fluxo de alteração de e-mail, política de reautenticação para mudança de credenciais, nem implementação administrativa de MFA/step-up. Isso é lacuna de escopo funcional, não prova de falha no painel Supabase/Auth hospedado.
- Dados e privilégios: migrations cobrem grimoires/notebooks/capítulos/páginas, progresso, tarefas, XP/perfil de gamificação, missões, foco, conexões sociais, credenciais de integração, fontes externas, feedback e tentativas educacionais. Os SQL testes de autorização cobrem leitura exata por owner e vários casos negativos de escrita/alteração/exclusão. RPCs privilegiadas usam rotinas privadas `SECURITY DEFINER`, `search_path = ''` e grants explícitos nas migrations analisadas.
- Storage: bucket `grimoire-covers` é privado e limitado a MIME/tamanho; policies vinculam leitura/escrita ao proprietário. A migration `20261021201427_restrict_grimoire_cover_move_folder.sql` reforça `WITH CHECK` para impedir mover arquivo próprio sob prefixo de outra identidade.
- Grants/RLS em produção, usuários/roles administrativos e configurações Auth externas não foram consultados nem alterados.

## Achados e classificação

### S1 — validação dinâmica de isolamento indisponível (BLOCKED)

Não há execução real com dois JWT/usuários distintos nem prova de isolamento de rede. A revisão estática e SQL fixtures não substituem testes end-to-end no Postgres/Supabase. A abrangência e comportamento real de RLS, grants, Storage, Auth e RPC permanece **não verificada dinamicamente**.

**Ação:** disponibilizar runner descartável com Supabase CLI e Docker (ou ambiente isolado equivalente documentado), tráfego limitado a loopback/rede interna, sem credenciais produtivas; então executar migrações do zero e tentativas A→B de SELECT/INSERT/UPDATE/DELETE, RPC, Storage e sessão revogada. Se o isolamento não puder ser comprovado, manter BLOCKED.

### S2 — governança administrativa/MFA e alteração de e-mail não demonstradas (lacuna)

Nenhum fluxo administrativo privilegiado, MFA administrativo ou alteração de e-mail foi encontrado na aplicação revisada. Não inferir proteção por papéis a partir de UI ou metadata editável pelo usuário. Também não há evidência neste checkout da configuração do projeto Auth hospedado.

**Ação:** se tais capacidades forem necessárias, definir autorização baseada em claims/roles confiáveis e MFA/step-up no provedor antes de disponibilizar ações administrativas; validar alteração de e-mail por confirmação no endereço novo e reautenticação conforme política aprovada. Não foi feita alteração de configuração.

### S3 — logout global não verificado sob falha/revogação

O servidor pede logout global e propaga erro, mas não existe evidência dinâmica aqui de que sessões anteriores deixam de acessar APIs/RPC imediatamente ou após refresh.

**Ação:** no runner isolado, testar sessão ativa em dois clientes, logout global, uso do token antigo e refresh; registrar janela de revogação efetiva do Auth.

## Evidências e estado RED→GREEN

- Evidência positiva estática: políticas de ownership e grants restritos nas migrations; funções de recompensa/educação com verificações de `auth.uid()`; callback com destino interno; erros de cadastro/login/recuperação genéricos; migration de proteção contra movimentação de capa.
- Evidência de testes existentes (não executados): `supabase/tests/database/authorization_rls_p0.test.sql`, `educational_core_p1_rls.test.sql`, `educational_core_p1_privileges.test.sql`, `educational_objective_evidence_p15_rls.test.sql`, `integration_credentials_security.test.sql`, `gamification_atomic.test.sql` e `move_workspace_page_test.sql`.
- **RED:** não foi possível reproduzir um acesso cruzado neste ambiente; não declarar teste RED.
- **GREEN:** não foi possível validar correção dinâmica nem executar testes; não declarar teste GREEN.
- Não foi aberta branch secundária nem aplicada mudança de banco, porque a branch ativa é fixada pelo ambiente e nenhuma falha foi reproduzida com segurança. Nenhum arquivo de aplicação/migration foi modificado nesta revisão.

## Riscos residuais

1. RLS/grants, RPC, Storage, alteração de e-mail, revogação de sessão e enumeração não têm confirmação dinâmica neste turno.
2. MFA/papéis administrativos e parâmetros do Supabase Auth hospedado estão fora do checkout e não foram auditados.
3. Acesso por service-role, tarefas operacionais, backup/exportação e retenção não foram executados nem verificados no provedor; portanto não é possível atestar conformidade operacional com retenção/LGPD. Nenhuma política de retenção ou dado foi alterado.
4. Os testes TypeScript/SQL não foram executados por ausência de dependências e runtime Supabase local.

## Arquivos revisados

Principais: `src/components/auth/AuthForm.tsx`, `src/app/auth/callback/route.ts`, `src/lib/auth/actions.ts`, `src/lib/auth/require-authenticated-user.ts`, `src/infrastructure/supabase/session.ts`, `src/proxy.ts`; migrations Supabase e testes em `supabase/migrations/` e `supabase/tests/database/`.

**SHA base do checkout:** `9f902981fcd537a10ff8d6757379b450f656abf9`.  
**SHA-256 do arquivo:** calculado no fechamento e informado junto à entrega.

## 🚀 Próximo prompt

“Configure um runner descartável Supabase local com Docker/CLI e isolamento de rede comprovado; execute migrações do zero e os testes de autorização com duas identidades sintéticas (incluindo Storage, RPC, tentativas, XP e sessões revogadas). Não use projeto hospedado. Reproduza e registre cada falha RED, corrija somente em branch isolada autorizada, então rode a suíte GREEN e atualize este relatório com logs, comandos e SHA.”
