# Academia Arcana — #594 — preparação de custódia e backup OCI off-GHCR (Free / NO-GO)

**Data da verificação:** 29/10/2026. **Escopo:** inventário de armazenamento em contas já conectadas, proposta de arquitetura e critérios de aceite. **Nenhuma imagem enviada, conta criada, plano contratado, arquivo removido, pastas criadas, permissões alteradas ou credencial lida.**

## 1. Fontes de evidência

- Prova técnica OCI: [run #40943521878](https://github.com/arcana-academy/academiaarcana/actions/runs/40943521878), SUCCESS; build sintético, layout OCI, **9 objetos SHA verificados**, readback em caminho temporário no mesmo runner, restauração ao Docker, `/api/health`, limpeza. [Recibo técnico](./aa-594-real-oci-ephemeral-20261029.md). **Não existe cópia permanente produzida por esse job.**
- O documento histórico `ghcr-retention-recovery-536.md` relata imagem primária já publicada no GHCR e tar histórico de aproximadamente **217 MB**. Isso é uma *referência de planejamento*, **não** o tamanho verificado de um novo backup.
- Google Drive: conector autenticado disponível em uma conta de consumidor (domínio `gmail.com`). A raiz continha o arquivo privado preexistente **`academia-arcana-backup.7z`**, ID `1fNXYWk4UgFcptN39EpQg1vX-Jty-X5LT`, tamanho **17.824 bytes**, criado em 27/10/2026; permissões retornadas: **somente proprietário**. **Não foi aberto, baixado ou modificado.** Por dimensão e extensão, **não atesta backup OCI da imagem**; finalidade e conteúdo não verificados.
- Dropbox: conexão pessoal autenticada disponível; raiz listada sem arquivos; nenhuma pasta/cópia de release foi encontrada. **Plano e capacidade atual não verificados**.
- As integrações disponíveis **não forneceram cota efetivamente livre** do Google Drive nem Dropbox. Não inferir quota real de um plano nominal.

Fontes públicas de referência:
- Google One anuncia **até 15 GB** em contas gratuitas, compartilhados por Drive/Gmail/Fotos: https://one.google.com/about/plans?gl=BR&hl=pt-BR . A capacidade realmente disponível pode ser inferior, e alguns cadastros novos começam com quota menor.
- Dropbox Basic oferece **2 GB**, se a conta estiver de fato no plano Basic: https://help.dropbox.com/pt-br/plans/dropbox-basic-faq . Exceder a quota pode impedir uploads e resultar em outras restrições: https://help.dropbox.com/storage-space/over-quota .
- O provedor de destino **não tem política de retenção imutável por 30 dias comprovada**; quota gratuita e arquivo privado não são WORM, Object Lock ou backup com custódia independente.

## 2. Arquitetura proposta em duas etapas separadas

### Etapa A — cópia em provedor distinto (redução de risco, ainda não satisfaz #594)

**Candidato preferencial:** Google Drive já conectado, somente se a conta tiver quota livre comprovada e o fluxo de upload/download de binário OCI grande funcionar. Ele está fora do domínio de exclusão do GHCR/GitHub, sem custos obrigatórios **desde que o limite da conta não seja excedido**. Dropbox pessoal é alternativa contingente sujeita a confirmação de plano/quota.

Destino proposto **ainda não criado**: `Academia Arcana/Seguranca/OCI/off-ghcr/` em pasta privada sem compartilhamento público. Criar pasta ou transferir arquivo exige autorização **separada e explícita** após comprovar quota, identidade da conta, caminhos e integridade.

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
| Imagem GHCR de origem com digest completo SHA256 | PENDENTE |
| Digest OCI manifest SHA256 / blobs verificados | PENDENTE |
| SHA256 completo do tar OCI e tamanho em bytes | PENDENTE |
| Provedor/conta/tenant e caminho de destino | CANDIDATO: Drive; NÃO APROVADO |
| Cota livre confirmada antes do upload | NÃO VERIFICADA |
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

**Próximo gatilho material:** confirmar capacidade livre, custódia/autorizações e uma **imagem de release com digest aprovado**. Até então: PREPARADO PARA DECISÃO, NÃO BACKUP EXECUTADO.
