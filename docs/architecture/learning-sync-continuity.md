# Learning Sync & Continuity

## Objetivo
Dar continuidade ao estudo entre dispositivos com histórico de versões, trabalho offline, fila local, sincronização seletiva, recuperação e base para cofres compartilhados.

## Usuário
Estudantes que precisam continuar estudando sem conexão e recuperar alterações anteriores. Em cofres compartilhados, membros recebem apenas o nível de acesso concedido ao cofre.

## Implementado
- histórico versionado e restauração como nova versão;
- diff de revisões;
- IndexedDB para versões e fila offline;
- engine de sincronização com transporte injetável;
- sincronização seletiva por tipo de arquivo e preferências;
- AES-GCM via Web Crypto para payloads quando uma chave já autorizada estiver disponível;
- schema Supabase + RLS para documentos, versões, fila e cofres compartilhados;
- interfaces de histórico e configuração.

## Segurança
A autorização permanece no backend/RLS. A chave criptográfica não é persistida por este módulo. Gestão de chaves, recuperação e rotação exigem um desenho específico antes de produção.

## Cofres compartilhados
O domínio diferencia owner, editor e viewer. A infraestrutura de tempo real e convites deve usar o schema e as políticas deste slice.

## Fora deste slice
Ativação da migration em um projeto Supabase específico, Realtime completo, merge automático avançado, gerenciamento de chaves E2E, sincronização de binários em Storage, backup externo agendado, import/export e clientes nativos.
