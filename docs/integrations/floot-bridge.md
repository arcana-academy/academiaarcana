# Floot ↔ GitHub ↔ Supabase ↔ Render

Academia Arcana mantém o GitHub como fonte de código e CI/CD, Supabase como fonte de dados e autenticação, e Render como plataforma de produção.

## Regras
- Não duplicar conceitos de domínio já existentes no Supabase.
- Alterações de banco devem ser versionadas em `supabase/migrations`.
- GitHub Actions valida migrations, qualidade, acessibilidade, testes e build.
- Render recebe a aplicação após a validação final do GitHub Actions.

## Estado reconciliado em 2026-09-29
- GitHub: `arcana-academy/academiaarcana`
- Supabase: `arcana-academy's Project` (`fichnalpbcfjywwhixid`)
- Render: serviço `academiaarcana` em Ohio, com auto-deploy a partir de `main`
- Supabase já possui `focus_sessions`, `missions`, `gamification_profiles`, conteúdo de Grimórios e `feedback_responses`.
- O repositório já possui migrations versionadas e workflows de database/quality.
- O código Floot atual é uma superfície de implementação/preview separada e deve ser reconciliado no repositório antes da publicação.

## Próxima sincronização
A sincronização deve adaptar o modelo de sessão do protótipo Floot ao modelo canônico `focus_sessions` do Supabase, em vez de criar uma segunda tabela de foco.
