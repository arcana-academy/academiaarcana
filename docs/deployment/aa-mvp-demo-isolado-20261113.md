# Academia Arcana — candidata pessoal de MVP individual isolado

Checkpoint: AA-MVP-DEMO-ISOLADO-20261113. Base: PR #864 SHA f69322d6d3f65184ddbfd6679256c93f675d0d64.
Branch: work/aa-mvp-individual-demo-isolado-20261113. Repositório: arcana-academy/academiaarcana.

## Escopo
- Reutilização do piloto MVP, seus oito módulos visuais e o Design System/Flonts oficiais; não recria a aplicação.
- A persistência da demonstração é APENAS sessionStorage, por aba, com esquema sintético validado, sem banco nem sincronização. Não é persistência estudantil.
- O acesso ao ambiente isolado é uma credencial HTTP Basic independente, não é login Supabase nem autenticação de estudantes.
- Com ARCANA_DEMO_ISOLATED=1, apenas /design-system/pilots/mvp e /api/health ficam acessíveis. As rotas reais e APIs são bloqueadas.
- Preserva as verificações de origem e CSP/nonce do proxy existente, não usa a identidade real no layout e rejeita configuração Supabase/DB no prebuild do modo isolado.
- Se não houver arquivo runtime /etc/secrets/AA_DEMO_GATE com senha de pelo menos 24 caracteres, o acesso é negado com 503.
- Usuário HTTP Basic: arcana-demo. A senha deve ser configurada exclusivamente no serviço de demonstração, em arquivo de segredo runtime-only. Não registrar em repositório, envVars, logs ou links.

## Preflight obrigatório de infraestrutura
1. Confirmar custo incremental pago R$ 0 inclusive eventual cobrança de bandwidth/build pipeline: Render Free pode cobrar uso excedente se houver método de pagamento. O conector Render não oferece ferramenta de leitura de billing, spend cap ou franquia.
2. Confirmar mecanismo para criar arquivo de segredo de runtime sem disponibilizá-lo durante o build. O conector Render create_web_service oferece somente envVars (expostas tanto no build quanto no runtime); não oferece Secret Files.
3. Somente então criar um novo Render Web Service explicitamente Free, sem herdar env groups, credenciais, projetos Supabase, banco, serviços ou dados da produção. Auto Deploy OFF, branch isolada, sem merge.
4. Não configurar NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY nem qualquer chave de backend. ARCANA_DEMO_ISOLATED=1.
5. Exigir teste de build da candidata sem nenhuma variável do Supabase; CI padrão não substitui esse teste.
6. Testar HTTP 503 sem secret; HTTP 401 sem credencial; HTTP 200 com credencial; HTTP 404 em /estatisticas, /api/ready e demais rotas reais; /api/health sem credencial; nenhuma chamada ao Supabase de produção.
7. Testar comportamento local de tarefas, capítulos, páginas, notas, missões, cronograma, persistência na aba, falha de Web Storage, segurança, responsividade e WCAG 2.2 AA.

## Governança
- O Render principal academiaarcana e a branch main não podem ser modificados por este piloto.
- O piloto não comprova integração real com o @Data, login real, persistência por usuário, RLS nem disponibilidade aos estudantes.
- Manter Draft/NO-GO de todas as PRs e bloqueios #536, #594, #595, #530 e de QA assistiva. Sem merge, deploy produtivo ou publicação estudantil.

## Pacote de pré-deploy — versão preparada, sem publicação

**Disponibilidade:** o Quality Gate completo e a compilação sem Supabase passaram no commit `897edf8dbd05a51a6707ce5530e902a8d521a53f`. As futuras alterações desta branch precisam de CI novo; não reaproveitar PASS de SHA anterior. Consultar os workflows ligados à PR #865 para confirmar o SHA exato. O workflow adicional também valida no servidor efêmero do CI: saúde 200, acesso 503 sem Secret File e 404 em rotas protegidas. HTTP 401/200 com senha só será testado após provisionamento isolado autorizado.

**Regra operacional:** este documento NÃO dá autorização para criar serviço ou publicar. Candidata em PR Draft/NO-GO, separada da `main`. Não criar recursos de produção e não utilizar contas de estudantes.

### Checklist antes de clicar em Create/Deploy

- [ ] Confirmar no dashboard Render do workspace escolhido que **não existe meio de pagamento cadastrado** OU que um limite efetivo de gasto bloqueia cobranças, conforme plano vigente. Inspecionar franquia remanescente de bandwidth, pipeline minutes e horas Free. **Sem prova de custo incremental pago R$ 0, interromper.**
- [ ] Confirmar que o workspace autoriza novo Web Service `Free` sem migração automática de plano e que a interface de criação possui a opção de definir branch e `Auto Deploy Off`.
- [ ] Confirmar a configuração de **Secret File separado**, com nome `AA_DEMO_GATE`, conteúdo aleatório de 24–256 caracteres exclusivamente no Render Dashboard, não na conversa nem no repositório. Render documenta acesso runtime via `/etc/secrets/<filename>`; validar especificamente se o material NÃO entra no bundle, logs ou build artifacts.
- [ ] Verificar que a demo não tem env groups vinculados nem herda envs/segredos de `academiaarcana` de produção.
- [ ] Verificar que o SHA da branch é o mesmo do Quality Gate e do build isolado aprovados, e revisar apontamentos DeepSource JavaScript; se houver check obrigatório reprovado, **NO-GO**.
- [ ] Confirmar escopo pessoal e ausência de dados pessoais. Nunca distribuir o URL ou senha para estudantes.

### Definição EXCLUSIVA do serviço de demonstração futuro (não criado)

| Campo | Valor preparado |
| --- | --- |
| Novo serviço (nome sugerido) | `academiaarcana-mvp-demo-isolado` |
| Tipo/runtime | Web Service / Node.js |
| Repositório | `https://github.com/arcana-academy/academiaarcana` |
| Branch | `work/aa-mvp-individual-demo-isolado-20261113` |
| Plano | `Free`, condicionado à prova de custo pago R$ 0 |
| Região | `Ohio` (mesma localização histórica; não vincular recursos) |
| Auto Deploy | **Off** |
| Env única da aplicação | `ARCANA_DEMO_ISOLATED=1` |
| Secret File | `AA_DEMO_GATE`, gerado no Render, nunca em env var |
| Health check | `/api/health` |
| Start command | `npm start` |
| Build command | `node scripts/security/assert-build-secret-isolation-536.cjs && node scripts/verify-dependency-lifecycle-scripts.cjs && npm ci --ignore-scripts && npm rebuild unrs-resolver --ignore-scripts=false && npm run build` |

**Não configurar** `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_*`, `OPENAI_API_KEY`, URLs de banco, `DATABASE_URL`, `HONEYBADGER_*`, `PARALLEL_API_KEY`, `EXA_API_KEY` ou qualquer env group da produção. Não reutilizar `render.yaml` de produção para criar a demonstração: ele aponta explicitamente para `main` e contém bindings produtivos. A aplicação deve continuar sem dados remotos.

No Render, a gravação de Secret Files pode disparar um novo deploy. Caso o serviço inicial seja criado antes do Secret File, ele permanecerá **fail-closed 503** até o arquivo existir. Não interpretar 503 como autorização para remover a proteção. É proibido configurar a senha em ambiente de build ou salvar em commits.

### Verificações de aceite depois de um futuro deploy autorizado

1. Abrir apenas o endereço do **novo serviço**. `GET /api/health` deve resultar em HTTP 200 com JSON não sensível. Sem Secret File, a rota do piloto deve devolver 503, não 200.
2. Com arquivo presente e sem credenciais, `GET /design-system/pilots/mvp` deve devolver 401 com desafio HTTP Basic; credenciais erradas não devem conceder acesso.
3. Com usuário `arcana-demo` e senha gerada no Render (inserida somente no navegador pessoal), a página da demo deve responder e exibir claramente **dados fictícios / demonstração pessoal**.
4. `/estatisticas`, `/santuario`, `/api/ready` e outras rotas reais devem continuar fechadas em HTTP 404; verificar também métodos de escrita/API e tentativa de acesso sem Origin válido. Sem execução dessas verificações, não declarar validação de isolamento em hospedagem.
5. Explorar as oito áreas do piloto: completar página, adicionar tarefa, concluir missão, editar nota, verificar progresso, reiniciar estado, atualizar aba e reabrir em outra aba. A persistência deve ser **somente sessionStorage da aba**; não há login estudantil nem banco.
6. Verificar navegador com Web Storage desabilitado, navegação por teclado, foco visível, leitura por tecnologia assistiva, contraste, mobile e responsividade (WCAG 2.2 AA) sem alegar aprovação de auditoria independente.
7. Confirmar ausência de tráfego a Supabase/serviços externos que contenham dados do projeto real, checar custos do Render e registrar evidências sem senha nos logs ou capturas.
8. Se qualquer controle falhar: não publicar o endereço, interromper, registrar evidência e reverter somente o serviço isolado mediante autorização. Nenhum rollback da produção é necessário porque ela não foi alterada.

### Evidências e retomada

- PR Draft: https://github.com/arcana-academy/academiaarcana/pull/865
- Quality Gate: https://github.com/arcana-academy/academiaarcana/actions/runs/43508955612
- Build isolado: https://github.com/arcana-academy/academiaarcana/actions/runs/43508955485
- Checkpoint do primeiro ciclo: https://github.com/arcana-academy/academiaarcana/pull/865#issuecomment-6865147407
- Fonte oficial de preços/limites: https://render.com/docs/free
- Gestão de Secret Files: https://render.com/docs/configure-environment-variables
- Deploy manual/Auto Deploy Off: https://render.com/docs/deploys

**Não concluído até a implantação pessoal autorizada:** confirmação do faturamento e franquias do workspace Render; criação de serviço novo; configuração de Secret File; prova HTTP 401/200 com autenticação; auditoria humana WCAG; revisão independente. Publicação estudantil continua estritamente NO-GO.
