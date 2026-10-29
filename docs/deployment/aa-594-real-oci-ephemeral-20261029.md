# Academia Arcana — #594: roundtrip real OCI em runner efêmero (NO-GO)

**Data:** 29/10/2026. **Resultado:** SUCCESS da integridade e restauração OCI, **sem backup externo ou publicação**.

## Procedência comprovada

- Aplicação fixada no SHA da PR #844 `d0c839fe37a1c809585183fd57426877753ca119`.
- Workflow diagnóstico `.github/workflows/aa-594-oci-ephemeral-proof.yml`, branch `work/aa-594-oci-ephemeral-20261029`, commit de execução `ff1e6d0c14371cf6b0f60fe3b88cf0bf7f6ca172`.
- GitHub Actions [run #40943521878](https://github.com/arcana-academy/academiaarcana/actions/runs/40943521878), job `123692765411`, Ubuntu 24.04, **SUCCESS integral**, permissão GitHub `contents: read`. Nenhuma credencial de produção utilizada, nem `GHCR push`, `Render deploy`, `main`/PR alteradas, serviço pago ou arquivo publicado.
- Imagem construída no runner com configurações públicas **sintéticas** e revisão exata, `linux/amd64`, `USER node`; um marcador sintético de `OPENAI_API_KEY` foi definido no host para verificar não propagação ao builder, sem exposição de credencial real.

## Provas reais — mesmo runner

| Prova observada no log | Resultado |
|---|---|
| `AA594_OCI_SOURCE_AND_BUILD_BOUNDARY` | PASS — código e guard de build do SHA fixo |
| `AA594_OCI_TRANSFER_TOOL_READY` | PASS — ferramenta de conversão OCI pronta |
| `AA594_OCI_ORIGIN_ARCH_USER_ENV` e `AA594_OCI_SYNTHETIC_BUILD` | PASS — imagem linux/amd64, sem root, sem chave sintética embutida em configuração |
| `AA594_REAL_OCI_LAYOUT_CREATED` | PASS — conversão local via `skopeo` a **OCI archive**, não `docker save` |
| `AA594_REAL_OCI_OFFLINE_INTEGRITY` | PASS — validador **existente** `scripts/security/oci_recovery_536.py` conferiu **9 objetos OCI** incluindo manifesto, configuração e camadas referenciadas, digest/size e plataforma/nonroot |
| `AA594_LOCAL_OCI_TAR_READBACK_SHA256` | PASS — cópia do mesmo arquivo para outro caminho temporário, hash SHA256 do arquivo validado e conteúdo OCI rechecado |
| `AA594_OCI_TO_DOCKER_RESTORE` | PASS — remoção de tag original e importação a partir do OCI archive com `skopeo` |
| `AA594_OCI_RESTORED_NONROOT_HEALTH_REVISION` | PASS — imagem recuperada iniciou sem root e validou `/api/health`, revisão e ausência de runtime keys no smoke preexistente |
| `AA594_OCI_EPHEMERAL_TEARDOWN` | PASS — imagem e ambos os tar OCI removidos; nenhuma cópia preservada |

O verificador obteve o digest do manifesto lendo `index.json` do OCI, conferiu o hash de cada objeto por seu nome SHA256 e verificou o SHA256 do tar no readback. Os valores completos de digest e tar foram mantidos apenas em arquivos temporários e **não constam de recibo de backup persistente**. A prova é reexecutável pelo commit do workflow, mas não implica que uma cópia ainda exista.

## Exatamente o que esta prova **não** encerra

1. O arquivo foi criado, copiado e restaurado **no mesmo runner / mesmo domínio transitório de falha**, não em um segundo provedor, tenant ou conta independente. O readback local **não** comprova armazenamento externo ou durabilidade.
2. Nenhum arquivo OCI persistente, recibo assinado, segundo digest histórico, namespace off-GHCR, ACL de deleção, retenção, custódia humana ou auditoria de armazenamento foi implantado.
3. A imagem testada é nova imagem **sintética local**, não a digestada e assinada versão de release publicada no GHCR. A igualdade de SHA da fonte não substitui validação de digest remoto, proveniência ou aprovação para publicação.
4. A recuperação foi realizada dentro do daemon Docker do runner e não em registro independente. O smoke foi `/api/health` e controles de imagem; não reexecutou Auth, RLS, Storage ou testes funcionais que possuem evidências anteriores.
5. A prova não valida backup de banco, RTO/RPO real, migração do serviço Render, rollback produtivo, recuperação após perda de GHCR ou autorização independente prevista em #594/#595.

**Estado:** sucesso técnico de OCI no runner; #594 continua BLOCKED para recuperação independente e custódia. #536, #595, C03/ORG02 abrangente e release protegido permanecem **NO-GO**. Próxima prova só pode alegar backup independente depois que um destino externo aprovado e pessoa custodiante forem designados, e o objeto for lido de volta de armazenamento durável com hash verificado. Nenhuma ação produtiva está autorizada por este documento.
