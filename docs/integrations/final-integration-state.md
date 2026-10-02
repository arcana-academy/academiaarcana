# Estado de integração — Academia Arcana

Atualizado em 2026-10-01.

## Fonte de verdade

- Código, contratos, componentes e CI: GitHub `arcana-academy/academiaarcana`.
- Persistência, RLS, RPCs e autenticação: Supabase `fichnalpbcfjywwhixid`.
- Publicação: Render `academiaarcana`, reservada para a etapa final.

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

## Pesquisa web do Mestre Arcano

- Parallel e Exa estão registrados como providers server-side do runtime.
- O catálogo diferencia provider registrado de conexão verificada; nenhuma chave aparece no navegador ou no payload público.
- O Exa usa timeout determinístico de 12 segundos.
- A extração continua restrita ao provider Parallel e a URLs HTTP(S) públicas, conforme o contrato do adapter.

## Saúde e prontidão do runtime

- `/api/health` é o probe de liveness barato usado pelo Render.
- `/api/ready` é o contrato de readiness profundo e verifica o serviço de saúde do Supabase Auth.
- O smoke de produção valida ambos depois da publicação.
- O split evita que uma indisponibilidade transitória de uma dependência de dados transforme automaticamente o liveness probe em falha de rollout.

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
- Sem publicação ou alteração de infraestrutura da Render nesta etapa.

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

O smoke de produção permanece manual e reservado à validação pós-publicação; ele não bloqueia o ciclo pré-Render.

## Regra de publicação
Nenhuma publicação, promoção, rollback ou alteração de infraestrutura de produção da Render faz parte desta etapa. A etapa Render somente será executada após a validação final do conjunto GitHub + Supabase + aplicação.
