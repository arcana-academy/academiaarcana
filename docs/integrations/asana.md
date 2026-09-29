# Asana

A Academia Arcana possui um adapter server-side para integrar tarefas e projetos do Asana ao domínio de planejamento.

## Estado

- Adapter OAuth 2.0 + PKCE: implementado.
- Credenciais: criptografadas no servidor; nenhum token é exposto ao navegador.
- Refresh/revogação: implementados.
- Verificação de conexão: implementada.
- Projetos e tarefas: leitura implementada.
- Criação e conclusão de tarefas: implementadas.
- UI de conexão: preparada em `/integracoes/asana`.
- Conexão real: depende de um aplicativo OAuth do Asana e das variáveis de ambiente abaixo.

A Academia Arcana continua sendo a fonte de verdade do estado educacional. A integração não cria sincronização bidirecional durável.

## Configuração

Defina somente no ambiente server-side:

- `ASANA_CLIENT_ID`
- `ASANA_CLIENT_SECRET`
- `ASANA_REDIRECT_URI`

O redirect URI deve apontar exatamente para:

`/api/integrations/asana/callback`

Em desenvolvimento, `NEXT_PUBLIC_APP_URL` pode ser usado para resolver o redirect quando `ASANA_REDIRECT_URI` não estiver definido.

## Rotas

- `GET /api/integrations/asana/connect`
- `GET /api/integrations/asana/callback`
- `GET /api/integrations/asana/status`
- `GET /api/integrations/asana/projects`
- `GET /api/integrations/asana/tasks`
- `POST /api/integrations/asana/tasks`
- `PATCH /api/integrations/asana/tasks`
- `POST /api/integrations/asana/disconnect`

## Segurança

O fluxo usa state + PKCE S256, cookies HttpOnly e SameSite, associação das credenciais ao usuário autenticado e criptografia AES-GCM antes do armazenamento no cookie.

A ausência de credenciais produz estado `catalogued`/desconectado; não é tratada como conexão ativa.

## Limites deliberados

A primeira versão não implementa:

- sincronização bidirecional automática;
- webhooks persistentes;
- importação irrestrita de workspaces;
- exposição de tokens ao client;
- credenciais de provedor no repositório.

## Fonte oficial

https://developers.asana.com/docs/oauth
