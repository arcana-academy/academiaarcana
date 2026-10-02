# AA-PRODUCT-MODULES-1.0 — Mapa Oficial de Módulos

> Autoridade: `docs/product/AA-PRODUCT-1.0.md`.
>
> Este documento define o contrato funcional dos módulos e superfícies de Produto. Implementação técnica pertence aos domínios responsáveis.

## 1. Regras de leitura

- **IMPLEMENTADO** significa capacidade observável no produto atual.
- **IMPLEMENTADO BÁSICO/V1** indica superfície funcional com escopo deliberadamente limitado.
- **PENDENTE** indica capacidade ainda não concluída.
- Uma rota isolada não promove uma capacidade a concluída.
- O catálogo inclui módulos de navegação e estruturas funcionais necessárias para representar o modelo real do produto.

## 2. Catálogo canônico

### 2.1 Santuário
**Objetivo:** ser o centro contextual da jornada.  
**Problema:** fragmentação entre contexto, continuidade e próximos passos.  
**Usuário:** estudante autenticado.  
**Função principal:** mostrar estado atual e retomada da jornada.  
**Funcionalidades:** contexto, continuação, progresso, missões, agenda, recomendação adaptativa, acesso ao Mestre Arcano.  
**Entradas:** progresso, planejamento, gamificação, sinais adaptativos, identidade.  
**Saídas:** contexto resumido, próximos pontos de entrada, recomendações.  
**Dependências:** learning, planning, gamification, adaptive, authorization, identity.  
**Regras:** não inventar estado; recomendação não é ordem.  
**Prioridade:** P0.  
**Status:** IMPLEMENTADO.  
**Aceitação:** usuário autenticado vê contexto coerente; ausência de dados gera estado vazio; recomendação expõe motivo.

### 2.2 Academia
**Objetivo:** ser portal da experiência educacional.  
**Problema:** falta de ponto de entrada organizado para as áreas de estudo.  
**Usuário:** estudante autenticado.  
**Função principal:** encaminhar para espaços educacionais.  
**Funcionalidades:** acesso ao Workspace, Cronograma e Santuário.  
**Entradas:** estado de navegação.  
**Saídas:** links contextuais.  
**Dependências:** learning, planning, sanctuary.  
**Regras:** não criar fonte de verdade duplicada.  
**Prioridade:** P0.  
**Status:** IMPLEMENTADO COMO PORTAL.  
**Aceitação:** cada destino é válido e a página não promete capacidades que não possui.

### 2.3 Grimórios
**Objetivo:** organizar a biblioteca pessoal de conhecimento.  
**Problema:** conteúdo disperso e difícil de retomar.  
**Usuário:** estudante autenticado.  
**Função principal:** listar e acessar estruturas de conhecimento próprias.  
**Funcionalidades:** criação/listagem/acesso conforme capacidade atual.  
**Entradas:** estruturas learning.  
**Saídas:** navegação para conteúdo.  
**Dependências:** learning, identity, authorization.  
**Regras:** ownership obrigatório.  
**Prioridade:** P0.  
**Status:** IMPLEMENTADO.  
**Aceitação:** somente recursos próprios são apresentados; vazio é explícito.

### 2.4 Workspace
**Objetivo:** editar e organizar conteúdo.  
**Problema:** separar biblioteca da operação diária de escrita/organização.  
**Usuário:** estudante autenticado.  
**Função principal:** operar a hierarquia Grimório → Caderno → Capítulo → Página.  
**Funcionalidades:** navegação hierárquica e edição conforme recursos atuais.  
**Entradas:** estruturas learning.  
**Saídas:** conteúdo persistido.  
**Dependências:** learning, authorization.  
**Regras:** UI não acessa persistência diretamente.  
**Prioridade:** P0.  
**Status:** IMPLEMENTADO.  
**Aceitação:** hierarquia preservada; ownership e ordenação respeitados.

### 2.5 Cadernos
**Objetivo:** fornecer estrutura intermediária entre Grimório e Capítulo.  
**Problema:** organização insuficientemente granular.  
**Usuário:** estudante autenticado.  
**Função principal:** agrupar capítulos.  
**Funcionalidades:** estrutura, ordenação e navegação.  
**Entradas:** Grimório.  
**Saídas:** capítulos organizados.  
**Dependências:** learning.  
**Regras:** é estrutura funcional do Workspace, não item de navegação principal.  
**Prioridade:** P0.  
**Status:** IMPLEMENTADO COMO ESTRUTURA.  
**Aceitação:** capítulos pertencem ao caderno correto e a cascata hierárquica permanece íntegra.

### 2.6 Capítulos
**Objetivo:** agrupar páginas relacionadas.  
**Problema:** conteúdo longo sem segmentação.  
**Usuário:** estudante autenticado.  
**Função principal:** estruturar páginas.  
**Funcionalidades:** criação, ordenação e navegação conforme Workspace.  
**Entradas:** Caderno.  
**Saídas:** coleção de páginas.  
**Dependências:** learning.  
**Regras:** pertencimento hierárquico obrigatório.  
**Prioridade:** P0.  
**Status:** IMPLEMENTADO.  
**Aceitação:** capítulo aparece no caderno correto e suas páginas mantêm ordem.

### 2.7 Páginas
**Objetivo:** ser unidade de conteúdo/registro e contexto de prática.  
**Problema:** ausência de unidade concreta de estudo.  
**Usuário:** estudante autenticado.  
**Função principal:** armazenar conteúdo e ancorar ações educacionais.  
**Funcionalidades:** conteúdo, progresso e entrada para prática.  
**Entradas:** Capítulo, conteúdo do estudante.  
**Saídas:** conteúdo, contexto de aprendizagem, progresso.  
**Dependências:** learning, education, authorization.  
**Regras:** ownership e integridade da hierarquia.  
**Prioridade:** P0.  
**Status:** IMPLEMENTADO.  
**Aceitação:** conteúdo próprio é recuperável; progresso pode ser observado sem confundi-lo com domínio.

### 2.8 Prática
**Objetivo:** converter conteúdo em ação cognitiva.  
**Problema:** estudar somente por leitura não produz evidência suficiente de recuperação.  
**Usuário:** estudante autenticado.  
**Função principal:** recuperação ativa com autoavaliação explícita.  
**Funcionalidades:** criar atividade, responder, registrar resultado, feedback, referência posterior, revisão e sinal de lacuna.  
**Entradas:** Página, pergunta, resposta de referência, autoavaliação.  
**Saídas:** tentativa, evidência autorreportada, revisão, sinais educacionais.  
**Dependências:** education, learning, adaptive, planning.  
**Regras:** referência só após tentativa; falha não gera punição; autoavaliação ≠ domínio confirmado.  
**Prioridade:** P1.  
**Status:** IMPLEMENTADO V1.  
**Aceitação:** estudante responde antes da referência; tentativa é persistida; estados vazio/erro/pós-tentativa são claros.

### 2.9 Cronograma
**Objetivo:** planejar temporalmente tarefas e revisões.  
**Problema:** intenção sem data e sem próximo passo.  
**Usuário:** estudante autenticado.  
**Função principal:** organizar execução temporal.  
**Funcionalidades:** tarefas, datas, revisões derivadas e projeções externas opcionais.  
**Entradas:** objetivos/tarefas/revisões.  
**Saídas:** agenda operacional.  
**Dependências:** planning, learning, adaptive; integrações quando aplicável.  
**Regras:** fonte de verdade continua na Academia Arcana; provider externo é projeção.  
**Prioridade:** P0.  
**Status:** IMPLEMENTADO.  
**Aceitação:** tarefas persistem com ownership; revisão pode ser adicionada ao cronograma.

### 2.10 Foco
**Objetivo:** apoiar sessões concentradas.  
**Problema:** dificuldade de transformar plano em bloco executável de estudo.  
**Usuário:** estudante autenticado.  
**Função principal:** registrar sessão de foco.  
**Entradas:** duração e contexto de estudo.  
**Saídas:** sessão persistida e histórico.  
**Dependências:** planning.  
**Regras:** duração limitada; sem confundir tempo de foco com domínio.  
**Prioridade:** P0.  
**Status:** IMPLEMENTADO.  
**Aceitação:** duração válida; sessão pertence ao usuário; estados de execução são compreensíveis.

### 2.11 Missões
**Objetivo:** transformar objetivos/eventos reais em ações reconhecíveis.  
**Problema:** baixa visibilidade de próximos marcos de estudo.  
**Usuário:** estudante autenticado.  
**Função principal:** reconhecer tarefas/marcos.  
**Entradas:** estado de estudo/gamificação.  
**Saídas:** missão aberta/concluída.  
**Dependências:** gamification, planning, learning.  
**Regras:** não inventar eventos; não substituir objetivo educacional por XP.  
**Prioridade:** P0/P1.  
**Status:** IMPLEMENTADO BÁSICO.  
**Aceitação:** missão deriva de estado persistido e conclusão não fabrica progresso.

### 2.12 Streak
**Objetivo:** tornar continuidade visível.  
**Problema:** dificuldade em perceber consistência de atividade.  
**Usuário:** estudante autenticado.  
**Função principal:** exibir sequência de atividade registrada.  
**Entradas:** eventos reconhecidos de estudo.  
**Saídas:** sequência atual.  
**Dependências:** gamification.  
**Regras:** indicador de continuidade, não de valor pessoal nem domínio; não bloqueia produto.  
**Prioridade:** P0/P1.  
**Status:** IMPLEMENTADO.  
**Aceitação:** valor reflete eventos reais; perda da sequência não apaga evidência educacional.

### 2.13 Estatísticas
**Objetivo:** tornar progresso e evidências legíveis.  
**Problema:** métricas de atividade podem ser confundidas com aprendizagem.  
**Usuário:** estudante autenticado.  
**Função principal:** exibir métricas separadas de gamificação e educação.  
**Entradas:** evidências educacionais, progresso e gamificação.  
**Saídas:** indicadores com fonte e confiança.  
**Dependências:** learning, adaptive, gamification.  
**Regras:** sem precisão artificial; amostras pequenas precisam de cautela.  
**Prioridade:** P1.  
**Status:** IMPLEMENTADO V1.  
**Aceitação:** cada métrica tem definição/fonte; ausência de dados permanece “sem dados”.

### 2.14 Conquistas
**Objetivo:** reconhecer marcos.  
**Problema:** marcos de trajetória não ficam visíveis.  
**Usuário:** estudante autenticado.  
**Função principal:** exibir conquistas derivadas de eventos reais.  
**Entradas:** eventos gamificados.  
**Saídas:** conquistas desbloqueadas.  
**Dependências:** gamification.  
**Regras:** não representar conquista como domínio acadêmico.  
**Prioridade:** P1.  
**Status:** IMPLEMENTADO BÁSICO.  
**Aceitação:** conquista deriva de evento real e não altera a evidência educacional.

### 2.15 Amigos
**Objetivo:** permitir interação social opcional.  
**Problema:** alguns estudantes podem se beneficiar de conexão social.  
**Usuário:** estudante autenticado.  
**Função principal:** relacionamentos e interação de estudo.  
**Entradas:** conexões autorizadas.  
**Saídas:** estado social.  
**Dependências:** social, identity, authorization, context.  
**Regras:** social é opcional; privacidade e controle são obrigatórios.  
**Prioridade:** P2.  
**Status:** SUPERFÍCIE PREPARADA; FUNÇÃO REAL PENDENTE.  
**Aceitação:** nenhuma funcionalidade social deve ser anunciada como disponível antes da implementação correspondente.

### 2.16 Perfil
**Objetivo:** representar identidade e resumo pessoal.  
**Problema:** identidade e configurações ficam dispersas.  
**Usuário:** estudante autenticado.  
**Função principal:** mostrar identidade e atalhos de jornada/configuração.  
**Entradas:** identidade e dados permitidos.  
**Saídas:** perfil resumido.  
**Dependências:** identity, application.  
**Regras:** não deve absorver estado acadêmico como diagnóstico.  
**Prioridade:** P0.  
**Status:** IMPLEMENTADO BÁSICO.  
**Aceitação:** identidade atual é mostrada; preferências sensíveis permanecem sob controle apropriado.

### 2.17 Personalização
**Objetivo:** permitir ajuste da experiência.  
**Problema:** uma interface única pode aumentar carga ou desconforto.  
**Usuário:** estudante autenticado.  
**Função principal:** controlar preferências visuais, funcionais e de apresentação.  
**Entradas:** escolhas do usuário e preferências ambientais.  
**Saídas:** experiência adaptada.  
**Dependências:** accessibility-preferences, adaptive quando aplicável.  
**Regras:** controlável, compreensível e sem rótulo cognitivo obrigatório.  
**Prioridade:** P0/P1.  
**Status:** IMPLEMENTADO BÁSICO.  
**Aceitação:** alterações têm efeito observável e podem ser revertidas quando suportado.

### 2.18 Configurações
**Objetivo:** centralizar controles de conta, preferências e integrações.  
**Problema:** controle operacional fragmentado.  
**Usuário:** estudante autenticado.  
**Função principal:** gerenciar configurações permitidas.  
**Entradas:** preferências e integrações.  
**Saídas:** estado configurado.  
**Dependências:** identity, integrations, trust, accessibility/preferences.  
**Regras:** credenciais e segredos não são tratados como preferências visuais; alterações críticas exigem autorização.  
**Prioridade:** P0.  
**Status:** IMPLEMENTADO BÁSICO.  
**Aceitação:** estados conectado/desconectado/erro são claros; segredo nunca fica visível indevidamente.

### 2.19 Mestre Arcano
**Objetivo:** apoiar aprendizagem e organização por inteligência contextual.  
**Problema:** estudante precisa de apoio contextual sem perder autonomia ou segurança.  
**Usuário:** estudante autenticado.  
**Função principal:** assistente contextual V1.  
**Entradas:** contexto autorizado, perguntas do estudante, fontes autorizadas.  
**Saídas:** explicações, sugestões, recomendações, exercícios propostos e contexto.  
**Dependências:** intelligence + domínios consumidores.  
**Regras:** sem invenção de dados; sem superusuário; fontes externas são evidência não confiável até verificação; ações críticas exigem autorização.  
**Prioridade:** P1/P2/P3.  
**Status:** IMPLEMENTADO TECNICAMENTE; V1 delimitado.  
**Aceitação:** contexto é mínimo e autorizado; resposta distingue fato de inferência; falhas de provider não criam dados fictícios.

## 3. Estruturas que não são módulos independentes

### Objetivo
Conceito do ciclo de aprendizagem. Não exige tela própria.

### Flonts
Runtime/camada de apoio arquitetural. Não é módulo funcional principal da navegação atual.

## 4. Regra de evolução

Qualquer novo módulo precisa apresentar:

- problema;
- usuário;
- objetivo;
- relação com o ciclo;
- dados/entradas;
- saídas;
- dependências;
- regras;
- acessibilidade;
- critérios de aceitação;
- prioridade;
- estado de maturidade.

Sem isso, a capacidade permanece PROPOSTA ou HIPÓTESE.
