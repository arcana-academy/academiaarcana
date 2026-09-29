# Estado de integração — Academia Arcana

Atualizado em 2026-09-29.

## Fonte de verdade

- Código, contratos, componentes e CI: GitHub `arcana-academy/academiaarcana`.
- Persistência, RLS, RPCs e autenticação: Supabase `fichnalpbcfjywwhixid`.
- Publicação: Vercel `academiaarcana`, reservada para a etapa final.

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

## CI
O GitHub já possui workflows separados para:
- Quality Gate;
- testes de banco Supabase;
- acessibilidade;
- CodeQL;
- dependency review;
- gitleaks;
- smoke de produção.

## Regra de publicação
Nenhuma publicação, promoção, rollback ou alteração de infraestrutura de produção da Vercel faz parte desta etapa. A etapa Vercel somente será executada após a validação final do conjunto GitHub + Supabase + aplicação.
