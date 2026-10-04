# Academia Arcana — Revalidação Operacional Atual

**Data da evidência:** 2026-10-04  
**HEAD auditado:** `45ac1e7d78869bae0741d8423812e5f2561074ca`  
**Repositório:** `arcana-academy/academiaarcana`

## Objetivo

Snapshot atual de revalidação operacional. Não substitui nem altera relatórios históricos. Serve para separar estado presente, evidência histórica e dependências externas.

## Arquitetura vigente

**GitHub → GitHub Actions → Render → Next.js/React/TypeScript → Supabase (Postgres/Auth/RLS/Storage)**

- Render é o runtime/deploy de produção.
- Supabase é a plataforma de dados, autenticação, RLS e Storage.
- Vercel e Netlify não são runtimes concorrentes.
- A política canônica de infraestrutura permanece protegida por testes do repositório.
- O Design System 1.0 agora está incorporado ao `main` pelo PR #492; a base operacional de estilo continua sendo CSS semântico com `aa-*` e `--aa-*`, conforme AA-ARCH-001.

## Produção — Render

Serviço: `academiaarcana`  
URL: `https://academiaarcana.onrender.com`  
Branch: `main`  
Repositório: `arcana-academy/academiaarcana`  
Auto deploy: habilitado com `checksPass`  
Build: `npm ci && npm run build`  
Start: `npm start`  
Health path: `/api/health`

A revalidação anterior observou o deploy do commit `6b6db55fa71147d47a4ba5b1772ae91b54987e3d` como LIVE e confirmou nos logs build concluído, aplicação iniciada, Next.js pronto, serviço publicado e superfície `Proxy (Middleware)` presente. O `main` posteriormente avançou para `45ac1e7d78869bae0741d8423812e5f2561074ca` por meio do PR #492.

**Limitação:** logs de deploy não substituem requisição HTTP independente. Health/readiness e headers CSP públicos continuam sem evidência HTTP independente nesta rodada.

## Supabase

Projeto: `fichnalpbcfjywwhixid`  
Estado observado: **ACTIVE_HEALTHY**.

A auditoria anterior verificou 15 tabelas públicas do produto com RLS habilitado e nenhum privilégio de tabela para `anon` na amostra auditada.

Security Advisor: permanece uma única pendência conhecida:
- `auth_leaked_password_protection` — WARN / EXTERNAL.

Esta configuração administrativa não deve ser marcada como resolvida sem evidência direta do estado final.

## Qualidade e segurança

O ciclo de validação do commit anterior registrou sucesso em Quality Gate, incluindo lint, typecheck, testes unitários, acessibilidade, build de produção, Playwright/E2E e verificações de segurança/dependências. Database Tests, CodeQL, Gitleaks, Dependency Review e Anti-Dark Pattern também foram registrados como bem-sucedidos no ciclo correspondente.

O PR #492, que levou o Design System 1.0 ao `main`, adicionou/atualizou o contrato de tokens, fallback CSS, presets de tema e testes de sincronização da fundação visual. O novo estado deve ser tratado como a baseline atual do Design System.

## CSP

A implementação canônica está em `src/proxy.ts`: nonce por requisição, CSP em request/response e restrições contra `unsafe-inline` e `unsafe-eval`, protegidas por testes.

A presença do Proxy foi observada na superfície de runtime do deploy anterior.

**Pendente:** confirmação HTTP independente do header CSP na produção atual.

## Pendências de alta prioridade ainda abertas

1. Leaked Password Protection no Supabase Auth.
2. Evidência HTTP independente de `/api/health`, `/api/ready` e CSP.
3. Rollback controlado.
4. Backup/restore.
5. RTO/RPO medidos e aprovados.
6. Exercício de Disaster Recovery.
7. Exercício de Incident Response.
8. Validação de alertas operacionais.
9. Recuperação/rotação de credenciais.
10. Reconciliação de Storage.
11. Sincronização do texto de governança do Prompt 02 pelo Chat 00, para refletir AA-ARCH-001 sem criar uma segunda autoridade arquitetural.

## Critério de encerramento

Este snapshot **não declara 100% de conclusão**. O estado verificável é: produção operacionalmente estabelecida, arquitetura e Design System com baseline atualizada, fundação técnica fortemente validada e um conjunto explícito de pendências externas/operacionais ainda necessárias para uma declaração de fechamento integral.

Evidência histórica não deve ser reclassificada como evidência atual sem nova execução.
