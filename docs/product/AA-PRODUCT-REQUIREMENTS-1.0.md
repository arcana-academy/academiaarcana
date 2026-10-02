# AA-PRODUCT-REQUIREMENTS-1.0 — Requisitos Canônicos

> Autoridade: `docs/product/AA-PRODUCT-1.0.md`.
>
> Este documento transforma decisões de Produto em comportamentos verificáveis. Implementação e testes técnicos pertencem aos chats responsáveis.

## 1. Modelo de estados

Toda funcionalidade relevante deve considerar, conforme aplicável:

- INICIAL;
- CARREGANDO;
- VAZIO;
- ATIVO;
- PARCIALMENTE_CONCLUÍDO;
- CONCLUÍDO;
- ERRO;
- INDISPONÍVEL;
- SEM_DADOS;
- OFFLINE, quando a capacidade suportar operação offline.

Ausência de dados não pode ser representada como zero ou baixo desempenho sem justificativa.

## 2. Requisitos

### AA-PROD-R001 — Ciclo canônico
**Objetivo:** manter coerência entre módulos.  
**Usuário:** estudante.  
**Comportamento:** capacidades devem se conectar a objetivo, planejamento, estudo, prática, feedback, revisão, progresso e adaptação.  
**Regras:** nenhum módulo deve criar um ciclo paralelo que substitua o principal.  
**Acessibilidade:** transições e próximos passos devem ser compreensíveis.  
**Aceitação:** cada módulo novo identifica sua posição no ciclo ou justifica explicitamente por que é suporte transversal.  
**Prioridade:** P0.  
**Status:** APROVADO/ATIVO.

### AA-PROD-R002 — Rota ≠ capacidade concluída
**Objetivo:** impedir falsos positivos de maturidade.  
**Comportamento:** status depende do comportamento entregue, não da existência de rota/componente.  
**Aceitação:** documentação e release notes usam capacidade funcional como unidade de conclusão.  
**Prioridade:** P0.  
**Status:** ATIVO.

### AA-PROD-R003 — Organização do conhecimento
**Objetivo:** permitir estruturação e retomada do conhecimento.  
**Comportamento:** Grimório → Caderno → Capítulo → Página.  
**Aceitação:** ownership, hierarquia e ordenação permanecem coerentes; páginas podem virar contexto de estudo/prática.  
**Prioridade:** P0.  
**Status:** IMPLEMENTADO.

### AA-PROD-R004 — Planejamento acionável
**Objetivo:** transformar intenção em próximo passo.  
**Comportamento:** tarefas e agenda representam ações reais de estudo.  
**Aceitação:** tarefa possui proprietário, título e data quando requerida; revisões podem ser planejadas.  
**Prioridade:** P0.  
**Status:** IMPLEMENTADO.

### AA-PROD-R005 — Foco sem confundir tempo com aprendizagem
**Objetivo:** apoiar execução concentrada.  
**Comportamento:** registrar sessões de foco.  
**Aceitação:** duração é observável; sessão não é tratada como domínio.  
**Prioridade:** P0.  
**Status:** IMPLEMENTADO.

### AA-PROD-R006 — Prática educacional nativa
**Objetivo:** produzir ação cognitiva sobre conteúdo.  
**Comportamento:** estudante responde/soluciona/explica/aplica.  
**Aceitação:** atividade tem contexto, resposta, resultado e possibilidade de repetição; falha não pune.  
**Prioridade:** P1.  
**Status:** CONCLUÍDO V1.

### AA-PROD-R007 — Recuperação antes da referência
**Objetivo:** observar recuperação sem releitura imediata.  
**Comportamento:** referência completa permanece oculta até a tentativa.  
**Aceitação:** uma tentativa é registrada antes da exposição da referência.  
**Prioridade:** P1.  
**Status:** CONCLUÍDO V1.

### AA-PROD-R008 — Proveniência da evidência
**Objetivo:** impedir interpretação excessiva.  
**Comportamento:** cada evidência educacional identifica origem, contexto e confiança.  
**Aceitação:** autoavaliação aparece como autoavaliação; domínio objetivo não é afirmado sem evidência adequada.  
**Prioridade:** P1.  
**Status:** ATIVO; implementação parcial quanto à nomenclatura de domínio.

### AA-PROD-R009 — Revisão baseada em evidência
**Objetivo:** direcionar revisão por necessidade educacional.  
**Comportamento:** V1 pode usar resultado da recuperação e intervalo temporal.  
**Aceitação:** recomendação explica o motivo; ausência de histórico resulta em baixa confiança/sem programação; estudante pode levar a revisão ao cronograma.  
**Prioridade:** P1.  
**Status:** CONCLUÍDO V1 — heurística.

### AA-PROD-R010 — Feedback educacional
**Objetivo:** transformar resultado em próximo passo.  
**Comportamento:** feedback descreve resultado e, quando possível, motivo/próxima ação.  
**Aceitação:** feedback não reduz a experiência a XP; erro não vira incapacidade.  
**Prioridade:** P1.  
**Status:** CONCLUÍDO V1.

### AA-PROD-R011 — Lacunas como hipótese
**Objetivo:** identificar pontos que merecem investigação.  
**Comportamento:** sinal só surge com evidência suficiente e é revisável.  
**Aceitação:** fonte/evidência é mostrada; há ação de investigação; não há diagnóstico.  
**Prioridade:** P1.  
**Status:** CONCLUÍDO V1.

### AA-PROD-R012 — Perfil educacional dinâmico
**Objetivo:** adaptar suporte sem rotular.  
**Comportamento:** sinais mudam com novas evidências.  
**Aceitação:** ausência de dados é distinta de baixo desempenho; sinais possuem confiança; nenhuma categoria permanente é necessária.  
**Prioridade:** P1.  
**Status:** CONCLUÍDO V1.

### AA-PROD-R013 — Estatísticas educacionais separadas
**Objetivo:** tornar aprendizagem observável sem misturar gamificação.  
**Comportamento:** métricas educacionais e gamificadas aparecem separadas.  
**Aceitação:** definição, unidade/fonte e estado vazio são identificáveis; pequenas amostras não recebem interpretação exagerada.  
**Prioridade:** P1.  
**Status:** CONCLUÍDO V1.

### AA-PROD-R014 — Gamificação responsável
**Objetivo:** usar gamificação como suporte.  
**Comportamento:** XP, streak, níveis e conquistas reforçam visibilidade e continuidade.  
**Regras:** não punir artificialmente; não bloquear produto; não representar domínio.  
**Aceitação:** falha de prática não reduz capacidade de uso; perda de streak não apaga evidência.  
**Prioridade:** P0/P1.  
**Status:** ATIVO.

### AA-PROD-R015 — Autonomia do estudante
**Objetivo:** preservar agência.  
**Comportamento:** recomendações explicam motivo e permanecem ajustáveis quando aplicável.  
**Aceitação:** estudante consegue compreender recomendação e seguir outro caminho quando permitido.  
**Prioridade:** P1.  
**Status:** ATIVO.

### AA-PROD-R016 — Personalização em cinco dimensões
**Objetivo:** permitir ajuste da experiência.  
**Dimensões:** visual, funcional, educacional, cognitiva, temporal.  
**Aceitação:** alterações são compreensíveis, controláveis e reversíveis quando suportado.  
**Prioridade:** P0/P1.  
**Status:** IMPLEMENTADO BÁSICO.

### AA-PROD-R017 — Acessibilidade estrutural
**Objetivo:** garantir acesso à experiência.  
**Regras:** WCAG 2.2 AA; teclado; foco; contraste; sem cor exclusiva; redução de movimento; linguagem clara; estados compreensíveis.  
**Aceitação:** cada capacidade relevante possui validação de acessibilidade apropriada.  
**Prioridade:** P0.  
**Status:** ATIVO.

### AA-PROD-R018 — Mestre Arcano delimitado
**Objetivo:** fornecer inteligência útil sem autoridade indevida.  
**Pode:** explicar, organizar, recomendar, propor exercícios, apoiar planejamento/revisão/metacognição.  
**Não pode:** inventar, diagnosticar, alterar estado crítico sem autorização, acessar indiscriminadamente, burlar limites.  
**Aceitação:** contexto é autorizado e mínimo; incerteza é explicitada; fontes externas são tratadas como evidência a verificar.  
**Prioridade:** P1/P2/P3.  
**Status:** V1 IMPLEMENTADO TECNICAMENTE.

### AA-PROD-R019 — Estados de erro e ausência
**Objetivo:** evitar ambiguidades de produto.  
**Comportamento:** cada fluxo relevante distingue erro, vazio, indisponível e sem dados.  
**Aceitação:** usuário recebe mensagem compreensível e ação de recuperação quando aplicável.  
**Prioridade:** P0.  
**Status:** ATIVO.

### AA-PROD-R020 — Dependências interdomínio
**Objetivo:** permitir execução coordenada.  
**Comportamento:** requisito deve declarar domínio responsável, fonte de verdade e critério de aceitação.  
**Aceitação:** nenhum requisito crítico fica sem proprietário.  
**Prioridade:** P0.  
**Status:** ATIVO.

### AA-PROD-R021 — Domínio acadêmico objetivo
**Objetivo:** medir domínio sem sobreinterpretar autoavaliação.  
**Comportamento:** domínio confirmado só pode ser afirmado por evidência adequada à tarefa.  
**Aceitação:** sistema distingue autoavaliação, evidência objetiva e ausência de evidência.  
**Prioridade:** P1.  
**Status:** PENDÊNCIA INTERDOMÍNIO.

## 3. Critério geral de aceitação de Produto

Uma funcionalidade importante só pode ser promovida para IMPLEMENTADA quando:

- o comportamento for observável;
- os estados relevantes estiverem definidos;
- os critérios forem verificáveis;
- acessibilidade estiver coberta;
- a fonte de verdade estiver identificada;
- a relação com o ciclo estiver clara;
- os limites e incertezas estiverem visíveis;
- não existir conflito crítico de Produto.

## 4. Dependências técnicas a encaminhar

Os requisitos podem exigir participação de:

- Architecture;
- Design System;
- UI/UX;
- Mundo Visual;
- Linguagem;
- Education;
- Learning;
- Adaptive;
- Intelligence;
- Database/Supabase;
- Security;
- QA/Testes;
- Integrations;
- Documentation.

Produto define o contrato; cada domínio decide a implementação dentro de sua autoridade.
