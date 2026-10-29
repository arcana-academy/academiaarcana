# Academia Arcana — #594 — preparação de custódia e backup OCI off-GHCR (Free / NO-GO)

**Data da verificação:** 29/10/2026. **Escopo:** inventário de armazenamento em contas conectadas, validação da cota do Google Drive e criação de estrutura privada de destino aprovada. **Nenhuma imagem OCI enviada, conta criada, plano contratado, arquivo existente removido ou alterado, compartilhamento concedido, segredo lido ou credencial utilizada.**

## 1. Fontes de evidência

- Prova técnica OCI: [run #40943521878](https://github.com/arcana-academy/academiaarcana/actions/runs/40943521878), SUCCESS; build sintético, layout OCI, **9 objetos SHA verificados**, readback em caminho temporário no mesmo runner, restauração ao Docker, `/api/health`, limpeza. [Recibo técnico](./aa-594-real-oci-ephemeral-20261029.md). **Não existe cópia permanente produzida por esse job.**
- O documento histórico `ghcr-retention-recovery-536.md` relata imagem primária já publicada no GHCR e tar histórico de aproximadamente **217 MB**. Isso é uma *referência de planejamento*, **não** o tamanho verificado de um novo backup.
- Google Drive: conector autenticado disponível em uma conta de consumidor (domínio `gmail.com`). A raiz continha o arquivo privado preexistente **`academia-arcana-backup.7z`**, ID `1fNXYWk4UgFcptN39EpQg1vX-Jty-X5LT`, tamanho **17.824 bytes**, criado em 27/10/2026; permissões retornadas: **somente proprietário**. **Não foi aberto, baixado ou modificado.** Por dimensão e extensão, **não atesta backup OCI da imagem**; finalidade e conteúdo não verificados.
- Dropbox: conexão pessoal autenticada disponível; raiz listada sem arquivos; nenhuma pasta/cópia de release foi encontrada. **Plano e capacidade atual não verificados**.
- **Quota Google Drive comprovada por painel autenticado no navegador na mesma conta do conector:** **2,2 MB de 15 GB usados** em 29/10/2026 (saldo apresentado como **15 GB disponível**, arredondado). E-mail e identidade da conta coincidiram entre o painel e a integração Google Drive. Isso comprova capacidade nominal disponível para o backup ilustrativo de ~217 MB, **não** desempenho real de upload/readback ou retenção. **Quota Dropbox permanece desconhecida.**

Fontes públicas de referência:
- Google One anuncia **até 15 GB** em contas gratuitas, compartilhados por Drive/Gmail/Fotos: https://one.google.com/about/plans?gl=BR&hl=pt-BR . A capacidade realmente disponível pode ser inferior, e alguns cadastros novos começam com quota menor.
- Dropbox Basic oferece **2 GB**, se a conta estiver de fato no plano Basic: https://help.dropbox.com/pt-br/plans/dropbox-basic-faq . Exceder a quota pode impedir uploads e resultar em outras restrições: https://help.dropbox.com/storage-space/over-quota .
- O provedor de destino **não tem política de retenção imutável por 30 dias comprovada**; quota gratuita e arquivo privado não são WORM, Object Lock ou backup com custódia independente.

## 1A. Candidato de imagem imutável — prova pública atualizada (29/10/2026)

- **Candidato primário histórico, já publicado (não é a PR #844):** `ghcr.io/arcana-academy/academiaarcana@sha256:c2d2dd155ddaeab02167c2cb4e064fe2c85d7bcae60b3b2a64f5bc0f6a9e7658`. O código histórico/receita associados estão descritos na issue #594 e não devem ser confundidos com uma revisão nova.
- **Nova evidência LIVE somente leitura** [GitHub Actions #40947320733](https://github.com/arcana-academy/academiaarcana/actions/runs/40947320733), job `123705997050`, Ubuntu 24.04, completed **SUCCESS**. Workflow da branch `work/aa-594-ghcr-candidate-proof-20261029`, commit `374edb9967020566886e922a031fab39e896f38d`, executado com `contents: read`, sem credenciais ou publicação.
- `skopeo inspect --no-creds --raw` consultou o **manifesto público exato** e comparou seu SHA256 integral com o digest aprovado como candidato: **PASS**; os sete descritores de camada e o descritor de config apresentaram SHA256 e tamanhos válidos: **PASS**; o conjunto metadata de camadas e config totalizou **216.970.542 bytes**. A verificação da configuração remota confirmou `linux/amd64`, usuário não-root e ausência dos nomes de credenciais de runtime proibidos examinados: **PASS**. Nenhum blob de camada foi baixado nesta execução, logo esta prova não substitui a verificação histórica integral nem demonstra um backup armazenado.
- **Escolha para o próximo procedimento de backup não produtivo:** utilizar somente esse digest primário histórico já publicado; **não** gerar ou publicar nova imagem para esse procedimento, nem presumir que represente a versão atual do MVP.
- Pasta destino confirmada e vazia: [Drive privado `off-ghcr`](https://drive.google.com/drive/folders/1-3zfbsquskRbdHFEOP3bF4OH5nNGFUD2), zero objetos no último readback. **Não há ainda arquivo OCI armazenado**, portanto não existe recibo SHA-256 remoto nem prova de retenção.
- A integração `Google_Drive.upload_file` requer uma referência de arquivo binário aceita pelo conector, e o OCI efêmero da prova anterior foi apagado. Não inserir paths locais, URLs inventadas ou bytes em base64 no campo `file_uri`; para uma transferência futura será necessário produzir um artefato OCI concreto em ambiente autorizado e empregar uma forma de entrega de binário suportada, com origem/ACL/sha ratificados. Não carregar imagem arbitrária como se fosse release.

## 2. Arquitetura proposta em duas etapas separadas

### Etapa A — cópia em provedor distinto (redução de risco, ainda não satisfaz #594)

**Destino escolhido para preparação:** Google Drive já conectado, com cota nominal livre comprovada; o fluxo de upload/download de binário OCI grande **ainda não foi validado**. Ele está fora do domínio de exclusão do GHCR/GitHub, sem custos obrigatórios **desde que o limite da conta não seja excedido**. Dropbox pessoal é alternativa contingente sujeita a confirmação de plano/quota.

**Destino agora criado (sem arquivo OCI):** `Academia Arcana/Seguranca/OCI/off-ghcr/` — [abrir pasta final privada](https://drive.google.com/drive/folders/1-3zfbsquskRbdHFEOP3bF4OH5nNGFUD2). Quatro pastas foram criadas hierarquicamente após a aprovação da proprietária e **verificadas por leitura de metadados**, com `shared=false` e permissões de **somente proprietário** em cada pasta. IDs: `Academia Arcana` = `11yZfUHKTvrfoPvYjtJ56NeOK125choDX`, `Seguranca` = `1m9a5dmojMI9_ksU9R9tTpDC_2b8ioa_9`, `OCI` = `1QnhKKtQx0GxTE9CDJXampfN6jR5-o1_l`, `off-ghcr` = `1-3zfbsquskRbdHFEOP3bF4OH5nNGFUD2`. A listagem da pasta final retornou **zero arquivos**, e `academia-arcana-backup.7z` ficou intacto na raiz. **Criar pastas e validar ACL não comprova backup**. A transferência de um OCI verdadeiro exige autorização de imagem/digest e custódia.

- A origem deve ser **digest de imagem de release aprovado**, não a imagem sintética descartável e não uma tag `:latest`. Fixar SHA do código, Quality Gate oficial, digest do manifesto remoto, plataforma `linux/amd64`, usuário não root e cadeia de build.
- Gerar OCI layout/tar em executor autorizado com contexto sem credenciais de runtime; evitar incluir segredos e `.env`. Calcular SHA256 **do tar exato** e verificar manifesto, config e todas as camadas com `scripts/security/oci_recovery_536.py` antes de upload.
- Definir se criptografia do cliente é necessária; **nunca inserir a chave no mesmo Drive, na imagem, no GitHub nem em comentários**. Manter mecanismo documentado para recuperar a chave sob autorização e reduzir risco de perda.
- Fazer upload somente com consentimento de destino, tamanho, arquivo e política de acesso. Depois **baixar um objeto novo do Drive**, não reutilizar o arquivo local, verificar tamanho e SHA256 completo e repetir `oci_recovery_536.py --archive <download> --digest sha256:<manifest> --archive-sha sha256:<tar>`. Se qualquer comparação falhar: FAIL/BLOCKED; não declarar backup válido.
- Preservar metadados mínimos de auditoria: URL/ID real retornado pelo provedor, object version se houver, SHA do tar, digest OCI, bytes, fonte/Quality Gate, momento UTC, responsável, prazo de retenção e recibo do readback. Não registrar segredos ou conteúdo do arquivo em logs públicos.
- Testar restauração **a partir dos bytes baixados** num registro/runner descartável separado, contêiner sem root, health/ready/revisão, Auth/RLS/Storage/CSP sintéticos estritamente necessários. Rotas de produção não podem ser acionadas.

A Etapa A prova *separação de provedor de armazenamento* quando realizada; **uma única pessoa dona das contas ainda pode excluir ambos os lados**, e o Google Drive sem retenção imutável não satisfaz a exigência de governança independente.

### Etapa B — custódia e DR independentes (critério para fechar #594)

**Permanece BLOQUEADA:** designar pessoa custodiante com poderes e canal de recuperação demonstráveis, revisor de Segurança/DR diferente da proprietária e do executor principal, aprovar retenção/auditoria/controle de deleção, confirmar off-GHCR fora do mesmo domínio administrativo, e homologar restauração em destino distinto. Não nomear terceiros fictícios e não representar uma aprovação da proprietária como revisão humana independente.

Metas previamente selecionadas como base de planejamento da Academia Arcana: **RTO 24 horas, RPO 24 horas, retenção preliminar de 30 dias**. Essas metas **não substituem contrato de retenção verificado ou uma assinatura de DR**. Uma única imagem OCI não equivale a backup dos dados Supabase; RPO exige também rotina independente de dados e restauração testada.

## 3. Formulário de recibo técnico — TEMPLATE, SEM BACKUP EXISTENTE

| Campo obrigatório | Valor/status |
|---|---|
| Serviço, branch e revisão liberada | PENDENTE DE APROVAÇÃO |
| Imagem GHCR de origem com digest completo SHA256 | **CANDIDATO HISTÓRICO VERIFICADO**: `sha256:c2d2dd155ddaeab02167c2cb4e064fe2c85d7bcae60b3b2a64f5bc0f6a9e7658`; não é release novo |
| Digest OCI manifest SHA256 / blobs verificados | PENDENTE |
| SHA256 completo do tar OCI e tamanho em bytes | PENDENTE |
| Provedor/conta/tenant e caminho de destino | GOOGLE DRIVE SELECIONADO PARA PREPARAÇÃO; PASTA PRIVADA CRIADA, SEM OCI |
| Cota livre confirmada antes do upload | PAINEL: 2,2 MB / 15 GB USADOS EM 29/10/2026; REVALIDAR ANTES DE UPLOAD GRANDE |
| ACL privada, criptografia e localização da chave | NÃO RATIFICADAS |
| Operador de backup / custodiante independente | NÃO DESIGNADOS |
| Revisor independente e decisão #595/DEP-C17 | NÃO DESIGNADOS |
| Política de retenção 30 dias e deleção/restore | NÃO COMPROVADA |
| ID real do objeto, version e UTC da gravação | NÃO EXISTE |
| Download do objeto persistido com SHA256 validado | NÃO EXECUTADO |
| Restore de registro externo + smoke/Auth/RLS/Storage | NÃO EXECUTADO |
| Evidência de revisão e autorização de publicação | NÃO EXISTE |
| Veredito de DR | **BLOCKED — #594 / NO-GO** |

**Não** preencher campos pendentes com os hashes do runner efêmero; ele destruiu as cópias. Não armazenar manifesto de autorização com segredos. A ausência de custodiante/revisor independente não impede o desenvolvimento de uma cópia adicional futuramente aprovada, porém **impede declarar #594 cumprida**.

## 4. Fronteiras operacionais vigentes

- Reutilizar PASS de DNS/IPv4/IPv6, Quality Gate, DB, E2E e OCI local já comprovados; não repetir sem mudança material.
- Serviço Render `srv-dauor697lnhs739cicag` continua **Free, Git/Node e Auto Deploy OFF**.
- PR #844 continua **DRAFT/UNMERGED**; #536, #594, #595 e homologação integral C03/ORG02 permanecem protegidos.
- **Proibido nesta preparação:** upload OCI, publicar imagem GHCR, criar bucket, alterar ACL, autorizar cobrança, sincronizar Blueprint, merge, deploy, restart, alterar Render/Supabase, revogar ou criar chaves produtivas, excluir `academia-arcana-backup.7z`.

**Próximo gatilho material:** candidato histórico já publicado e sua metadata pública verificados; confirmar autorização específica para persistência de uma cópia OCI desse digest, o mecanismo seguro de transferência binária a partir de arquivo novo, política/custódia e readback remoto com hash, **antes** de alegar backup operacional. Ainda não há digest de release novo aprovado para a PR #844. Até então: PREPARADO PARA DECISÃO, NÃO BACKUP EXECUTADO.
