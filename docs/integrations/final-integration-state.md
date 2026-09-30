# Estado de integração — Academia Arcana

Atualizado em 2026-09-30.

## Fonte de verdade

- Código, contratos, componentes e CI: GitHub `arcana-academy/academiaarcana`.
- Persistência, RLS, RPCs e autenticação: Supabase `fichnalpbcfjywwhixid`.
- Runtime/publicação: Render Web Service `academiaarcana` (`https://academiaarcana.onrender.com`).

## Domínios reconciliados

### Foco
O fluxo usa `public.focus_sessions`:
- `owner_id` vinculado ao usuário autenticado;
- duração entre 60 segundos e 4 horas;
- `started_at` e `completed_at`;
- RLS por ownership;
- privilégios de banco cobertos por teste pgTAP.

### Planejamento e Missões
- `study_tasks` é a fonte das tarefas de estudo.
- `missions` é a fonte das missões derivadas.
- `complete_study_task_with_reward` concentra a transição de tarefa + missão + XP + streak.
- A implementação pública do RPC é SECURITY INVOKER e delega para a implementação privada SECURITY DEFINER.
- O repositório de aplicação já chama esse RPC, sem confiar em owner/timestamp enviados pelo cliente.

### Santuário
O Santuário já compõe:
- hierarquia de aprendizagem;
- progresso de páginas;
- missões;
- agenda;
- recomendação adaptativa;
- Mestre Arcano.

## Integrações externas concluídas

### Relewise Search
- Busca server-side autenticada integrada ao Santuário.
- `@relewise/client` e endpoint `/api/search/relewise`.
- Credenciais permanecem exclusivamente no runtime server-side.
- Supabase continua como fonte de verdade transacional.

### Asana
- OAuth 2.0 + PKCE server-side.
- Credenciais criptografadas e vinculadas ao usuário.
- Projetos e tarefas com leitura, criação e conclusão.
- Página de gerenciamento em `/integracoes/asana`.
- Sem publicação ou alteração de infraestrutura do Render nesta etapa.

## CI
O GitHub já possui workflows separados para:
- Quality Gate;
- testes de banco Supabase;
- acessibilidade;
- CodeQL;
- dependency review;
- gitleaks;
- smoke de produção.

### Último ciclo validado
O commit `46b55b0f3eea3bbd9bc136b16ddba254bdc4ccd5` concluiu com sucesso: Quality Gate, Database Tests, Supabase Preview, CodeQL (JavaScript/TypeScript), CodeQL (Actions), Secret Scan, Scorecards e autofix.

O smoke de produção permanece manual e reservado à validação pós-publicação; ele não bloqueia o ciclo pré-Vercel.

## Regra de publicação
A publicação de produção ocorre no Render somente após a validação do conjunto GitHub + GitHub Actions + Supabase + aplicação. O repositório não mantém Vercel como runtime ou destino de publicação.
