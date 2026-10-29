# Academia Arcana — #536: preflight da troca de fonte Render (SOMENTE PREPARAÇÃO / NO-GO)

**Estado:** proposta isolada, não homologação de produção. **Não** executar merge, sincronização do Blueprint, alteração de configuração do Render, publicação GHCR, troca de fonte, restart ou deploy por este documento.

## Situação de referência, 29/10/2026

- Serviço existente: `srv-dauor697lnhs739cicag`; URL `https://academiaarcana.onrender.com`; plano `free`; 1 instância; região `ohio`; `/api/health`; prévias desligadas; `autoDeploy=no` e `autoDeployTrigger=off`.
- Vínculo administrativo imutável esperado: workspace `arcana.academy` (`tea-daa6v6tg1s2s73cb5gi0`), ambiente `evm-dauor697lnhs739cibr0`, nome `academiaarcana`. Os mesmos valores devem ser preservados após a migração.
- Fonte atual: **Git-backed / Node**, repositório `arcana-academy/academiaarcana`, branch `main`. A plataforma de build ainda não tem uma separação hospedada comprovada dos segredos de runtime.
- Há diferença material entre o `buildCommand` LIVE (`node scripts/verify-dependency-lifecycle-scripts.cjs && npm ci --ignore-scripts ...`) e o `render.yaml` declarado, que inicia com `node scripts/security/assert-build-secret-isolation-536.cjs`. Não sincronizar cegamente: o guard poderia interromper o build enquanto segredos de runtime ainda estiverem disponíveis no ambiente Git-backed.
- `Dockerfile` contém build separado e variáveis públicas declaradas; o build imutável no Quality Gate usa somente entradas públicas definidas. Verificar novamente o SHA efetivamente aprovado antes de qualquer publicação. A existência de uma imagem histórica do projeto **não aprova** uma revisão atual.
- O Render permite trocar a fonte de um serviço existente em **Settings > Build > Source > Edit** ou via API/Blueprint; **salvar a mudança dispara um deploy**. Fonte: https://render.com/changelog/change-your-services-backing-repo-or-image-in-the-render-dashboard
- A documentação Render indica que imagens pré-compiladas públicas são aceitas, incluindo GHCR; serviços originados de imagem não têm auto-deploy por commit. Fonte: https://render.com/docs/deploying-an-image

## O que o preflight sintético verifica

`node --test scripts/security/verify-render-source-migration-536.test.cjs`

O guard puro `scripts/security/verify-render-source-migration-536.cjs` possui duas funções SEM chamadas de rede:

- `verifyCurrentGitSource(metadata)`: exige exclusivamente o serviço existente, fonte Git/Node, `main`, Free, região Ohio, URL, /api/health, uma instância, prévias e Auto Deploy OFF.
- `verifyProposedImageSource(before, after, approvedImage)`: exige que a fonte resultante seja `image`, do **mesmo** serviço, preservando os atributos essenciais, e que `imagePath` retornado pela API corresponda exatamente ao digest aprovado `ghcr.io/arcana-academy/academiaarcana@sha256:<64 hex minúsculos>`. Refusa tags mutáveis e caminhos contraditórios.

**Estas funções rejeitam metadados inconsistentes e não exibem valores**. São contratos de *verificação*, não comandos que alteram serviço ou aprovam release. Um PASS sintético não demonstra estado real pós-migração.

## Resultado da verificação de Blueprint / Auto Sync (somente leitura)

**Evidência nova, 29/10/2026 — verificação administrativa concluída para o workspace atual:**

- A página autenticada [Render Dashboard > Blueprints](https://dashboard.render.com/blueprints), **com seletor de workspace exibindo `arcana.academy`**, informou expressamente: **“You haven’t created any Blueprint instances yet.”** Nenhum Blueprint nem lista de recursos de Blueprint foi apresentado nesse workspace.
- A integração Render confirmou que o único serviço listado nesse workspace (sem previews) é o `academiaarcana`, ID `srv-dauor697lnhs739cicag`, `ownerId=tea-daa6v6tg1s2s73cb5gi0`, ambiente `evm-dauor697lnhs739cibr0`, origem Git/Node, `main`, plano Free e Auto Deploy OFF. A consulta foi de **leitura**; nenhuma configuração foi salva, nenhum serviço criado, nenhum sincronismo solicitado.
- **Conclusão delimitada:** não existe instância de Blueprint no workspace autenticado observado na data. Assim, **não há um Auto Sync de Blueprint existente nesse workspace a inspecionar**; a hipótese de uma instância de Blueprint já cadastrada que sobrescreva imediatamente a fonte deste serviço **não é sustentada pelos dados atuais**.
- Isso **não comprova que o workspace nunca utilizou Blueprint**, nem elimina o risco de nova vinculação futura, nem substitui um snapshot atualizado imediatamente antes de uma migração autorizada. O campo `autoDeployTrigger=off` é distinto de Auto Sync.
- **Antes de trocar a fonte**, reconfirmar no mesmo workspace a ausência de Blueprint ou inspecionar qualquer Blueprint que surja, bem como manter `Auto Deploy OFF`, plano Free, identidade do serviço e o digest autorizado. A troca de origem continua **NO-GO**, pois salvar a alteração dispara deploy e ainda depende de #536, #594, #595 e aprovações independentes.

## Gate antes de qualquer decisão de publicação (pendências externas)

1. **Autoridade e custódia:** obter revisor humano independente autorizado, decisões DEP-C17 (#595), custódia/backup off-GHCR e restore OCI não produtivo (#594), validação C03/ORG02 e aprovação #536. Não inventar aprovações.
2. **Imagem:** confiar somente em artefato originado de Quality Gate oficial `push` da `main` aprovada, revision SHA exato, `GHCR_PUBLISH_APPROVED_SHA` ratificado, digest SHA-256 verificável, imagem pública adequada ao serviço Free; **publicação GHCR é ato separado e está NO-GO**.
3. **Segredos:** demonstrar que as credenciais server-side não estavam disponíveis ao builder da imagem, sem ler ou registrar bytes. Os segredos só serão fornecidos à instância em runtime. A imagem não deve conter arquivos de segredo, `.env` ou valores de build secretos. O `getRuntimeSecret` suporta arquivo de segredo para runtime.
4. **Origem de configuração:** identificar se há Blueprint/Auto Sync controlando o serviço; `GET /v1/services` não comprova essa titularidade. Reconciliação declarativa futura deve evitar reversão automática para `runtime: node`.
5. **Antes da ação irreversível:** registrar snapshot somente de metadados não sensíveis do serviço, digest autorizado, estado de domínio/URL, plano, região, health check, env names sem valores, dependências e plano de rollback; obter janela, aprovação explícita de release e operador. O serviço Free tem limites, incluindo histórico restrito de rollback.
6. **Somente em mudança futura explicitamente autorizada:** atualizar a fonte do MESMO serviço para imagem pública com **digest imutável**; não criar serviço paralelo pago, não ligar Auto Deploy. A operação pode iniciar deploy imediatamente.
7. **Depois, no release autorizado:** ler metadados LIVE e rodar `verifyProposedImageSource`, `verify-render-image-target-536.cjs` e verificador de convergência para digest/revisão; registrar deploy ID identificável; executar `/api/health`, `/api/ready`, CSP, Auth sintético, RLS, Storage, rotas públicas e rollback isolado aprovado. Se não convergir, **NO-GO** e recuperação conforme plano assinado.

**Status em 29/10/2026:** todas as mudanças produtivas acima **NÃO autorizadas**. Os scripts, testes e este documento são apenas preparação em branch isolada. `#536`, `#594`, `#595`, governança independente e NO-GO permanecem.
