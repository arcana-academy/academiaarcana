# Learning Task State Foundation

## Objetivo

Dar ao domínio Learning um contrato explícito para estados de tarefas, inspirado na legibilidade de tarefas do Things/Obsidian, sem transformar estados em mera decoração visual.

## Usuário

Qualquer estudante que organize atividades dentro da Academia Arcana.

## Fluxo

1. Uma tarefa nasce como `todo`, `scheduled`, `question` ou `idea`, conforme o caso de uso futuro.
2. A aplicação solicita uma transição ao domínio.
3. `canTransitionTaskStatus` valida a transição.
4. A UI apresenta o estado usando `TaskStateBadge`.
5. Persistência, XP, calendário e notificações serão integrados em seus respectivos casos de uso futuros.

## Estados

- `todo`: A fazer
- `in_progress`: Em andamento
- `done`: Concluída
- `cancelled`: Cancelada
- `scheduled`: Agendada
- `blocked`: Bloqueada
- `question`: Pergunta
- `idea`: Ideia

Prioridade é independente do estado: `low`, `normal`, `high` ou `urgent`.

## Empty / Loading / Error / Success

Este slice não carrega uma coleção nem persiste dados, portanto não possui loading ou empty state próprio. Em uma futura lista de tarefas, o empty state deve explicar como criar a primeira tarefa e nunca ser apresentado como erro.

Falhas de persistência ou autorização deverão ser tratadas pelo use case/application layer, sem serem mascaradas pelo badge. Uma transição aceita pelo domínio representa sucesso da validação; persistência bem-sucedida será um sucesso de infraestrutura separado.

## Acessibilidade

Cada estado possui texto em português e símbolo estável. Cor não é a única forma de comunicar o estado. O badge usa nome acessível e não depende de animação. O componente herda os tokens semânticos do Design System.

## Autorização

O componente e as funções puras não concedem autorização. Alterações persistentes deverão passar pelo fluxo `UI -> application use case -> identity/context -> authorization/privacy -> learning -> infrastructure` definido na arquitetura.

## Testes

- Todos os estados possuem label e símbolo.
- Transições válidas e inválidas são verificadas.
- Prioridade permanece separada de status.
- O componente expõe nome acessível e estado legível sem depender de cor.

## Fora deste slice

Persistência Supabase, recorrência, calendário, lembretes, XP, missões, streak, colaboração, sincronização e extensões não fazem parte desta implementação. Esses comportamentos serão adicionados por seus respectivos domínios/use cases.
