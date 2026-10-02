# AA-PRODUCT-CHAT-01-AUDIT-2026-10-02 — Auditoria e Consolidação

## 1. Escopo da auditoria

Data: **2026-10-02**

Repositório auditado: `arcana-academy/academiaarcana`.

Referências principais consultadas:

- `docs/product/AA-PRODUCT-1.0.md`
- `docs/product/AA-PRODUCT-P1-EDUCATIONAL-CORE.md`
- `docs/architecture/AA-ARCHITECTURE-1.0.md`
- implementação de Practice/Education/Adaptive/Learning/Statistics;
- mapa de navegação atual;
- PR #453 (fechamento do núcleo educacional P1);
- PR #455 (endurecimento da superfície RPC de tentativa educacional);
- documentação de integração e baseline técnica para separar evidência atual de evidência histórica.

## 2. Classificação do conhecimento

| Conhecimento | Classificação | Evidência/observação |
|---|---|---|
| Academia Arcana é plataforma educacional gamificada | APROVADA + IMPLEMENTADA COMO BASE | Product baseline + superfícies atuais |
| Ciclo Objetivo → Planejamento → Estudo → Prática → Feedback → Revisão → Progresso → Adaptação | DECISÃO ATIVA | AA-PROD-001 |
| Grimório → Caderno → Capítulo → Página | CONFIRMADA + IMPLEMENTADA | arquitetura/workspace atuais |
| Prática/Recuperação P1 | IMPLEMENTADA V1 | /pratica + contratos + persistência |
| Revisão baseada em evidência | IMPLEMENTADA V1 | adaptive/p1 |
| Lacunas revisáveis | IMPLEMENTADA V1 | adaptive/p1 |
| Perfil educacional dinâmico | IMPLEMENTADA V1 | adaptive/p1 + estatísticas |
| Estatísticas educacionais separadas de gamificação | IMPLEMENTADA V1 | /estatisticas |
| Social funcional completo | PENDENTE | rota/superfície preparada, função real não concluída |
| Mestre Arcano avançado como tutor/planejador | PLANEJADA / EM EVOLUÇÃO | V1 técnico presente; capacidades avançadas não fechadas |
| Domínio acadêmico objetivo | PENDENTE / NÃO CONFIRMADO | implementação atual usa autoavaliação |
| Baseline técnica anterior como estado atual | OBSOLETA COMO EVIDÊNCIA DE STATUS | `technical-baseline.md` declara explicitamente ser snapshot histórico |

## 3. Conflitos encontrados

### C-01 — Drift entre baseline 1.0 e fechamento P1

**Problema:** `AA-PRODUCT-1.0.md` ainda marcava B01–B07 como PENDENTE e descrevia a prática/revisão/lacunas/perfil/estatísticas como ausentes, enquanto `AA-PRODUCT-P1-EDUCATIONAL-CORE.md` e o código atual já registravam o P1 como implementado V1.

**Impacto:** CRÍTICO. Poderia levar chats downstream a recriar trabalho já integrado ou considerar capacidades fechadas como faltantes.

**Correção executada:** baseline 1.0 reescrita como estado canônico atual; backlog B01–B07 promovido para CONCLUÍDO V1.

**Validação:** referências agora apontam para o P1 educacional como estado atual e preservam somente a limitação de domínio objetivo.

### C-02 — Mapa oficial omitia superfícies funcionais reais

**Problema:** o mapa inicial não listava Workspace, Cadernos e Prática, apesar de essas estruturas existirem no produto atual.

**Impacto:** ALTO. Risco de duplicidade, conflito de nomenclatura e decisões sobre módulos inexistentes ou incompletos.

**Correção executada:** Workspace, Cadernos e Prática foram canonizados; Objetivo foi definido como conceito do ciclo, não como tela obrigatória.

**Validação:** catálogo `AA-PRODUCT-MODULES-1.0.md` e baseline estão alinhados com navegação/arquitetura observadas.

### C-03 — Autoavaliação podendo ser interpretada como domínio confirmado

**Problema:** o fluxo de prática gera `evidence_score` determinístico a partir de strong/partial/insufficient definidos pelo próprio estudante. Ainda assim, a camada de Learning exibe “Evidência forte de domínio” quando há três ou mais tentativas com média ≥ 90%.

**Impacto:** CRÍTICO. A semântica atual pode exceder a força da evidência disponível.

**Correção de Produto executada:** a decisão canônica passa a classificar esses dados como **evidência autorreportada**, adequada para sinais, revisão e exploração, mas insuficiente para afirmar domínio objetivo isoladamente.

**Validação:** P1.5 foi rebaixado para PARCIAL e foi criado o requisito AA-PROD-R021.

**Pendência técnica:** Education/Learning/UI devem reconciliar nomes, estados e testes da implementação com essa terminologia.

### C-04 — Revisão “adaptativa” excessivamente forte na descrição

**Problema:** a política V1 usa principalmente o último resultado e um intervalo fixo de 1/3/7 dias.

**Impacto:** MÉDIO. É uma heurística útil para V1, mas não equivale a um modelo completo de revisão adaptativa multidimensional.

**Correção executada:** a nomenclatura canônica passou a ser **revisão baseada em evidência — heurística V1**. Modelos mais sofisticados ficam em P2.

### C-05 — Objetivo como etapa sem entidade independente

**Problema:** o ciclo começa por Objetivo, mas não existe módulo independente de “Objetivos” no conjunto atual.

**Decisão:** resolver como conceito transversal no V1; tarefas, missões e contexto podem materializar objetivos. Gestão explícita de objetivos fica em P2.

**Impacto:** resolvido em Produto; sem pendência crítica.

## 4. Correções consolidadas

1. Baseline de Produto atualizada para o estado real de 2026-10-02.
2. Catálogo oficial de módulos criado.
3. Requisitos canônicos e critérios de aceitação consolidados.
4. Prática/Workspace/Caderno incorporados ao mapa oficial.
5. Limite da autoavaliação formalizado.
6. P1.5 reclassificado como PARCIAL quanto a domínio objetivo.
7. Revisão V1 reclassificada como heurística, não como modelo universal.
8. Objetivo formalizado como conceito transversal V1.
9. Gamificação explicitamente separada de domínio.
10. Mestre Arcano delimitado como assistente contextual V1, com capacidades avançadas em P2/P3.
11. Estados de produto e critérios de conclusão formalizados.

## 5. Pendências interdomínio

### PENDÊNCIA INTERDOMÍNIO PI-01

**PROBLEMA:** representação de “domínio” ainda usa linguagem mais forte que a proveniência real da evidência.

**DOMÍNIO RESPONSÁVEL:** Learning + Education; UI/UX para apresentação.

**IMPACTO:** risco de sobreinterpretação pedagógica.

**DECISÃO NECESSÁRIA:** distinguir explicitamente autoavaliação, evidência objetiva e domínio confirmado.

**INFORMAÇÃO QUE ESTE CHAT FORNECE:**
- “strong/partial/insufficient” atuais = autoavaliação da recuperação;
- autoavaliação isolada não confirma domínio;
- “strong-evidence” não deve ser apresentado como confirmação objetiva;
- domínio objetivo exige critério apropriado à tarefa.

### PENDÊNCIA INTERDOMÍNIO PI-02

**PROBLEMA:** testes e métricas devem refletir a nova taxonomia de evidência.

**DOMÍNIO RESPONSÁVEL:** Learning + QA + UI/UX.

**IMPACTO:** documentação, interface e testes podem divergir.

**DECISÃO NECESSÁRIA:** atualizar terminologia de UI/contratos/testes para “evidência autorreportada” onde apropriado.

**INFORMAÇÃO QUE ESTE CHAT FORNECE:** AA-PROD-R008 e AA-PROD-R021.

### PENDÊNCIA INTERDOMÍNIO PI-03

**PROBLEMA:** evolução do modelo de revisão além da heurística V1.

**DOMÍNIO RESPONSÁVEL:** Adaptive + Education + Learning.

**IMPACTO:** não crítico para V1, mas necessário antes de promover a adaptação avançada.

**DECISÃO NECESSÁRIA:** definir sinais, calibração, confiança, replanejamento e avaliação do modelo.

**INFORMAÇÃO QUE ESTE CHAT FORNECE:** V1 = heurística baseada em evidência recente; P2 = adaptação mais sofisticada.

## 6. Dependências para outros chats

### Architecture
Receber somente regras de fronteira funcional, sem mudança da responsabilidade arquitetural:
- P1.5 partial;
- ownership da evidência;
- objetivo como conceito transversal;
- Prática como capacidade educacional.

### Education
Receber:
- prática/retrieval;
- feedback;
- proveniência da evidência;
- autoavaliação ≠ domínio.

### Learning
Receber:
- taxonomia de domínio;
- necessidade de separar evidence source de mastery claim;
- estados desconhecido/insuficiente;
- necessidade de revisão de nomenclatura.

### Adaptive
Receber:
- revisão V1 como heurística;
- limites de confiança;
- requisitos para evolução P2.

### UI/UX + Mundo Visual + Linguagem
Receber:
- nomenclatura de autoavaliação;
- sem certeza indevida;
- estados de vazio/erro/indisponível;
- autonomia.

### Intelligence
Receber:
- Mestre Arcano V1 contextual;
- sem domínio inventado;
- sem alteração crítica sem autorização.

### QA
Receber:
- critérios observáveis de P1;
- cenários de baixa evidência;
- regressão da separação gamificação vs aprendizagem;
- terminologia de autoavaliação.

### Database/Supabase
Receber:
- não há decisão de schema nova neste chat;
- persistência deve continuar respeitando as regras de ownership e segurança já estabelecidas.

### Integrations
Receber:
- integrações externas são projeções/apoio, não fonte substituta da verdade educacional.

## 7. Não foram promovidos

Os seguintes itens permanecem deliberadamente fora de “concluído”:

- social funcional completo;
- gestão explícita de objetivos;
- domínio objetivo universal;
- adaptação avançada;
- Mestre Arcano tutor/planejador avançado;
- experiências multimodais/imersivas;
- experimentos P4 sem validação.

## 8. Auditoria final de não-regressão

| Verificação | Estado |
|---|---|
| Identidade do produto clara | PASS |
| Problema e transformação definidos | PASS |
| Proposta de valor coerente | PASS |
| Público e inclusão delimitados | PASS |
| Escopo dentro/fora/futuro/experimental | PASS |
| Ciclo canônico preservado | PASS |
| Modelo educacional coerente | PASS |
| Adaptação sem rótulos rígidos | PASS |
| Mapa de módulos completo | PASS |
| Workspace/Prática/Caderno reconciliados | PASS |
| Gamificação separada de domínio | PASS |
| Personalização em cinco dimensões | PASS |
| Acessibilidade + Neurodesign | PASS |
| Mestre Arcano com limites | PASS |
| Prioridades P0–P4 | PASS |
| Requisitos verificáveis | PASS |
| Estados relevantes | PASS |
| Dependências interdomínio | PASS |
| Conflitos críticos identificados | PASS |
| P1 sem falsa promoção de domínio | PASS COM PENDÊNCIA PI-01/PI-02 |
| Documento baseline sincronizado | PASS |

## 9. Estado final da auditoria

O domínio de Produto está **consolidado como contrato canônico**, mas o fechamento de todas as decisões relacionadas à evidência de domínio ainda depende de implementação/validação em Education, Learning, UI/UX e QA.

O Produto não possui decisão crítica escondida.

As capacidades futuras permanecem explicitamente separadas de V1.

## 10. Próxima ação

Executar PI-01 e PI-02 nos domínios responsáveis antes de promover P1.5 para CONCLUÍDO e antes de apresentar qualquer métrica atual como “domínio confirmado”.
