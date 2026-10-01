# Deployment Platform — Academia Arcana

**Status:** CANÔNICO  
**Effective date:** 2026-09-30  
**Repository:** `arcana-academy/academiaarcana`  
**Last repository verification:** 2026-09-30

## Plataforma oficial

A plataforma oficial de build, execução e deployment da Academia Arcana é:

> **Render**

A cadeia operacional canônica é:

```text
GitHub
  ↓
GitHub Actions
  ↓
Supabase
  ↓
Render
```

## Render service

| Item | Estado |
|---|---|
| Workspace | `arcana.academy` |
| Workspace ID | `tea-daa6v6tg1s2s73cb5gi0` |
| Service | `academiaarcana` |
| Service ID | `srv-dauor697lnhs739cicag` |
| Branch | `main` |
| Runtime | Node |
| Build | `npm ci && npm run build` |
| Start | `npm start` |
| Health check | `/` |
| Region | Ohio |
| Auto deploy | Commit |
| URL atual | `https://academiaarcana.onrender.com` |

## Regras permanentes

1. Render é o único provedor canônico de deployment da aplicação.
2. GitHub continua sendo a fonte de código e histórico.
3. GitHub Actions continua sendo a camada de validação automatizada.
4. Supabase continua sendo a infraestrutura canônica de dados, autenticação e RLS.
5. Vercel não faz parte da arquitetura operacional atual.
6. Novo código, configuração ou documentação operacional não deve introduzir dependência de Vercel.
7. O histórico de uso do Vercel pode permanecer em documentos arquivísticos quando necessário para preservar a verdade histórica, mas não constitui configuração ou caminho operacional atual.
8. O arquivo `vercel.json` não é permitido.
9. Dependências Vercel não são permitidas no `package.json`.
10. O build deve falhar caso essas invariantes sejam violadas.

## Environment

Configuração sensível permanece fora do repositório e deve ser administrada no Render para o ambiente de execução. O código deve consumir variáveis de ambiente, não credenciais versionadas.

## Release

A sequência operacional canônica é:

```text
Implementação
  ↓
Quality Gate
  ↓
Validação
  ↓
Merge
  ↓
Render deploy
  ↓
Health / smoke
  ↓
Observação
```

Um commit em `main` prova a mudança no código; o deployment do Render e sua validação provam a publicação operacional.

## Estado

**CANÔNICO + IMPLEMENTADO NO AMBIENTE RENDER**

