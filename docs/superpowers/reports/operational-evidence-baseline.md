# Operational Evidence — baseline

## Objetivo

Registrar a primeira fotografia verificável das capacidades operacionais pendentes após a consolidação de F6.13–F6.20.

A regra deste documento é conservadora:

> documentação não é evidência de execução.

Uma capacidade somente deve migrar para `VERIFIED` quando houver evidência reproduzível, datada e vinculada ao recurso, deployment, commit ou exercício correspondente.

## 1. Evidência de produção

### Deployment confirmado

Foi observado um deployment de produção com estado `READY`:

- deployment: `dpl_8Aj5SfRF4TfQKrax31oXULKopZxC`;
- commit: `08f4ca77588fd7869b8b8b1356269fa2291a52fe`;
- mensagem: `docs(f6.17): define disaster recovery continuity runbook (#264)`;
- target: `production`.

Isso comprova que o commit F6.17 chegou a um deployment de produção READY.

Não comprova que o `main` atual esteja em produção.

## 2. Estado entre GitHub e produção

O `main` avançou posteriormente para o F6.20, no commit:

`65e4ed2043ee185f8473eddf015a593f0bbb34f2`

Portanto:

```
GitHub/main
   |
   | commit 65e4ed...
   v
produção confirmada
   |
   +--> 08f4ca... (F6.17)
```

Até existir um novo deployment confirmado, qualquer afirmação de que o F6.18–F6.20 está em produção deve permanecer `PENDING` ou `EXTERNAL`.

## 3. Runtime

Foi consultado o runtime de produção nas últimas 24 horas, agrupado por status HTTP e filtrado para níveis `error` e `fatal`.

Resultado observado: nenhuma contagem de erro/fatal foi retornada pelo agrupamento.

Isso constitui uma evidência pontual de ausência de sinais registrados nessa consulta. Não equivale a disponibilidade total, ausência absoluta de falhas ou prova de funcionamento de todos os fluxos.

## 4. Capacidades ainda pendentes

| Capacidade | Estado |
| --- | --- |
| Deployment de produção READY observado | VERIFIED |
| Consulta de runtime production nas últimas 24h | VERIFIED |
| Smoke test funcional de produção | PENDING |
| Rollback controlado executado | PENDING |
| Backup/restore executado | PENDING |
| RTO/RPO medidos | PENDING |
| Exercício de Disaster Recovery | PENDING |
| Exercício de Incident Response | PENDING |
| Alertas operacionais validados | PENDING |
| Métricas operacionais validadas | PENDING |
| Recovery de credenciais exercitado | PENDING |
| Reconciliação de Storage exercitada | PENDING |

## 5. Próxima evidência mínima

A próxima etapa operacional deve confirmar, sem alterar dados de produção de forma destrutiva:

1. smoke test funcional do deployment atualmente confirmado;
2. identificação inequívoca do deployment testado;
3. resultado, timestamp e escopo do teste;
4. evidência de logs/estado correspondente;
5. somente depois, exercício controlado de rollback ou recovery em ambiente apropriado.

## 6. Critério de promoção

Uma evidência pode promover uma capacidade quando:

- o procedimento foi realmente executado;
- o ambiente está identificado;
- o resultado é observável;
- o resultado pode ser reproduzido ou auditado;
- qualquer dado alterado durante o exercício foi reconciliado;
- a evidência está vinculada ao commit/deployment/recurso relevante.

## Conclusão

A primeira rodada confirma uma separação importante entre código validado e produção confirmada: existe produção READY verificável, mas o deployment confirmado ainda corresponde ao F6.17, enquanto o `main` já contém o F6.20.

As capacidades de recovery, incident response, alerting, métricas, rollback e restore permanecem pendentes até exercícios reais produzirem evidência suficiente.
