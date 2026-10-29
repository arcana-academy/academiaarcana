# Academia Arcana — C536: imagem sintética e recuperação local (NO-GO)

**Data:** 29/10/2026. **Status:** BUILD + SMOKE + ROUNDTRIP DESCARTÁVEL **PASS**. **Não** atesta custódia OCI externa, publicação imutável em GHCR ou autorização de produção.

## Origem e execução verificáveis

- Código do aplicativo **fixado** no commit da PR #844: `d0c839fe37a1c809585183fd57426877753ca119`. A PR permanece DRAFT.
- Workflow exclusivamente diagnóstico `.github/workflows/aa-536-ephemeral-image-proof.yml`, branch `work/aa-536-ephemeral-image-proof-20261029`, commit `99963329ccac206895b798b055551b580c6baa49`.
- GitHub Actions [run #40942353571](https://github.com/arcana-academy/academiaarcana/actions/runs/40942353571), job `123688729186`, Ubuntu 24.04, **completed / success**, permissões `contents: read`, sem variáveis `secrets.*`, token de publicação ou implantação.
- Build executado com Dockerfile original do SHA da PR #844, `--platform linux/amd64`, `NEXT_PUBLIC_SUPABASE_URL` e chave publishable **sintéticas**, `NEXT_PUBLIC_APP_URL` pública e `ACADEMIA_ARCANA_REVISION` igual ao SHA do aplicativo. A variável `OPENAI_API_KEY` do *host* recebeu exclusivamente um **marcador público sintético** para verificar que não fosse passada implicitamente ao builder. Nenhuma credencial de produção foi lida ou enviada ao build.

## Resultados observados no job

| Evidência no log | Resultado |
|---|---|
| `AA536_UNPRIVILEGED_BUILD_PREFLIGHT` | PASS |
| `AA536_LOCAL_ONLY_IMAGE_BUILD` | PASS |
| `AA536_IMAGE_ARCH_USER_REVISION_AND_ENV` | PASS — Linux/amd64, `USER node`, revisão correta e nenhum dos nomes privados inspecionados presente na configuração |
| `AA536_HOST_CANARY_NOT_FORWARDED_IN_IMAGE_METADATA` | PASS — marcador sintético ausente dos metadados e do histórico Docker |
| `AA536_IMAGE_HAS_NO_DOTENV_FILES` | PASS — nenhum `.env` ou `.env.*` no sistema de arquivos da imagem |
| `AA536_DISPOSABLE_DOCKER_ARCHIVE_SHA256` | PASS — o hash SHA256 do tar exportado foi recomputado e validado no mesmo runner |
| `AA536_SAME_DAEMON_IMAGE_ROUNDTRIP` | PASS — tag removida, `docker load` do tar local e ID da imagem idêntico antes/depois |
| `AA536_RESTORED_IMAGE_NONROOT_HEALTH_REVISION` | PASS — container restaurado, sem root, runtime keys ausentes e `/api/health` com revisão exata |
| `AA536_EPHEMERAL_IMAGE_AND_ARCHIVE_CLEANUP` | PASS — imagem/tag e tar apagados, sem upload |

O script de smoke utilizado foi `scripts/smoke-production-container.sh` já existente no SHA do aplicativo, **não** uma nova implementação de teste funcional. O workflow não repetiu Quality Gate, testes E2E, Database Tests ou testes assistivos anteriores.

## Limites que NÃO podem ser convertidos em aprovação

1. **Docker archive ≠ OCI layout:** `docker save` gerou um tar de imagem Docker, não o tar OCI-layout requerido pelo verificador offline `scripts/security/oci_recovery_536.py`. Não executar o verificador OCI contra esse formato esperando um PASS.
2. **Imagem local ≠ digest de registro aprovado:** o SHA de origem está fixo, e o ID da imagem foi preservado no roundtrip, mas não existe um digest GHCR desta nova revisão, nem recibo persistente de imagem ou tar. Nenhuma cópia independente ficou armazenada.
3. **Build sem secrets em CI não certifica Render hospedado:** a imagem sintética foi construída sem credenciais de produção em runner GitHub, mas o serviço Render atual continua Git/Node e pode disponibilizar variáveis de runtime ao próprio build. Somente futura migração autorizada pode demonstrar a fronteira hospedada.
4. **Arquivos temporários não são backup:** a prova não resolve o custodiante independente, destino off-GHCR, prazo de retenção, cópia/recuperação verificável de armazenamento persistente nem assinatura de DR em #594.
5. O pacote de governança #595, isolamento operacional C03/ORG02, aprovação independente e todos os controles de publicação permanecem **NO-GO**.

## Próxima prova legítima, sem repetir este teste

Quando existir autorização formal e destino independente homologado: obter uma imagem aprovada **por digest imutável** de uma origem confiável, criar layout OCI com config/layers preservados, produzir e armazenar tar SHA256 em outro domínio de deleção, ler o mesmo objeto do armazenamento persistente, executar o verificador `oci_recovery_536.py` com digest e tar-hash esperados, e restaurar por registro isolado com smoke, Auth sintético, RLS/Storage, rollback e aprovação humana independente.

Até lá, **preservar imagem apenas como evidência efêmera de build e não publicar, mesclar, implantar, comprar, criar storage ou alterar segredos**.
