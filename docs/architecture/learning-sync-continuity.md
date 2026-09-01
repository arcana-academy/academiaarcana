# Learning Sync & Continuity

## Objetivo

Dar continuidade ao estudo entre dispositivos com histórico de versões, trabalho offline, fila local, sincronização seletiva, recuperação e base para cofres compartilhados.

## Usuário

Estudantes que precisam continuar estudando sem conexão e recuperar alterações anteriores. Em cofres compartilhados, membros recebem apenas o nível de acesso concedido ao cofre.

## Implementado neste slice

- contrato de versões e diff;
- restauração como nova versão, preservando o histórico;
- armazenamento offline em IndexedDB;
- fila de operações pendentes;
- engine de sincronização com transporte injetável;
- configurações de sincronização seletiva;
- proteção de payload com Web Crypto AES-GCM;
- schema Supabase com versões, fila e membros de cofre;
- RLS para proprietário/editor/viewer;
- telas de histórico e configuração.

## Estados

`offline`, `connecting`, `online`, `error`.

## Histórico

Uma restauração nunca sobrescreve a versão anterior. Ela cria uma nova versão com referência humana à versão restaurada. Isso permite auditoria e recuperação contínuas.

## Offline

A escrita local não depende da rede. Operações ficam na fila IndexedDB e um transporte posterior pode enviá-las quando houver conectividade. O engine não decide como resolver conflitos: a política é explícita (`manual` ou `latest_write`) e o domínio pode evoluir para merge por conteúdo.

## Sincronização seletiva

Notas são a categoria principal. Imagens, áudio, vídeo e PDF são opt-in para reduzir transferência. Preferências do editor e atalhos podem ser controlados separadamente por dispositivo.

## Segurança

Payloads sensíveis podem ser protegidos no cliente usando AES-GCM via Web Crypto. A chave não é armazenada neste módulo. Gestão de chaves, recuperação, rotação e compartilhamento de chaves devem passar por um desenho de segurança específico antes de produção.

Supabase RLS permanece obrigatório. O frontend não é a autoridade de autorização.

## Cofres compartilhados

O domínio diferencia `owner`, `editor` e `viewer`. O banco restringe leitura/escrita por membro. Colaboração em tempo real e convites são dependências de infraestrutura posteriores; este slice estabelece o contrato e a segurança de dados sem fingir que Realtime já está integrado.

## Empty / Loading / Error / Success

- Histórico vazio: explica que as próximas alterações aparecerão ali.
- Sync offline: informa que alterações estão na fila local.
- Sync error: preserva a fila e não descarta operações.
- Sucesso: operação reconhecida remove somente o item confirmado da fila.
- Recuperação: restauração gera nova versão.

## Acessibilidade

- controles nativos de checkbox;
- labels explícitos;
- `aria-live` para feedback de salvamento;
- histórico navegável por teclado;
- status não depende apenas de cor;
- layout responsivo;
- nenhuma animação é necessária para compreender o estado.

## Fora deste slice

- aplicação da migration em um projeto Supabase específico;
- Realtime multiplayer completo;
- resolução automática de conflitos complexos;
- gerenciamento de chaves E2E com recuperação segura;
- sincronização de binários em Storage;
- backup externo agendado;
- importação/exportação;
- clientes desktop/mobile nativos.

Esses itens devem ser implementados quando a infraestrutura e os contratos de identidade/autorização estiverem disponíveis.
