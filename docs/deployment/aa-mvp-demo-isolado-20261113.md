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
