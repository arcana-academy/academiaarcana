# Academia Arcana — Revalidação Operacional Atual

**Data da evidência:** 2026-10-04  
**HEAD auditado:** `6b6db55fa71147d47a4ba5b1772ae91b54987e3d`  
**Repositório:** `arcana-academy/academiaarcana`

## 1. Objetivo

Este documento é um snapshot de revalidação atual. Ele não substitui nem altera relatórios históricos. A finalidade é separar explicitamente o estado operacional atual das evidências históricas e manter rastreabilidade para as pendências que ainda dependem de configuração ou exercícios externos.

## 2. Arquitetura operacional verificada

A cadeia operacional vigente é:

**GitHub → GitHub Actions → Render → Next.js/React/TypeScript → Supabase (Postgres/Auth/RLS/Storage)**

- Render é o runtime/deploy de produção.
- Supabase é a plataforma de dados, autenticação, RLS e storage.
- Vercel e Netlify não são runtimes concorrentes da aplicação.
- A política canônica de infraestrutura permanece protegida por teste no repositório.

## 3. Produção — Render

Serviço: `academiaarcana`  
URL: `https://academiaarcana.onrender.com`  
Branch: `main`  
Repositório: `arcana-academy/academiaarcana`  
Auto deploy: habilitado com gatilho `checksPass`  
Build: `npm ci && npm run build`  
Start: `npm start`  
Health path configurado: `/api/health`

Deploy associado ao HEAD auditado:

- Deploy: `dep-db0pp4k9v7es73cguvc0`
- Commit: `6b6db55fa71147d47a4ba5b1772ae91b54987e3d`
- Estado observado: **LIVE**
- Logs observados: build concluído, aplicação iniciada, Next.js pronto e serviço publicado na URL primária.

Os logs de runtime também registraram a superfície `Proxy (Middleware)`, coerente com a implementação de CSP em `src/proxy.ts`.

**Limitação:** este snapshot não trata a existência dos logs como substituto de uma requisição HTTP independente. A resposta direta e os headers de produção continuam pendentes de evidência externa independente.

## 4. Supabase

Projeto: `fichnalpbcfjywwhixid`  
Estado observado: **ACTIVE_HEALTHY**.

A auditoria anterior verificou 15 tabelas públicas do produto com RLS habilitado e nenhum privilégio de tabela para `anon` na amostra auditada.

O Security Advisor continua com uma única pendência conhecida:

- `auth_leaked_password_protection` — WARN / EXTERNAL.

Esta pendência pertence à configuração administrativa do Supabase Auth e não deve ser marcada como resolvida sem evidência direta da configuração final.

## 5. Quality Gate e segurança de código

Para o HEAD auditado, a validação mais recente registrou sucesso no Quality Gate, incluindo lint, typecheck, testes unitários, acessibilidade, build de produção, Playwright/E2E e verificações de segurança/dependências. As execuções de Database Tests, CodeQL, Gitleaks, Dependency Review e Anti-Dark Pattern também foram registradas como bem-sucedidas no ciclo correspondente.

## 6. CSP

A implementação canônica está em `src/proxy.ts` e gera nonce por requisição, aplica CSP aos headers de requisição e resposta e impede os padrões `unsafe-inline` e `unsafe-eval` conforme os contratos de teste.

A presença do Proxy no runtime atual foi observada nos logs de build/deploy.

**Pendente:** evidência HTTP independente de que a resposta pública atual contém o header CSP esperado. Não declarar esta evidência como executada até obter a resposta real.

## 7. Pendências operacionais reais

As seguintes capacidades continuam abertas porque exigem execução ou configuração externa, não apenas documentação:

- habilitar e evidenciar Leaked Password Protection no Supabase Auth;
- validar rollback controlado;
- validar backup/restore;
- medir e aprovar RTO/RPO;
- executar exercício de Disaster Recovery;
- executar exercício de Incident Response;
- validar alertas operacionais;
- validar recuperação/rotação de credenciais;
- validar reconciliação de Storage;
- obter evidência HTTP independente de health/readiness/CSP;
- sincronizar o texto de governança do Prompt 02 com a decisão AA-ARCH-001 sobre CSS sem atribuir autoridade a este chat sobre o Chat 00.

## 8. Regra de encerramento

Este snapshot não declara 100% de conclusão. O estado correto é **produção operacionalmente LIVE, fundação técnica validada e pendências externas/operacionais explicitamente rastreadas**.

Nenhuma evidência histórica deve ser reclassificada como evidência atual sem nova execução.
